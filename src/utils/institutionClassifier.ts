import type { UniversityData } from "../hooks/useUniversityCounts";
import type { ComboboxGroup } from "../components/ui/GroupedComboboxInput";

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
