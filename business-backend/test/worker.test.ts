import assert from "node:assert/strict";
import test from "node:test";
import type { AppConfig } from "../src/config.js";
import type { DeanAgentClient } from "../src/deanAgent.js";
import { modelPortraitOutputSchema, type AssessmentJob } from "../src/domain.js";
import type { PortraitModel } from "../src/model.js";
import { dimensionsFor, validatePortraitOutput } from "../src/rubrics.js";
import { loadPromptDefinition } from "../src/prompts.js";
import { AssessmentWorker, type WorkerRepository } from "../src/worker.js";

const config: AppConfig = {
  host: "127.0.0.1",
  port: 8002,
  databaseUrl: "postgresql://unused",
  deanAgentBaseUrl: "http://deanagent.test",
  llmProvider: "test",
  llmBaseUrl: "http://model.test/v1",
  llmModel: "test-model",
  llmApiKey: "test-key",
  workerPollMs: 10,
  workerLeaseSeconds: 120,
  workerMaxAttempts: 3,
};

test("worker assembles evidence and persists a validated assessment", async () => {
  const prompt = await loadPromptDefinition("potential_student");
  const job: AssessmentJob = {
    id: "00000000-0000-4000-8000-000000000001",
    trait_set_id: "00000000-0000-4000-8000-000000000002",
    source_record_type: "student",
    source_record_id: "student-1",
    portrait_type: "potential_student",
    rubric_version: "v1.2",
    prompt_version: "v1.2",
    prompt_hash: prompt.hash,
    model_provider: "test",
    model_name: "test-model",
    trait_snapshot: {
      entity_type: "student",
      affiliation_scope: "external",
      student_stage: "potential",
      relationship_traits: [],
      human_judgments: [],
      confirmed_by: "reviewer",
      confirmed_at: "2026-09-05T00:00:00.000Z",
    },
    attempt_count: 1,
  };
  let completed: Parameters<WorkerRepository["completeAssessment"]>[0] | null = null;
  let savedInput = false;
  const repository: WorkerRepository = {
    claimNextJob: async () => job,
    renewLease: async () => true,
    saveInput: async () => { savedInput = true; },
    completeAssessment: async (args) => { completed = args; },
    failAssessment: async () => { throw new Error("unexpected failure"); },
  };
  const deanAgent = {
    loadStudent: async () => [
      { endpoint: "/api/students/student-1", fetchedAt: "2026-09-05T00:00:00.000Z", body: {
        name: "Student", email: "student@example.com",
      } },
      { endpoint: "/api/students/student-1/papers", fetchedAt: "2026-09-05T00:00:00.000Z", body: {
        items: [{ title: "Paper", publication_date: "2025-01-01", author_order: 1 }],
      } },
    ],
  } as unknown as DeanAgentClient;
  const model: PortraitModel = {
    analyze: async (_bundle, input) => {
      const evidenceId = input.evidence[0]!.evidence_id;
      const raw = {
        analysis_status: "completed" as const,
        core_conclusion: "Credible potential",
        dimensions: dimensionsFor("potential_student", false).map((definition) => ({
          section_code: definition.sectionCode,
          dimension_code: definition.code,
          evidence_state: "positive" as const,
          review_state: "clear" as const,
          evaluation_method: "model_data" as const,
          score: 80,
          confidence: 0.8,
          conclusion: "Supported",
          evidence_ids: [evidenceId],
          missing_inputs: [],
          conflict_reason: null,
        })),
        highlight_signals: [],
        recommendation_reasons: [],
        recommended_actions: [],
        missing_data: [],
        cooperation_message: null,
      };
      return validatePortraitOutput(raw, input, modelPortraitOutputSchema.parse);
    },
  };

  const worker = new AssessmentWorker(config, repository, deanAgent, model);
  assert.equal(await worker.runOnce(), true);
  assert.equal(savedInput, true);
  assert.ok(completed);
  assert.equal(completed.recommendationLevel, "优先");
  assert.equal(completed.weightedScore, 80);
  assert.equal(completed.dimensions.length, 6);
});
