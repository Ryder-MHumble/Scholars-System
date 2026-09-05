import assert from "node:assert/strict";
import test from "node:test";
import type { AppConfig } from "../src/config.js";
import type { ModelPortraitOutput, NormalizedPortraitInput } from "../src/domain.js";
import { ChatCompletionsModel } from "../src/model.js";
import type { PromptBundle } from "../src/prompts.js";
import { dimensionsFor } from "../src/rubrics.js";

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

const input: NormalizedPortraitInput = {
  schema_version: "portrait-input.v1",
  as_of: "2026-09-05T00:00:00.000Z",
  portrait_type: "potential_student",
  subject: {
    source_system: "deanagent",
    source_record_type: "student",
    source_record_id: "student-1",
    entity_type: "student",
    name: "Candidate",
    institution: "University",
    position: "Student",
    has_email: false,
    has_phone: false,
    contact_available: false,
  },
  traits: {
    entity_type: "student",
    affiliation_scope: "external",
    student_stage: "potential",
    relationship_traits: [],
    human_judgments: [],
    confirmed_by: "reviewer",
    confirmed_at: "2026-09-05T00:00:00.000Z",
  },
  academy_directions: { version: "v1", groups: [] },
  cooperation_eligible: false,
  evidence: [],
  source_manifest: [],
};

function validOutput(): ModelPortraitOutput {
  return {
    analysis_status: "insufficient",
    core_conclusion: "Insufficient evidence",
    dimensions: dimensionsFor("potential_student", false).map((definition) => ({
      section_code: definition.sectionCode,
      dimension_code: definition.code,
      evidence_state: "insufficient",
      review_state: "clear",
      evaluation_method: "model_data",
      score: null,
      confidence: null,
      conclusion: "Missing evidence",
      evidence_ids: [],
      missing_inputs: ["evidence"],
      conflict_reason: null,
    })),
    highlight_signals: [],
    recommendation_reasons: [],
    recommended_actions: [],
    missing_data: ["evidence"],
    cooperation_message: null,
  };
}

const prompt: PromptBundle = { system: "system", user: "user", hash: "hash" };

test("retries malformed model output once and validates the correction", async () => {
  const originalFetch = globalThis.fetch;
  const requests: unknown[] = [];
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    requests.push(JSON.parse(String(init?.body)));
    const content = requests.length === 1 ? "not json" : JSON.stringify(validOutput());
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
  }) as typeof fetch;
  try {
    const result = await new ChatCompletionsModel(config).analyze(prompt, input);
    assert.equal(requests.length, 2);
    assert.equal(result.output.analysis_status, "insufficient");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects a second invalid model response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: "still invalid" } }] }), { status: 200 })) as typeof fetch;
  try {
    await assert.rejects(new ChatCompletionsModel(config).analyze(prompt, input), /strict JSON/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
