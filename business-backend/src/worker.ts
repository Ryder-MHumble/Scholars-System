import { randomUUID } from "node:crypto";
import type { AppConfig } from "./config.js";
import { assemblePortraitInput } from "./assembler.js";
import type { DeanAgentClient } from "./deanAgent.js";
import { errorDetails, AppError } from "./errors.js";
import type { PortraitModel } from "./model.js";
import { loadPromptBundle } from "./prompts.js";
import type { PortraitRepository } from "./repository.js";
import { calculatePotentialStudentSummary } from "./rubrics.js";

export type WorkerRepository = Pick<
  PortraitRepository,
  "claimNextJob" | "renewLease" | "saveInput" | "completeAssessment" | "failAssessment"
>;

export class AssessmentWorker {
  private readonly workerId = `portrait-worker-${process.pid}-${randomUUID()}`;
  private stopping = false;
  private loopPromise: Promise<void> | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly repository: WorkerRepository,
    private readonly deanAgent: DeanAgentClient,
    private readonly model: PortraitModel,
  ) {}

  start(): void {
    if (!this.loopPromise) this.loopPromise = this.runLoop();
  }

  async stop(): Promise<void> {
    this.stopping = true;
    await this.loopPromise;
  }

  private async runLoop(): Promise<void> {
    while (!this.stopping) {
      const worked = await this.runOnce().catch(() => false);
      if (!worked && !this.stopping) await new Promise((resolve) => setTimeout(resolve, this.config.workerPollMs));
    }
  }

  async runOnce(): Promise<boolean> {
    const job = await this.repository.claimNextJob(
      this.workerId,
      this.config.workerLeaseSeconds,
      this.config.workerMaxAttempts,
    );
    if (!job) return false;

    const heartbeatMs = Math.max(1_000, Math.floor((this.config.workerLeaseSeconds * 1_000) / 3));
    const heartbeat = setInterval(() => {
      void this.repository.renewLease(job.id, this.workerId, this.config.workerLeaseSeconds).catch(() => undefined);
    }, heartbeatMs);

    try {
      const assembled = await assemblePortraitInput(
        this.deanAgent,
        job.source_record_type,
        job.source_record_id,
        job.portrait_type,
        job.trait_snapshot,
      );
      await this.repository.saveInput(job.id, this.workerId, assembled.input, assembled.inputHash);
      const prompt = await loadPromptBundle(assembled.input);
      if (prompt.hash !== job.prompt_hash) {
        throw new AppError(
          "PROMPT_HASH_MISMATCH",
          "The queued assessment prompt no longer matches the deployed prompt",
          false,
        );
      }
      const result = await this.model.analyze(prompt, assembled.input);
      const hasConflict =
        result.output.analysis_status === "needs_review" ||
        result.dimensions.some((dimension) => dimension.review_state === "conflict");
      const summary =
        job.portrait_type === "potential_student"
          ? calculatePotentialStudentSummary(
              result.dimensions,
              assembled.input.subject.contact_available,
              hasConflict,
            )
          : { weightedScore: null, evidenceCoverage: null, recommendationLevel: null };

      await this.repository.completeAssessment({
        assessmentId: job.id,
        status: result.output.analysis_status,
        output: result.output,
        coreConclusion: result.output.core_conclusion,
        weightedScore: summary.weightedScore,
        evidenceCoverage: summary.evidenceCoverage,
        recommendationLevel: summary.recommendationLevel,
        dimensions: result.dimensions,
        workerId: this.workerId,
      });
    } catch (error) {
      const details = errorDetails(error);
      await this.repository.failAssessment(
        job,
        details.code,
        details.message,
        details.retryable,
        this.config.workerMaxAttempts,
        this.workerId,
      );
    } finally {
      clearInterval(heartbeat);
    }
    return true;
  }
}
