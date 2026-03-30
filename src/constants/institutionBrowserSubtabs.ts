import {
  INSTITUTION_TYPES,
  INSTITUTION_REGIONS,
} from "@/utils/institutionClassifier";

export const INSTITUTION_BROWSER_SUBTAB_FILTER: Record<
  string,
  { region?: string; type?: string }
> = {
  domestic: { region: INSTITUTION_REGIONS.DOMESTIC },
  domestic_university: {
    region: INSTITUTION_REGIONS.DOMESTIC,
    type: INSTITUTION_TYPES.UNIVERSITY,
  },
  domestic_company: {
    region: INSTITUTION_REGIONS.DOMESTIC,
    type: INSTITUTION_TYPES.COMPANY,
  },
  domestic_research: {
    region: INSTITUTION_REGIONS.DOMESTIC,
    type: INSTITUTION_TYPES.RESEARCH_INSTITUTE,
  },
  domestic_other: {
    region: INSTITUTION_REGIONS.DOMESTIC,
    type: INSTITUTION_TYPES.OTHER,
  },
  international: { region: INSTITUTION_REGIONS.INTERNATIONAL },
  intl_university: {
    region: INSTITUTION_REGIONS.INTERNATIONAL,
    type: INSTITUTION_TYPES.UNIVERSITY,
  },
  intl_company: {
    region: INSTITUTION_REGIONS.INTERNATIONAL,
    type: INSTITUTION_TYPES.COMPANY,
  },
  intl_research: {
    region: INSTITUTION_REGIONS.INTERNATIONAL,
    type: INSTITUTION_TYPES.RESEARCH_INSTITUTE,
  },
  intl_other: {
    region: INSTITUTION_REGIONS.INTERNATIONAL,
    type: INSTITUTION_TYPES.OTHER,
  },
};

export const INSTITUTION_BROWSER_SUBTAB_LABELS: Record<string, string> = {
  domestic: "国内",
  domestic_university: "国内 - 高校",
  domestic_company: "国内 - 企业",
  domestic_research: "国内 - 研究机构",
  domestic_other: "国内 - 其他",
  international: "国际",
  intl_university: "国际 - 高校",
  intl_company: "国际 - 企业",
  intl_research: "国际 - 研究机构",
  intl_other: "国际 - 其他",
};

export function isInstitutionBrowserSubtab(subtab: string | null): boolean {
  return !!subtab && subtab in INSTITUTION_BROWSER_SUBTAB_FILTER;
}
