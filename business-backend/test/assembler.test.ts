import assert from "node:assert/strict";
import test from "node:test";
import { assemblePortraitInput } from "../src/assembler.js";
import type { DeanAgentClient, DeanAgentResponse } from "../src/deanAgent.js";
import type { TraitWrite } from "../src/domain.js";
import { stableJson } from "../src/utils.js";

const fetchedAt = "2026-09-05T00:00:00.000Z";
const traits: TraitWrite = {
  entity_type: "student",
  affiliation_scope: "external",
  student_stage: "potential",
  relationship_traits: [],
  human_judgments: [],
  confirmed_by: "reviewer-1",
  confirmed_at: fetchedAt,
};

function response(endpoint: string, body: unknown): DeanAgentResponse {
  return { endpoint, fetchedAt, body };
}

function fakeClient(method: "loadScholar" | "loadStudent" | "loadAcademicStudent", responses: DeanAgentResponse[]) {
  return { [method]: async () => responses } as unknown as DeanAgentClient;
}

for (const fixture of [
  { recordType: "scholar" as const, method: "loadScholar" as const },
  { recordType: "student" as const, method: "loadStudent" as const },
  { recordType: "academic_student" as const, method: "loadAcademicStudent" as const },
]) {
  test(`normalizes and redacts ${fixture.recordType} DeanAgent records`, async () => {
    const detail = response(`/api/${fixture.recordType}/subject-1`, {
      name: "Candidate",
      institution: "University",
      email: "candidate@example.com",
      phone: "13812345678",
      github_url: "https://github.com/example",
      api_key: "must-not-persist",
      representative_publications: [{ title: "Paper", publication_date: "2025-01-01", author_order: 1 }],
    });
    const related = response(`/api/${fixture.recordType}/subject-1/papers`, {
      items: [{ title: "Paper", abstract: "Contact candidate@example.com" }],
      total: 1,
    });
    const assembled = await assemblePortraitInput(
      fakeClient(fixture.method, [detail, related]),
      fixture.recordType,
      "subject-1",
      "potential_student",
      traits,
      new Date(fetchedAt),
    );
    const serialized = stableJson(assembled.input);
    assert.equal(assembled.input.subject.has_email, true);
    assert.equal(assembled.input.subject.has_phone, true);
    assert.equal(assembled.input.subject.contact_available, true);
    assert.doesNotMatch(serialized, /candidate@example\.com|13812345678|must-not-persist/);
    assert.ok(assembled.input.evidence.every((item) => item.evidence_id.startsWith("ev_")));
    assert.equal(assembled.input.source_manifest.length, 2);
    assert.equal(assembled.inputHash.length, 64);
  });
}

test("external-expert cooperation eligibility requires a verified relationship or named judgment", async () => {
  const client = fakeClient("loadScholar", [
    response("/api/scholars/expert-1", { name: "Expert" }),
    response("/api/scholars/expert-1/publications", { items: [] }),
  ]);
  const expertTraits: TraitWrite = {
    ...traits,
    entity_type: "expert",
    affiliation_scope: "external",
    student_stage: null,
  };
  const noRelationship = await assemblePortraitInput(
    client,
    "scholar",
    "expert-1",
    "external_expert",
    expertTraits,
    new Date(fetchedAt),
  );
  assert.equal(noRelationship.input.cooperation_eligible, false);

  const relationship = await assemblePortraitInput(
    client,
    "scholar",
    "expert-1",
    "external_expert",
    {
      ...expertTraits,
      relationship_traits: [{ code: "activity_guest", source_id: "activity-1", details: {} }],
    },
    new Date(fetchedAt),
  );
  assert.equal(relationship.input.cooperation_eligible, true);
  assert.equal(relationship.input.subject.entity_type, "expert");
  assert.equal(relationship.input.traits.affiliation_scope, "external");
});
