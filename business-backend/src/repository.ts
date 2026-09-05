import type { Database } from "./db.js";
import { withTransaction } from "./db.js";
import type {
  AssessmentJob,
  NormalizedPortraitInput,
  PortraitType,
  SourceRecordType,
  TraitSet,
  TraitWrite,
} from "./domain.js";
import type { RecommendationLevel, ValidatedDimension } from "./rubrics.js";
import { sha256, stableJson } from "./utils.js";

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapTraitRow(row: Record<string, unknown>): TraitSet {
  return {
    id: String(row.id),
    source_system: "deanagent",
    source_record_type: row.source_record_type as SourceRecordType,
    source_record_id: String(row.source_record_id),
    entity_type: row.entity_type as TraitSet["entity_type"],
    affiliation_scope: row.affiliation_scope as TraitSet["affiliation_scope"],
    student_stage: row.student_stage as TraitSet["student_stage"],
    relationship_traits: row.relationship_traits as TraitSet["relationship_traits"],
    human_judgments: row.human_judgments as TraitSet["human_judgments"],
    confirmed_by: String(row.confirmed_by),
    confirmed_at: iso(row.confirmed_at),
    valid_from: iso(row.valid_from),
    valid_to: row.valid_to ? iso(row.valid_to) : null,
    created_at: iso(row.created_at),
  };
}

export class PortraitRepository {
  constructor(private readonly database: Database) {}

  async replaceTraits(recordType: SourceRecordType, recordId: string, traits: TraitWrite): Promise<TraitSet> {
    return withTransaction(this.database, async (client) => {
      await client.query(
        `SELECT id FROM talent_subject_trait_sets
         WHERE source_system = 'deanagent' AND source_record_type = $1 AND source_record_id = $2 AND valid_to IS NULL
         FOR UPDATE`,
        [recordType, recordId],
      );
      await client.query(
        `UPDATE talent_subject_trait_sets SET valid_to = now()
         WHERE source_system = 'deanagent' AND source_record_type = $1 AND source_record_id = $2 AND valid_to IS NULL`,
        [recordType, recordId],
      );
      const result = await client.query(
        `INSERT INTO talent_subject_trait_sets (
           source_record_type, source_record_id, entity_type, affiliation_scope, student_stage,
           relationship_traits, human_judgments, confirmed_by, confirmed_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          recordType,
          recordId,
          traits.entity_type,
          traits.affiliation_scope,
          traits.student_stage,
          JSON.stringify(traits.relationship_traits),
          JSON.stringify(traits.human_judgments),
          traits.confirmed_by,
          traits.confirmed_at,
        ],
      );
      const row = result.rows[0] as Record<string, unknown> | undefined;
      if (!row) throw new Error("Trait insert returned no row");
      return mapTraitRow(row);
    });
  }

  async getCurrentTraits(recordType: SourceRecordType, recordId: string): Promise<TraitSet | null> {
    const result = await this.database.query(
      `SELECT * FROM talent_subject_trait_sets
       WHERE source_system = 'deanagent' AND source_record_type = $1 AND source_record_id = $2 AND valid_to IS NULL`,
      [recordType, recordId],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? mapTraitRow(row) : null;
  }

  async enqueueAssessment(args: {
    traits: TraitSet;
    portraitType: PortraitType;
    rubricVersion: string;
    promptVersion: string;
    promptHash: string;
    modelProvider: string;
    modelName: string;
    idempotencyKey: string;
    requestedBy: string;
  }): Promise<{ assessment: Record<string, unknown>; created: boolean }> {
    const inserted = await this.database.query(
      `INSERT INTO portrait_assessments (
         trait_set_id, source_record_type, source_record_id, portrait_type, rubric_version,
         prompt_version, prompt_hash, model_provider, model_name, idempotency_key,
         trait_snapshot, requested_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [
        args.traits.id,
        args.traits.source_record_type,
        args.traits.source_record_id,
        args.portraitType,
        args.rubricVersion,
        args.promptVersion,
        args.promptHash,
        args.modelProvider,
        args.modelName,
        args.idempotencyKey,
        JSON.stringify(args.traits),
        args.requestedBy,
      ],
    );
    if (inserted.rows[0]) return { assessment: inserted.rows[0], created: true };
    const existing = await this.database.query(
      "SELECT * FROM portrait_assessments WHERE idempotency_key = $1",
      [args.idempotencyKey],
    );
    const assessment = existing.rows[0] as Record<string, unknown> | undefined;
    if (!assessment) throw new Error("Idempotent assessment lookup failed");
    if (
      assessment.source_record_type !== args.traits.source_record_type ||
      assessment.source_record_id !== args.traits.source_record_id ||
      assessment.portrait_type !== args.portraitType
    ) {
      throw new Error("IDEMPOTENCY_KEY_CONFLICT");
    }
    return { assessment, created: false };
  }

  async claimNextJob(workerId: string, leaseSeconds: number, maxAttempts: number): Promise<AssessmentJob | null> {
    return withTransaction(this.database, async (client) => {
      await client.query(
        `UPDATE portrait_assessments
         SET status = 'failed', error_code = 'MAX_ATTEMPTS_EXCEEDED',
             error_message = 'Worker lease expired after maximum attempts', completed_at = now(), updated_at = now(),
             locked_by = NULL, lease_expires_at = NULL
         WHERE status = 'running' AND lease_expires_at < now() AND attempt_count >= $1`,
        [maxAttempts],
      );
      await client.query(
        `UPDATE portrait_assessments
         SET status = 'queued', next_attempt_at = now(), updated_at = now(), locked_by = NULL, lease_expires_at = NULL
         WHERE status = 'running' AND lease_expires_at < now() AND attempt_count < $1`,
        [maxAttempts],
      );
      const result = await client.query(
        `WITH next_job AS (
           SELECT id FROM portrait_assessments
           WHERE status = 'queued' AND next_attempt_at <= now() AND attempt_count < $3
           ORDER BY queued_at
           FOR UPDATE SKIP LOCKED
           LIMIT 1
         )
         UPDATE portrait_assessments a
         SET status = 'running', started_at = COALESCE(started_at, now()), attempt_count = attempt_count + 1,
             locked_by = $1, lease_expires_at = now() + ($2 * interval '1 second'), updated_at = now(),
             error_code = NULL, error_message = NULL
         FROM next_job
         WHERE a.id = next_job.id
         RETURNING a.*`,
        [workerId, leaseSeconds, maxAttempts],
      );
      return (result.rows[0] as AssessmentJob | undefined) ?? null;
    });
  }

  async saveInput(
    assessmentId: string,
    workerId: string,
    input: NormalizedPortraitInput,
    inputHash: string,
  ): Promise<void> {
    const result = await this.database.query(
      `UPDATE portrait_assessments
       SET input_snapshot = $2, input_hash = $3, contact_available = $4, updated_at = now()
       WHERE id = $1 AND status = 'running' AND locked_by = $5`,
      [assessmentId, JSON.stringify(input), inputHash, input.subject.contact_available, workerId],
    );
    if (result.rowCount !== 1) throw new Error("Assessment lease was lost before input persistence");
  }

  async renewLease(assessmentId: string, workerId: string, leaseSeconds: number): Promise<boolean> {
    const result = await this.database.query(
      `UPDATE portrait_assessments
       SET lease_expires_at = now() + ($3 * interval '1 second'), updated_at = now()
       WHERE id = $1 AND status = 'running' AND locked_by = $2`,
      [assessmentId, workerId, leaseSeconds],
    );
    return result.rowCount === 1;
  }

  async completeAssessment(args: {
    assessmentId: string;
    status: "completed" | "insufficient" | "needs_review";
    output: Record<string, unknown>;
    coreConclusion: string;
    weightedScore: number | null;
    evidenceCoverage: number | null;
    recommendationLevel: RecommendationLevel | null;
    dimensions: ValidatedDimension[];
    workerId: string;
  }): Promise<void> {
    await withTransaction(this.database, async (client) => {
      for (const dimension of args.dimensions) {
        await client.query(
          `INSERT INTO portrait_dimension_results (
             assessment_id, section_code, dimension_code, dimension_label, display_order, weight,
             evidence_state, review_state, evaluation_method, score, confidence, conclusion,
             evidence, missing_inputs, conflict_reason
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [
            args.assessmentId,
            dimension.sectionCode,
            dimension.code,
            dimension.label,
            dimension.order,
            dimension.weight,
            dimension.evidence_state,
            dimension.review_state,
            dimension.evaluation_method,
            dimension.score,
            dimension.confidence,
            dimension.conclusion,
            JSON.stringify(dimension.evidence),
            JSON.stringify(dimension.missing_inputs),
            dimension.conflict_reason,
          ],
        );
      }
      const updated = await client.query(
        `UPDATE portrait_assessments
         SET status = $2, output_snapshot = $3, core_conclusion = $4, weighted_score = $5,
             output_hash = $9, evidence_coverage = $6, recommendation_level = $7, completed_at = now(), updated_at = now(),
             locked_by = NULL, lease_expires_at = NULL
         WHERE id = $1 AND status = 'running' AND locked_by = $8 AND lease_expires_at > now()`,
        [
          args.assessmentId,
          args.status,
          JSON.stringify(args.output),
          args.coreConclusion,
          args.weightedScore,
          args.evidenceCoverage,
          args.recommendationLevel,
          args.workerId,
          sha256(stableJson(args.output)),
        ],
      );
      if (updated.rowCount !== 1) throw new Error("Assessment lease was lost before completion");
    });
  }

  async failAssessment(
    job: AssessmentJob,
    code: string,
    message: string,
    retryable: boolean,
    maxAttempts: number,
    workerId: string,
  ): Promise<void> {
    const shouldRetry = retryable && job.attempt_count < maxAttempts;
    const delaySeconds = Math.min(60, 5 * 2 ** Math.max(job.attempt_count - 1, 0));
    await this.database.query(
      `UPDATE portrait_assessments
       SET status = $2, error_code = $3, error_message = $4,
           next_attempt_at = CASE WHEN $5 THEN now() + ($6 * interval '1 second') ELSE next_attempt_at END,
           completed_at = CASE WHEN $5 THEN NULL ELSE now() END,
           locked_by = NULL, lease_expires_at = NULL, updated_at = now()
       WHERE id = $1 AND status = 'running' AND locked_by = $7`,
      [job.id, shouldRetry ? "queued" : "failed", code, message.slice(0, 5000), shouldRetry, delaySeconds, workerId],
    );
  }

  async getAssessment(assessmentId: string): Promise<Record<string, unknown> | null> {
    const assessment = await this.database.query("SELECT * FROM portrait_assessments WHERE id = $1", [assessmentId]);
    const row = assessment.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    const dimensions = await this.database.query(
      `SELECT * FROM portrait_dimension_results WHERE assessment_id = $1 ORDER BY section_code, display_order`,
      [assessmentId],
    );
    return { ...row, dimensions: dimensions.rows };
  }

  async getLatestAssessment(recordType: SourceRecordType, recordId: string): Promise<Record<string, unknown> | null> {
    const result = await this.database.query(
      `SELECT * FROM latest_portrait_assessments
       WHERE source_system = 'deanagent' AND source_record_type = $1 AND source_record_id = $2
       ORDER BY completed_at DESC NULLS LAST, created_at DESC LIMIT 1`,
      [recordType, recordId],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.getAssessment(String(row.id));
  }

  async ping(): Promise<void> {
    await this.database.query("SELECT 1");
  }
}
