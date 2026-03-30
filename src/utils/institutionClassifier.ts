import type { UniversityData } from "../hooks/useUniversityCounts";
import type { ComboboxGroup } from "../components/ui/GroupedComboboxInput";
import type { InstitutionListItem } from "@/types/institution";

/**
 * 机构类型分类
 */
export const INSTITUTION_TYPES = {
  UNIVERSITY: "university",
  COMPANY: "company",
  RESEARCH_INSTITUTE: "research_institute",
  GOVERNMENT: "government",
  OTHER: "other",
} as const;

/**
 * 机构地区分类
 */
export const INSTITUTION_REGIONS = {
  DOMESTIC: "domestic",
  INTERNATIONAL: "international",
} as const;

export type InstitutionType =
  (typeof INSTITUTION_TYPES)[keyof typeof INSTITUTION_TYPES];
export type InstitutionRegion =
  (typeof INSTITUTION_REGIONS)[keyof typeof INSTITUTION_REGIONS];

/**
 * 根据机构名称判断类型
 */
export function classifyInstitutionType(
  name: string,
  type?: string | null,
): string {
  if (type) {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("university") || lowerType.includes("大学")) {
      return INSTITUTION_TYPES.UNIVERSITY;
    }
    if (lowerType.includes("company") || lowerType.includes("公司")) {
      return INSTITUTION_TYPES.COMPANY;
    }
    if (
      lowerType.includes("institute") ||
      lowerType.includes("研究所") ||
      lowerType.includes("研究院")
    ) {
      return INSTITUTION_TYPES.RESEARCH_INSTITUTE;
    }
    if (lowerType.includes("government") || lowerType.includes("政府")) {
      return INSTITUTION_TYPES.GOVERNMENT;
    }
  }

  const lowerName = name.toLowerCase();

  // Research institute patterns (check first, before university)
  if (
    lowerName.includes("研究所") ||
    lowerName.includes("研究院") ||
    lowerName.includes("科学院") ||
    lowerName.includes("institute") ||
    lowerName.includes("laboratory") ||
    lowerName.includes("lab") ||
    lowerName.includes("academy")
  ) {
    return INSTITUTION_TYPES.RESEARCH_INSTITUTE;
  }

  // University patterns
  if (
    lowerName.includes("university") ||
    lowerName.includes("大学") ||
    lowerName.includes("学院") ||
    lowerName.includes("高校")
  ) {
    return INSTITUTION_TYPES.UNIVERSITY;
  }

  // Company patterns
  if (
    lowerName.includes("company") ||
    lowerName.includes("公司") ||
    lowerName.includes("inc.") ||
    lowerName.includes("ltd.") ||
    lowerName.includes("corp") ||
    lowerName.includes("group") ||
    lowerName.includes("ai") ||
    lowerName.includes("tech") ||
    lowerName.includes("technologies")
  ) {
    return INSTITUTION_TYPES.COMPANY;
  }

  // Government patterns
  if (
    lowerName.includes("government") ||
    lowerName.includes("ministry") ||
    lowerName.includes("department") ||
    lowerName.includes("政府") ||
    lowerName.includes("部")
  ) {
    return INSTITUTION_TYPES.GOVERNMENT;
  }

  return INSTITUTION_TYPES.OTHER;
}

/**
 * 根据机构名称判断地区
 */
export function classifyInstitutionRegion(name: string): string {
  // Chinese characters indicate domestic
  if (/[\u4e00-\u9fff]/.test(name)) {
    return INSTITUTION_REGIONS.DOMESTIC;
  }

  // If no Chinese characters, it's international
  return INSTITUTION_REGIONS.INTERNATIONAL;
}

/**
 * 获取机构类型的显示名称
 */
export function getInstitutionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    [INSTITUTION_TYPES.UNIVERSITY]: "高校",
    [INSTITUTION_TYPES.COMPANY]: "企业",
    [INSTITUTION_TYPES.RESEARCH_INSTITUTE]: "研究机构",
    [INSTITUTION_TYPES.GOVERNMENT]: "政府机构",
    [INSTITUTION_TYPES.OTHER]: "其他",
  };
  return labels[type] || "其他";
}

/**
 * 获取机构地区的显示名称
 */
export function getInstitutionRegionLabel(region: string): string {
  const labels: Record<string, string> = {
    [INSTITUTION_REGIONS.DOMESTIC]: "国内",
    [INSTITUTION_REGIONS.INTERNATIONAL]: "国际",
  };
  return labels[region] || "其他";
}

/**
 * 将大学数据分组为 ComboboxGroup
 */
export function groupUniversitiesByTypeAndRegion(
  universities: UniversityData[],
): ComboboxGroup[] {
  const groups: Record<string, Set<string>> = {};

  for (const uni of universities) {
    const type = classifyInstitutionType(uni.name);
    const region = classifyInstitutionRegion(uni.name);
    const typeLabel = getInstitutionTypeLabel(type);
    const regionLabel = getInstitutionRegionLabel(region);
    const groupKey = `${regionLabel} - ${typeLabel}`;

    if (!groups[groupKey]) {
      groups[groupKey] = new Set();
    }
    groups[groupKey].add(uni.name);
  }

  // Convert to ComboboxGroup array, sorted by region then type
  const regionOrder = [
    INSTITUTION_REGIONS.DOMESTIC,
    INSTITUTION_REGIONS.INTERNATIONAL,
  ];
  const typeOrder = [
    INSTITUTION_TYPES.UNIVERSITY,
    INSTITUTION_TYPES.COMPANY,
    INSTITUTION_TYPES.RESEARCH_INSTITUTE,
    INSTITUTION_TYPES.GOVERNMENT,
    INSTITUTION_TYPES.OTHER,
  ];

  const sortedGroups = Object.entries(groups)
    .map(([key, options]) => ({
      label: key,
      options: Array.from(options).sort(),
      _sortKey: key,
    }))
    .sort((a, b) => {
      // Extract region and type from label
      const aRegion = a.label.split(" - ")[0];
      const bRegion = b.label.split(" - ")[0];
      const aType = a.label.split(" - ")[1];
      const bType = b.label.split(" - ")[1];

      const aRegionIndex = regionOrder.findIndex(
        (r) => getInstitutionRegionLabel(r) === aRegion,
      );
      const bRegionIndex = regionOrder.findIndex(
        (r) => getInstitutionRegionLabel(r) === bRegion,
      );

      if (aRegionIndex !== bRegionIndex) {
        return aRegionIndex - bRegionIndex;
      }

      const aTypeIndex = typeOrder.findIndex(
        (t) => getInstitutionTypeLabel(t) === aType,
      );
      const bTypeIndex = typeOrder.findIndex(
        (t) => getInstitutionTypeLabel(t) === bType,
      );

      return aTypeIndex - bTypeIndex;
    });

  return sortedGroups.map(({ label, options }) => ({ label, options }));
}

/**
 * 将 subtab 字符串解析为 region 和 type 的组合
 */
export function parseSubtabFilter(subtab: string | null): {
  region: InstitutionRegion | null;
  type: InstitutionType | null;
} {
  const map: Record<
    string,
    { region: InstitutionRegion | null; type: InstitutionType | null }
  > = {
    domestic: { region: INSTITUTION_REGIONS.DOMESTIC, type: null },
    international: { region: INSTITUTION_REGIONS.INTERNATIONAL, type: null },
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
  return map[subtab ?? ""] ?? { region: null, type: null };
}

/**
 * 根据地区和类型过滤机构列表
 */
export function filterInstitutionsByRegionAndType(
  institutions: InstitutionListItem[],
  region: InstitutionRegion | null,
  type: InstitutionType | null,
): InstitutionListItem[] {
  return institutions.filter((inst) => {
    const instRegion = classifyInstitutionRegion(inst.name);
    const instType = classifyInstitutionType(inst.name, inst.org_name);

    // 如果选择了地区，必须匹配
    if (region && instRegion !== region) {
      return false;
    }

    // 如果选择了类型，必须匹配
    if (type && instType !== type) {
      return false;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// 业务分类体系（基于机构字段动态判断，不依赖静态 ID 映射）
// ---------------------------------------------------------------------------

export type InstitutionBusinessGroup =
  | "joint_universities" // 共建高校
  | "sister_universities" // 兄弟院校
  | "overseas_universities" // 海外高校
  | "other_universities" // 其他高校
  | "research_institutes" // 科研院所
  | "industry_associations"; // 行业学会

export type JointSubcategory =
  | "示范性合作伙伴"
  | "京内高校"
  | "京外C9高校"
  | "综合强校"
  | "工科强校"
  | "特色高校";

export type OverseasSubcategory =
  | "香港高校"
  | "亚太高校"
  | "欧美高校"
  | "其他地区高校";

type InstitutionClassifierInput = Pick<
  InstitutionListItem,
  "org_type" | "classification" | "sub_classification"
>;

function normalizeClassification(value?: string | null): string | null {
  if (!value) return null;
  if (value === "科研院所" || value === "研究机构") return "新研机构";
  return value;
}

function normalizeSubClassification(value?: string | null): string | null {
  if (!value) return null;
  if (value === "京内高校") return "京内高校";
  if (value === "京外C9") return "京外C9高校";
  if (value === "同行业机构") return "同行机构";
  if (value === "其他高校") return "其他";
  return value;
}

/**
 * 根据机构字段动态判断业务分组
 */
export function getInstitutionBusinessGroup(
  institution: InstitutionClassifierInput,
): InstitutionBusinessGroup {
  const orgType = institution.org_type ?? null;
  const classification = normalizeClassification(institution.classification);

  if (orgType === "研究机构" || classification === "新研机构") {
    return "research_institutes";
  }
  if (orgType === "行业学会" || classification === "行业学会") {
    return "industry_associations";
  }
  if (classification === "共建高校") return "joint_universities";
  if (classification === "兄弟院校") return "sister_universities";
  if (classification === "海外高校") return "overseas_universities";
  return "other_universities";
}

/**
 * 获取共建高校所属子分类
 */
export function getJointSubcategory(
  institution: InstitutionClassifierInput,
): JointSubcategory | null {
  if (getInstitutionBusinessGroup(institution) !== "joint_universities") {
    return null;
  }
  const sub = normalizeSubClassification(institution.sub_classification);
  if (!sub) return null;
  if ((JOINT_SUBCATEGORY_ORDER as string[]).includes(sub)) {
    return sub as JointSubcategory;
  }
  return null;
}

/**
 * 获取海外高校所属子分类
 */
export function getOverseasSubcategory(
  institution: InstitutionClassifierInput,
): OverseasSubcategory {
  if (getInstitutionBusinessGroup(institution) !== "overseas_universities") {
    return "其他地区高校";
  }
  const sub = normalizeSubClassification(institution.sub_classification);
  if (sub && (OVERSEAS_SUBCATEGORY_ORDER as string[]).includes(sub)) {
    return sub as OverseasSubcategory;
  }
  return "其他地区高校";
}

/** 共建高校子分类顺序 */
export const JOINT_SUBCATEGORY_ORDER: JointSubcategory[] = [
  "示范性合作伙伴",
  "京内高校",
  "京外C9高校",
  "综合强校",
  "工科强校",
  "特色高校",
];

/** 海外高校子分类顺序 */
export const OVERSEAS_SUBCATEGORY_ORDER: OverseasSubcategory[] = [
  "香港高校",
  "亚太高校",
  "欧美高校",
  "其他地区高校",
];

/**
 * 将机构列表按业务分组过滤
 */
export function filterByBusinessGroup(
  institutions: InstitutionListItem[],
  group: InstitutionBusinessGroup | null,
): InstitutionListItem[] {
  if (!group) return institutions;
  return institutions.filter(
    (inst) => getInstitutionBusinessGroup(inst) === group,
  );
}

// ---------------------------------------------------------------------------

/**
 * 统计各分类下的机构数量
 */
export function countInstitutionsByCategory(
  institutions: InstitutionListItem[],
  region: InstitutionRegion | null,
): Record<string, number> {
  const counts: Record<string, number> = {
    all: 0,
    [INSTITUTION_TYPES.UNIVERSITY]: 0,
    [INSTITUTION_TYPES.COMPANY]: 0,
    [INSTITUTION_TYPES.RESEARCH_INSTITUTE]: 0,
    [INSTITUTION_TYPES.OTHER]: 0,
  };

  for (const inst of institutions) {
    const instRegion = classifyInstitutionRegion(inst.name);

    // 如果选择了地区，只统计该地区的机构
    if (region && instRegion !== region) {
      continue;
    }

    const instType = classifyInstitutionType(inst.name, inst.org_name);
    counts.all++;
    counts[instType] = (counts[instType] || 0) + 1;
  }

  return counts;
}
