import type {
  DimensionDefinition,
  ModelDimension,
  ModelPortraitOutput,
  NormalizedPortraitInput,
  PortraitType,
  TraitWrite,
} from "./domain.js";

export const RUBRIC_VERSION = "v1.2";
export const PROMPT_VERSION = "v1.2";

const potentialStudentDimensions: DimensionDefinition[] = [
  { sectionCode: "research_potential", code: "research_output_quality", label: "科研成果质量", order: 0, weight: 0.3 },
  { sectionCode: "research_potential", code: "research_leadership", label: "研究主导能力", order: 1, weight: 0.2 },
  { sectionCode: "research_potential", code: "growth_trajectory", label: "成长趋势", order: 2, weight: 0.15 },
  { sectionCode: "research_potential", code: "academy_direction_match", label: "两院方向匹配", order: 3, weight: 0.15 },
  { sectionCode: "research_potential", code: "engineering_development", label: "工程开发能力", order: 4, weight: 0.1 },
  { sectionCode: "research_potential", code: "industry_collaboration", label: "产学研协同", order: 5, weight: 0.1 },
];

const externalExpertAcademicDimensions: DimensionDefinition[] = [
  { sectionCode: "academic_ability", code: "academic_influence", label: "学术影响力", order: 0, weight: null },
  { sectionCode: "academic_ability", code: "representative_achievements", label: "代表成果", order: 1, weight: null },
  { sectionCode: "academic_ability", code: "recent_activity", label: "近期活跃度", order: 2, weight: null },
  { sectionCode: "academic_ability", code: "originality_interdisciplinary", label: "原创与跨领域能力", order: 3, weight: null },
  { sectionCode: "academic_ability", code: "talent_development", label: "人才培养能力", order: 4, weight: null },
  { sectionCode: "academic_ability", code: "academic_organization", label: "学术组织能力", order: 5, weight: null },
];

const externalExpertCooperationDimensions: DimensionDefinition[] = [
  { sectionCode: "cooperation_value", code: "cooperation_direction_match", label: "方向匹配", order: 0, weight: null },
  { sectionCode: "cooperation_value", code: "existing_cooperation_foundation", label: "已有合作基础", order: 1, weight: null },
  { sectionCode: "cooperation_value", code: "possible_cooperation_directions", label: "可合作方向", order: 2, weight: null },
  { sectionCode: "cooperation_value", code: "contact_status", label: "联系状态", order: 3, weight: null },
];

export function routePortrait(traits: TraitWrite): PortraitType {
  if (traits.entity_type === "student" && traits.student_stage === "potential") {
    return "potential_student";
  }
  if (traits.entity_type === "expert" && traits.affiliation_scope === "external") {
    return "external_expert";
  }
  throw new Error("UNSUPPORTED_TRAIT_COMBINATION");
}

export function dimensionsFor(portraitType: PortraitType, cooperationEligible: boolean): DimensionDefinition[] {
  if (portraitType === "potential_student") return potentialStudentDimensions;
  return cooperationEligible
    ? [...externalExpertAcademicDimensions, ...externalExpertCooperationDimensions]
    : externalExpertAcademicDimensions;
}

export interface ValidatedDimension extends ModelDimension, DimensionDefinition {
  evidence: NormalizedPortraitInput["evidence"];
}

export function validatePortraitOutput(
  raw: unknown,
  input: NormalizedPortraitInput,
  parse: (value: unknown) => ModelPortraitOutput,
): { output: ModelPortraitOutput; dimensions: ValidatedDimension[] } {
  const output = parse(raw);
  const expected = dimensionsFor(input.portrait_type, input.cooperation_eligible);
  const expectedKeys = new Set(expected.map((item) => `${item.sectionCode}:${item.code}`));
  const seen = new Set<string>();
  const evidenceById = new Map(input.evidence.map((item) => [item.evidence_id, item]));

  if (output.dimensions.length !== expected.length) {
    throw new Error(`Expected ${expected.length} dimensions, received ${output.dimensions.length}`);
  }

  const dimensions = output.dimensions.map((dimension) => {
    const key = `${dimension.section_code}:${dimension.dimension_code}`;
    if (!expectedKeys.has(key)) throw new Error(`Unexpected dimension ${key}`);
    if (seen.has(key)) throw new Error(`Duplicate dimension ${key}`);
    seen.add(key);

    const definition = expected.find(
      (candidate) => candidate.sectionCode === dimension.section_code && candidate.code === dimension.dimension_code,
    );
    if (!definition) throw new Error(`Missing definition for ${key}`);

    if (dimension.evidence_state === "insufficient") {
      if (dimension.score !== null || dimension.confidence !== null || dimension.evidence_ids.length > 0) {
        throw new Error(`${key}: insufficient results require null score/confidence and no evidence`);
      }
    } else if (dimension.evidence_ids.length === 0) {
      throw new Error(`${key}: evaluated results require evidence`);
    }

    const evidence = dimension.evidence_ids.map((id) => {
      const item = evidenceById.get(id);
      if (!item) throw new Error(`${key}: unknown evidence ID ${id}`);
      return item;
    });

    if (dimension.evaluation_method === "human_judgment") {
      if (dimension.score !== null) throw new Error(`${key}: human-only results cannot have a score`);
      if (evidence.some((item) => item.source_type !== "human_judgment")) {
        throw new Error(`${key}: human-only results may cite only human judgments`);
      }
    } else if (dimension.evidence_state !== "insufficient" && dimension.score === null) {
      throw new Error(`${key}: data-backed evaluated results require a score`);
    }

    if (dimension.review_state === "conflict" && !dimension.conflict_reason) {
      throw new Error(`${key}: conflict_reason is required for conflicts`);
    }

    return { ...dimension, ...definition, evidence };
  });

  if (seen.size !== expectedKeys.size) throw new Error("Model output omitted required dimensions");
  const hasConflict = dimensions.some((dimension) => dimension.review_state === "conflict");
  if (hasConflict && output.analysis_status !== "needs_review") {
    throw new Error("Conflicting dimensions require needs_review status");
  }
  if (
    input.portrait_type === "external_expert" &&
    !input.cooperation_eligible &&
    output.cooperation_message !== "暂未建立两院关系记录"
  ) {
    throw new Error("External experts without relationships require the standard cooperation message");
  }
  return { output, dimensions };
}

export type RecommendationLevel = "优先" | "次优先" | "待观察";

export interface PotentialStudentSummary {
  weightedScore: number | null;
  evidenceCoverage: number;
  recommendationLevel: RecommendationLevel | null;
}

export function calculatePotentialStudentSummary(
  dimensions: ValidatedDimension[],
  contactAvailable: boolean,
  hasConflict: boolean,
): PotentialStudentSummary {
  const weighted = dimensions.filter(
    (dimension) => dimension.sectionCode === "research_potential" && dimension.weight !== null,
  );
  const evaluated = weighted.filter((dimension) => dimension.score !== null);
  const rawCoverage = evaluated.reduce((sum, dimension) => sum + (dimension.weight ?? 0), 0);
  const evidenceCoverage = Math.round(rawCoverage * 100_000) / 100_000;
  const numerator = evaluated.reduce(
    (sum, dimension) => sum + (dimension.score ?? 0) * (dimension.weight ?? 0),
    0,
  );
  const weightedScore = rawCoverage >= 0.5 ? Math.round((numerator / rawCoverage) * 100) / 100 : null;

  if (hasConflict) return { weightedScore, evidenceCoverage, recommendationLevel: null };

  const scoreFor = (code: string) => weighted.find((dimension) => dimension.code === code)?.score ?? null;
  const keyScores = [
    scoreFor("research_output_quality"),
    scoreFor("growth_trajectory"),
    scoreFor("academy_direction_match"),
  ];
  const priority =
    weightedScore !== null &&
    weightedScore >= 75 &&
    evidenceCoverage >= 0.7 &&
    contactAvailable &&
    keyScores.every((score) => score !== null && score >= 75);

  if (priority) return { weightedScore, evidenceCoverage, recommendationLevel: "优先" };
  if (weightedScore !== null && weightedScore >= 60 && evidenceCoverage >= 0.5) {
    return { weightedScore, evidenceCoverage, recommendationLevel: "次优先" };
  }
  return { weightedScore, evidenceCoverage, recommendationLevel: "待观察" };
}
