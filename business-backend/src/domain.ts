import { z } from "zod";

export const sourceRecordTypeSchema = z.enum(["scholar", "student", "academic_student"]);
export const entityTypeSchema = z.enum(["student", "expert"]);
export const affiliationScopeSchema = z.enum(["internal", "external", "unknown"]);
export const studentStageSchema = z.enum(["internal", "applied", "potential", "unknown"]);
export const portraitTypeSchema = z.enum(["potential_student", "external_expert"]);
export const assessmentStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "insufficient",
  "needs_review",
  "failed",
]);

export const relationshipTraitSchema = z.object({
  code: z.string().trim().min(1).max(80),
  source_id: z.string().trim().min(1).max(500),
  source_path: z.string().trim().min(1).max(1000).optional(),
  occurred_at: z.string().datetime().optional(),
  details: z.record(z.string(), z.unknown()).default({}),
});

export const humanJudgmentSchema = z.object({
  id: z.string().trim().min(1).max(200),
  author_id: z.string().trim().min(1).max(200),
  author_name: z.string().trim().min(1).max(200),
  judged_at: z.string().datetime(),
  scope: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(5000),
  recommended_direction: z.string().trim().max(2000).optional(),
});

export const traitWriteSchema = z
  .object({
    entity_type: entityTypeSchema,
    affiliation_scope: affiliationScopeSchema,
    student_stage: studentStageSchema.nullable().default(null),
    relationship_traits: z.array(relationshipTraitSchema).default([]),
    human_judgments: z.array(humanJudgmentSchema).default([]),
    confirmed_by: z.string().trim().min(1).max(200),
    confirmed_at: z.string().datetime(),
  })
  .superRefine((value, context) => {
    if (value.entity_type === "student" && value.student_stage === null) {
      context.addIssue({ code: "custom", message: "student_stage is required for students", path: ["student_stage"] });
    }
    if (value.entity_type === "expert" && value.student_stage !== null) {
      context.addIssue({ code: "custom", message: "student_stage must be null for experts", path: ["student_stage"] });
    }
  });

export type SourceRecordType = z.infer<typeof sourceRecordTypeSchema>;
export type PortraitType = z.infer<typeof portraitTypeSchema>;
export type TraitWrite = z.infer<typeof traitWriteSchema>;

export interface TraitSet extends TraitWrite {
  id: string;
  source_system: "deanagent";
  source_record_type: SourceRecordType;
  source_record_id: string;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
}

export const evidenceSourceTypeSchema = z.enum([
  "deanagent",
  "human_judgment",
  "business_trait",
  "rubric_config",
]);

export const normalizedEvidenceSchema = z.object({
  evidence_id: z.string().min(1),
  source_type: evidenceSourceTypeSchema,
  source_endpoint: z.string().min(1),
  source_id: z.string().min(1),
  source_path: z.string().min(1),
  observed_at: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()),
});

export type NormalizedEvidence = z.infer<typeof normalizedEvidenceSchema>;

export const normalizedPortraitInputSchema = z.object({
  schema_version: z.literal("portrait-input.v1"),
  as_of: z.string().datetime(),
  portrait_type: portraitTypeSchema,
  subject: z.object({
    source_system: z.literal("deanagent"),
    source_record_type: sourceRecordTypeSchema,
    source_record_id: z.string().min(1),
    entity_type: entityTypeSchema,
    name: z.string(),
    institution: z.string(),
    position: z.string(),
    has_email: z.boolean(),
    has_phone: z.boolean(),
    contact_available: z.boolean(),
  }),
  traits: traitWriteSchema,
  academy_directions: z.object({
    version: z.string(),
    groups: z.array(
      z.object({
        code: z.string(),
        label: z.string(),
        subfields: z.array(z.string()),
      }),
    ),
  }),
  cooperation_eligible: z.boolean(),
  evidence: z.array(normalizedEvidenceSchema),
  source_manifest: z.array(
    z.object({
      endpoint: z.string(),
      fetched_at: z.string().datetime(),
      item_count: z.number().int().nonnegative(),
      truncated: z.boolean(),
      source_updated_at: z.string().nullable().optional(),
    }),
  ),
});

export type NormalizedPortraitInput = z.infer<typeof normalizedPortraitInputSchema>;

export const evidenceStateSchema = z.enum(["positive", "insufficient", "negative"]);
export const reviewStateSchema = z.enum(["clear", "conflict"]);
export const evaluationMethodSchema = z.enum(["model_data", "human_judgment", "hybrid"]);

export const modelDimensionSchema = z.object({
  section_code: z.string().min(1),
  dimension_code: z.string().min(1),
  evidence_state: evidenceStateSchema,
  review_state: reviewStateSchema,
  evaluation_method: evaluationMethodSchema,
  score: z.number().min(0).max(100).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  conclusion: z.string().trim().min(1).max(5000),
  evidence_ids: z.array(z.string()).max(100),
  missing_inputs: z.array(z.string().trim().min(1).max(500)).max(30),
  conflict_reason: z.string().trim().min(1).max(3000).nullable().default(null),
}).strict();

export const modelPortraitOutputSchema = z.object({
  analysis_status: z.enum(["completed", "insufficient", "needs_review"]),
  core_conclusion: z.string().trim().min(1).max(10000),
  dimensions: z.array(modelDimensionSchema).min(1),
  highlight_signals: z.array(z.string().trim().min(1).max(200)).max(5),
  recommendation_reasons: z.array(z.string().trim().min(1).max(1000)).max(3),
  recommended_actions: z.array(z.string().trim().min(1).max(1000)).max(5),
  missing_data: z.array(z.string().trim().min(1).max(500)).max(50),
  cooperation_message: z.string().trim().min(1).max(1000).nullable().default(null),
}).strict();

export type ModelDimension = z.infer<typeof modelDimensionSchema>;
export type ModelPortraitOutput = z.infer<typeof modelPortraitOutputSchema>;

export interface DimensionDefinition {
  sectionCode: string;
  code: string;
  label: string;
  order: number;
  weight: number | null;
}

export interface AssessmentJob {
  id: string;
  trait_set_id: string;
  source_record_type: SourceRecordType;
  source_record_id: string;
  portrait_type: PortraitType;
  rubric_version: string;
  prompt_version: string;
  prompt_hash: string;
  model_provider: string;
  model_name: string;
  trait_snapshot: TraitWrite;
  attempt_count: number;
}
