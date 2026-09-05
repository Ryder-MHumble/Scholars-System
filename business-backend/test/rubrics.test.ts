import assert from "node:assert/strict";
import test from "node:test";
import {
  modelPortraitOutputSchema,
  type ModelPortraitOutput,
  type NormalizedPortraitInput,
  type TraitWrite,
} from "../src/domain.js";
import {
  calculatePotentialStudentSummary,
  dimensionsFor,
  routePortrait,
  validatePortraitOutput,
} from "../src/rubrics.js";

const potentialTraits: TraitWrite = {
  entity_type: "student",
  affiliation_scope: "external",
  student_stage: "potential",
  relationship_traits: [],
  human_judgments: [],
  confirmed_by: "reviewer-1",
  confirmed_at: "2026-09-05T00:00:00.000Z",
};

function input(portraitType: "potential_student" | "external_expert", cooperationEligible = false): NormalizedPortraitInput {
  return {
    schema_version: "portrait-input.v1",
    as_of: "2026-09-05T00:00:00.000Z",
    portrait_type: portraitType,
    subject: {
      source_system: "deanagent",
      source_record_type: portraitType === "potential_student" ? "student" : "scholar",
      source_record_id: "subject-1",
      entity_type: portraitType === "potential_student" ? "student" : "expert",
      name: "Test Subject",
      institution: "Test University",
      position: "Researcher",
      has_email: true,
      has_phone: false,
      contact_available: true,
    },
    traits: portraitType === "potential_student"
      ? potentialTraits
      : { ...potentialTraits, entity_type: "expert", student_stage: null, affiliation_scope: "external" },
    academy_directions: { version: "v1", groups: [] },
    cooperation_eligible: cooperationEligible,
    evidence: [{
      evidence_id: "ev_known",
      source_type: "deanagent",
      source_endpoint: "/api/evidence",
      source_id: "endpoint",
      source_path: "/item/0",
      observed_at: "2026-09-05T00:00:00.000Z",
      payload: { fact: "verified" },
    }],
    source_manifest: [],
  };
}

function outputFor(target: NormalizedPortraitInput, score: number | null = 80): ModelPortraitOutput {
  return {
    analysis_status: score === null ? "insufficient" : "completed",
    core_conclusion: "Conclusion",
    dimensions: dimensionsFor(target.portrait_type, target.cooperation_eligible).map((definition) => ({
      section_code: definition.sectionCode,
      dimension_code: definition.code,
      evidence_state: score === null ? "insufficient" : "positive",
      review_state: "clear",
      evaluation_method: "model_data",
      score,
      confidence: score === null ? null : 0.8,
      conclusion: score === null ? "No evidence" : "Supported",
      evidence_ids: score === null ? [] : ["ev_known"],
      missing_inputs: score === null ? ["facts"] : [],
      conflict_reason: null,
    })),
    highlight_signals: [],
    recommendation_reasons: [],
    recommended_actions: [],
    missing_data: [],
    cooperation_message: target.portrait_type === "external_expert" && !target.cooperation_eligible
      ? "暂未建立两院关系记录"
      : null,
  };
}

test("routes only potential students and external experts", () => {
  assert.equal(routePortrait(potentialTraits), "potential_student");
  assert.equal(routePortrait({ ...potentialTraits, entity_type: "expert", student_stage: null }), "external_expert");
  assert.throws(() => routePortrait({ ...potentialTraits, student_stage: "applied" }));
  assert.throws(() => routePortrait({ ...potentialTraits, entity_type: "expert", student_stage: null, affiliation_scope: "internal" }));
});

test("potential-student output permits a null cooperation message", () => {
  const target = input("potential_student");
  assert.doesNotThrow(() => validatePortraitOutput(outputFor(target), target, modelPortraitOutputSchema.parse));
});

test("external experts without relationships require the standard message and omit cooperation dimensions", () => {
  const target = input("external_expert");
  const output = outputFor(target);
  assert.equal(output.dimensions.length, 6);
  output.cooperation_message = null;
  assert.throws(
    () => validatePortraitOutput(output, target, modelPortraitOutputSchema.parse),
    /standard cooperation message/,
  );
});

test("rejects unknown evidence IDs and scored insufficient dimensions", () => {
  const target = input("potential_student");
  const unknown = outputFor(target);
  unknown.dimensions[0]!.evidence_ids = ["ev_invented"];
  assert.throws(() => validatePortraitOutput(unknown, target, modelPortraitOutputSchema.parse), /unknown evidence ID/);

  const insufficient = outputFor(target, null);
  insufficient.dimensions[0]!.score = 0;
  assert.throws(() => validatePortraitOutput(insufficient, target, modelPortraitOutputSchema.parse));
});

test("rejects scores on human-only judgments and duplicate dimensions", () => {
  const target = input("potential_student");
  target.evidence[0]!.source_type = "human_judgment";
  const human = outputFor(target);
  human.dimensions[0]!.evaluation_method = "human_judgment";
  assert.throws(() => validatePortraitOutput(human, target, modelPortraitOutputSchema.parse), /cannot have a score/);

  const duplicate = outputFor(target);
  duplicate.dimensions[1] = { ...duplicate.dimensions[0]! };
  assert.throws(() => validatePortraitOutput(duplicate, target, modelPortraitOutputSchema.parse), /Duplicate dimension/);
});

test("recommendations use normalized evaluated weight and never count missing dimensions as zero", () => {
  const target = input("potential_student");
  const validated = validatePortraitOutput(outputFor(target), target, modelPortraitOutputSchema.parse).dimensions;
  assert.deepEqual(calculatePotentialStudentSummary(validated, true, false), {
    weightedScore: 80,
    evidenceCoverage: 1,
    recommendationLevel: "优先",
  });

  for (const dimension of validated) {
    if (!["research_output_quality", "research_leadership"].includes(dimension.code)) {
      dimension.score = null;
      dimension.confidence = null;
      dimension.evidence_state = "insufficient";
      dimension.evidence_ids = [];
    }
  }
  const sparse = calculatePotentialStudentSummary(validated, true, false);
  assert.equal(sparse.evidenceCoverage, 0.5);
  assert.equal(sparse.weightedScore, 80);
  assert.equal(sparse.recommendationLevel, "次优先");

  validated.find((dimension) => dimension.code === "research_leadership")!.score = null;
  const tooSparse = calculatePotentialStudentSummary(validated, true, false);
  assert.equal(tooSparse.weightedScore, null);
  assert.equal(tooSparse.recommendationLevel, "待观察");
});
