/**
 * Project category system for scholars (共建导师分类体系)
 *
 * Three-level hierarchy:
 * - Primary categories (一级分类): 教育培养, 科研学术, 人才引育
 * - Subcategories (二级分类): specific project types under each primary category
 */

export const PROJECT_CATEGORIES = {
  教育培养: {
    label: "教育培养",
    subcategories: [
      "科技育青委员会",
      "学术委员会",
      "教学委员会",
      "学院学生事务导师",
      "全职导师",
      "产业导师",
      "兼职导师",
    ],
  },
  科研学术: {
    label: "科研学术",
    subcategories: ["科研立项"],
  },
  人才引育: {
    label: "人才引育",
    subcategories: ["卓工公派"],
  },
} as const;

export type ProjectCategory = keyof typeof PROJECT_CATEGORIES;
export type ProjectSubcategory =
  | "科技育青委员会"
  | "学术委员会"
  | "教学委员会"
  | "学院学生事务导师"
  | "全职导师"
  | "产业导师"
  | "兼职导师"
  | "科研立项"
  | "卓工公派";

/**
 * Get primary category for a given subcategory
 */
export function getPrimaryCategoryForSubcategory(
  subcategory: ProjectSubcategory,
): ProjectCategory | null {
  for (const [primary, config] of Object.entries(PROJECT_CATEGORIES)) {
    if ((config.subcategories as readonly string[]).includes(subcategory)) {
      return primary as ProjectCategory;
    }
  }
  return null;
}

/**
 * Get all subcategories as a flat array
 */
export function getAllSubcategories(): ProjectSubcategory[] {
  return Object.values(PROJECT_CATEGORIES).flatMap(
    (cat) => cat.subcategories,
  ) as ProjectSubcategory[];
}
