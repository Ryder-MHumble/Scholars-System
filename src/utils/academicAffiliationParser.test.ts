import {
  mergeAcademicAffiliations,
  parseAcademicAffiliationsFromText,
} from "./academicAffiliationParser.ts";

function assertDeepEqual(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertEqual(actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
}

const parsed = parseAcademicAffiliationsFromText(
  "中国人工智能学会 | 会士\n职务：期刊编委；机构：IEEE TCC；开始：2024；结束：至今\n天津市人工智能学会理事长，上海市人工智能学会副理事长",
);

assertDeepEqual(parsed.slice(0, 2), [
  {
    role: "会士",
    organization: "中国人工智能学会",
    start_year: "",
    end_year: "",
  },
  {
    role: "期刊编委",
    organization: "IEEE TCC",
    start_year: "2024",
    end_year: "至今",
  },
]);
assertEqual(parsed.length, 4);

const merged = mergeAcademicAffiliations(
  [
    {
      role: "会士",
      organization: "中国人工智能学会",
      start_year: "",
      end_year: "",
    },
  ],
  [
    {
      role: "会士",
      organization: "中国人工智能学会",
      start_year: "2020",
      end_year: "至今",
    },
  ],
);
assertDeepEqual(merged, [
  {
    role: "会士",
    organization: "中国人工智能学会",
    start_year: "2020",
    end_year: "至今",
  },
]);

console.log("academic affiliation parser tests passed");
