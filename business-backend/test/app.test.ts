import assert from "node:assert/strict";
import test from "node:test";
import { createApp, type AppRepository } from "../src/app.js";
import type { AppConfig } from "../src/config.js";
import type { TraitSet } from "../src/domain.js";

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

function traitSet(overrides: Partial<TraitSet> = {}): TraitSet {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    source_system: "deanagent",
    source_record_type: "scholar",
    source_record_id: "expert-1",
    entity_type: "expert",
    affiliation_scope: "external",
    student_stage: null,
    relationship_traits: [{ code: "activity_guest", source_id: "activity-1", details: {} }],
    human_judgments: [],
    confirmed_by: "reviewer",
    confirmed_at: "2026-09-05T00:00:00.000Z",
    valid_from: "2026-09-05T00:00:00.000Z",
    valid_to: null,
    created_at: "2026-09-05T00:00:00.000Z",
    ...overrides,
  };
}

function repository(current: TraitSet | null = traitSet()) {
  const enqueued: Array<Record<string, unknown>> = [];
  const mock: AppRepository = {
    ping: async () => undefined,
    replaceTraits: async (recordType, recordId, traits) => traitSet({
      ...traits,
      source_record_type: recordType,
      source_record_id: recordId,
    }),
    getCurrentTraits: async () => current,
    enqueueAssessment: async (args) => {
      enqueued.push(args);
      return { assessment: { id: "00000000-0000-4000-8000-000000000099", status: "queued" }, created: true };
    },
    getAssessment: async () => null,
    getLatestAssessment: async () => null,
  };
  return { mock, enqueued };
}

test("PUT traits redacts PII before persistence", async () => {
  const { mock } = repository();
  let persisted: TraitSet | null = null;
  mock.replaceTraits = async (recordType, recordId, traits) => {
    persisted = traitSet({ ...traits, source_record_type: recordType, source_record_id: recordId });
    return persisted;
  };
  const app = createApp(config, mock);
  const response = await app.inject({
    method: "PUT",
    url: "/api/subjects/scholar/expert-1/traits",
    payload: {
      entity_type: "expert",
      affiliation_scope: "external",
      student_stage: null,
      relationship_traits: [],
      human_judgments: [{
        id: "judgment-1",
        author_id: "reviewer-1",
        author_name: "Reviewer",
        judged_at: "2026-09-05T00:00:00.000Z",
        scope: "cooperation",
        content: "Email expert@example.com or call 13812345678",
      }],
      confirmed_by: "reviewer-1",
      confirmed_at: "2026-09-05T00:00:00.000Z",
    },
  });
  assert.equal(response.statusCode, 200);
  assert.doesNotMatch(JSON.stringify(persisted), /expert@example\.com|13812345678/);
  await app.close();
});

test("external experts with academy relationships remain external and enqueue external portrait", async () => {
  const { mock, enqueued } = repository();
  const app = createApp(config, mock);
  const response = await app.inject({
    method: "POST",
    url: "/api/portrait-assessments",
    headers: { "idempotency-key": "request-1" },
    payload: { source_record_type: "scholar", source_record_id: "expert-1", requested_by: "reviewer" },
  });
  assert.equal(response.statusCode, 202);
  assert.equal(enqueued[0]?.portraitType, "external_expert");
  assert.equal((enqueued[0]?.traits as TraitSet).affiliation_scope, "external");
  await app.close();
});

test("enqueue requires an idempotency key, configured model, and confirmed traits", async () => {
  const missingKey = createApp(config, repository().mock);
  assert.equal((await missingKey.inject({
    method: "POST",
    url: "/api/portrait-assessments",
    payload: { source_record_type: "scholar", source_record_id: "expert-1", requested_by: "reviewer" },
  })).statusCode, 422);
  await missingKey.close();

  const noModel = createApp({ ...config, llmApiKey: undefined }, repository().mock);
  assert.equal((await noModel.inject({
    method: "POST",
    url: "/api/portrait-assessments",
    headers: { "idempotency-key": "request-2" },
    payload: { source_record_type: "scholar", source_record_id: "expert-1", requested_by: "reviewer" },
  })).statusCode, 503);
  await noModel.close();

  const noTraits = createApp(config, repository(null).mock);
  assert.equal((await noTraits.inject({
    method: "POST",
    url: "/api/portrait-assessments",
    headers: { "idempotency-key": "request-3" },
    payload: { source_record_type: "scholar", source_record_id: "expert-1", requested_by: "reviewer" },
  })).statusCode, 422);
  await noTraits.close();
});

test("latest endpoint does not fall back when no terminal assessment exists", async () => {
  const app = createApp(config, repository().mock);
  const response = await app.inject({ method: "GET", url: "/api/subjects/scholar/expert-1/portraits/latest" });
  assert.equal(response.statusCode, 404);
  assert.equal(response.json().error.code, "ASSESSMENT_NOT_FOUND");
  await app.close();
});
