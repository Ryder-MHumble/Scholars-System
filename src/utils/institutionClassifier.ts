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
// 业务分类体系（按照业务方提供的分类表，基于机构 ID 映射）
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

/** 共建高校各子分类的机构 ID 集合 */
const JOINT_SUBCATEGORY_IDS: Record<JointSubcategory, string[]> = {
  示范性合作伙伴: ["tsinghua", "pku"],
  京内高校: [
    "中国科学院大学",
    "buaa",
    "bit",
    "bupt",
    "bnu",
    "ruc",
    "bjtu",
    "cau",
  ],
  京外C9高校: ["ustc", "sjtu", "fudan", "zju", "nju", "hit", "xjtu"],
  综合强校: [
    "tongji",
    "ecnu",
    "seu",
    "nku",
    "tju",
    "sdu",
    "sysu",
    "xmu",
    "whu",
    "jlu",
  ],
  工科强校: ["nwpu", "xidian", "hust", "uestc", "sustech"],
  特色高校: ["westlake"],
};

/** 所有共建高校 ID 的扁平集合 */
const ALL_JOINT_IDS = new Set(Object.values(JOINT_SUBCATEGORY_IDS).flat());

/** 海外高校各子分类的机构 ID 集合 */
const OVERSEAS_SUBCATEGORY_IDS: Record<OverseasSubcategory, string[]> = {
  香港高校: ["香港", "香港中文", "香港科技", "香港城市", "hkbu", "polyu"],
  亚太高校: [
    "nus",
    "ntu_sg",
    "早稻田大学",
    "澳门城市大学",
    "马来亚大学（qs_58)",
  ],
  欧美高校: [
    "stanford_university",
    "ucla",
    "剑桥大学",
    "牛津大学",
    "美国麻省理工学院",
    "耶鲁大学",
    "康奈尔大学",
    "帝国理工学院",
    "爱丁堡大学",
    "纽约大学",
    "苏黎世联邦理工学院",
    "范德比尔特大学",
    "卡尔斯鲁厄理工学院",
    "图宾根大学",
    "乌普萨拉大学",
    "格罗宁根大学",
    "比利时根特大学",
    "于默奥大学",
    "北卡罗来纳大学教堂山分校",
    "伦敦玛丽女王大学",
    "匹兹堡大学",
    "利物浦大学",
    "贝尔法斯特女王大学",
    "米兰理工大学",
    "费德里科圣玛利亚理工大学",
    "加州大学默塞德分校",
  ],
  其他地区高校: [
    "悉尼大学",
    "昆士兰大学",
    "阿德莱德大学",
    "新西兰坎特伯雷大学",
    "阿卜杜拉国王科技大学",
    "渥太华大学",
    "曼尼托巴大学",
    "迪肯大学",
    "莱顿大学",
  ],
};

const ALL_OVERSEAS_IDS = new Set(
  Object.values(OVERSEAS_SUBCATEGORY_IDS).flat(),
);

/** 兄弟院校 */
const SISTER_IDS = new Set<string>(["sii", "slai"]);

/** 科研院所 */
const RESEARCH_IDS = new Set<string>([]);

/** 行业学会 */
const ASSOCIATION_IDS = new Set<string>([]);

/**
 * 根据机构 ID 判断业务分组
 */
export function getInstitutionBusinessGroup(
  id: string,
): InstitutionBusinessGroup {
  if (SISTER_IDS.has(id)) return "sister_universities";
  if (RESEARCH_IDS.has(id)) return "research_institutes";
  if (ASSOCIATION_IDS.has(id)) return "industry_associations";
  if (ALL_JOINT_IDS.has(id)) return "joint_universities";
  if (ALL_OVERSEAS_IDS.has(id)) return "overseas_universities";
  return "other_universities";
}

/**
 * 获取共建高校所属子分类
 */
export function getJointSubcategory(id: string): JointSubcategory | null {
  for (const [cat, ids] of Object.entries(JOINT_SUBCATEGORY_IDS)) {
    if (ids.includes(id)) return cat as JointSubcategory;
  }
  return null;
}

/**
 * 获取海外高校所属子分类
 */
export function getOverseasSubcategory(id: string): OverseasSubcategory {
  for (const [cat, ids] of Object.entries(OVERSEAS_SUBCATEGORY_IDS)) {
    if (ids.includes(id)) return cat as OverseasSubcategory;
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
    (inst) => getInstitutionBusinessGroup(inst.id) === group,
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
