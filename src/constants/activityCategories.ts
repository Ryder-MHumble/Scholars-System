// 活动分类体系（两级）
// 一级分类 -> 活动类型

export interface ActivityCategory {
  id: string;
  name: string;
  types: string[];
}

// 兼容旧调用：历史上把“二级分类”作为中间层
export interface ActivitySubcategory {
  id: string;
  name: string;
  types: string[];
}

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    id: "education",
    name: "教育培养",
    types: ["开学典礼", "共建高校座谈会", "委员会会议"],
  },
  {
    id: "research",
    name: "科研学术",
    types: ["国际AI科学家大会", "XAI智汇讲坛", "学术年会"],
  },
  {
    id: "talent",
    name: "人才引育",
    types: ["青年论坛", "国际暑校"],
  },
];

export const CATEGORY_MAP = new Map<string, ActivityCategory>();
export const TYPE_TO_CATEGORY_MAP = new Map<
  string,
  { categoryId: string; subcategoryId: string }
>();

ACTIVITY_CATEGORIES.forEach((category) => {
  CATEGORY_MAP.set(category.id, category);
  category.types.forEach((type) => {
    // subcategoryId 仅用于兼容旧调用，值与类型保持一致
    TYPE_TO_CATEGORY_MAP.set(type, {
      categoryId: category.id,
      subcategoryId: type,
    });
  });
});

export function getTypesByCategory(categoryId: string): string[] {
  return CATEGORY_MAP.get(categoryId)?.types ?? [];
}

// 兼容旧调用：将每个活动类型映射为一个“二级分类”
export function getSubcategoriesByCategory(categoryId: string): ActivitySubcategory[] {
  return getTypesByCategory(categoryId).map((type) => ({
    id: type,
    name: type,
    types: [type],
  }));
}

// 兼容旧调用：subcategoryId 实际就是活动类型
export function getTypesBySubcategory(subcategoryId: string): string[] {
  return subcategoryId ? [subcategoryId] : [];
}

export function getCategoryByType(
  type: string,
): { categoryId: string; subcategoryId: string } | null {
  return TYPE_TO_CATEGORY_MAP.get(type) ?? null;
}

export function getAllCategories(): Array<{ id: string; name: string }> {
  return ACTIVITY_CATEGORIES.map((cat) => ({ id: cat.id, name: cat.name }));
}

export function getAllEventTypes(): string[] {
  return ACTIVITY_CATEGORIES.flatMap((category) => category.types);
}
