// 活动三级分类体系
// 根据图片中的分类结构定义

export interface ActivityCategory {
  id: string;
  name: string;
  subcategories: ActivitySubcategory[];
}

export interface ActivitySubcategory {
  id: string;
  name: string;
  types: string[];
}

// 活动分类数据
export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    id: "education",
    name: "教育培养",
    subcategories: [
      {
        id: "education_ceremony",
        name: "典礼仪式",
        types: ["开学典礼", "毕业典礼", "学位授予仪式"],
      },
      {
        id: "education_symposium",
        name: "座谈交流",
        types: ["共建高校座谈会", "师生座谈会", "校友座谈会"],
      },
      {
        id: "education_meeting",
        name: "会议活动",
        types: ["委员会会议", "教学研讨会", "课程建设会"],
      },
    ],
  },
  {
    id: "research",
    name: "科研学术",
    subcategories: [
      {
        id: "research_conference",
        name: "学术会议",
        types: ["国际AI科学家大会", "学术年会", "专题研讨会"],
      },
      {
        id: "research_forum",
        name: "论坛讲座",
        types: ["XAI智汇讲坛", "学科前沿讲座", "学术带头人论坛"],
      },
      {
        id: "research_salon",
        name: "学术沙龙",
        types: ["前沿沙龙", "青年学者沙龙", "跨学科交流"],
      },
    ],
  },
  {
    id: "talent",
    name: "人才引育",
    subcategories: [
      {
        id: "talent_forum",
        name: "人才论坛",
        types: ["青年论坛", "博士后论坛", "海外人才论坛"],
      },
      {
        id: "talent_school",
        name: "培训学校",
        types: ["国际暑校", "冬季学校", "短期培训班"],
      },
      {
        id: "talent_recruitment",
        name: "招聘宣讲",
        types: ["人才招聘会", "校园宣讲", "线上招聘"],
      },
    ],
  },
];

// 扁平化的分类映射，用于快速查找
export const CATEGORY_MAP = new Map<string, ActivityCategory>();
export const SUBCATEGORY_MAP = new Map<string, ActivitySubcategory & { categoryId: string }>();
export const TYPE_TO_CATEGORY_MAP = new Map<string, { categoryId: string; subcategoryId: string }>();

// 初始化映射
ACTIVITY_CATEGORIES.forEach((category) => {
  CATEGORY_MAP.set(category.id, category);
  category.subcategories.forEach((subcategory) => {
    SUBCATEGORY_MAP.set(subcategory.id, { ...subcategory, categoryId: category.id });
    subcategory.types.forEach((type) => {
      TYPE_TO_CATEGORY_MAP.set(type, {
        categoryId: category.id,
        subcategoryId: subcategory.id,
      });
    });
  });
});

// 根据一级分类获取所有二级分类
export function getSubcategoriesByCategory(categoryId: string): ActivitySubcategory[] {
  return CATEGORY_MAP.get(categoryId)?.subcategories || [];
}

// 根据二级分类获取所有三级类型
export function getTypesBySubcategory(subcategoryId: string): string[] {
  return SUBCATEGORY_MAP.get(subcategoryId)?.types || [];
}

// 根据三级类型反查一级和二级分类
export function getCategoryByType(type: string): { categoryId: string; subcategoryId: string } | null {
  return TYPE_TO_CATEGORY_MAP.get(type) || null;
}

// 获取所有一级分类选项
export function getAllCategories(): Array<{ id: string; name: string }> {
  return ACTIVITY_CATEGORIES.map((cat) => ({ id: cat.id, name: cat.name }));
}

// 获取所有三级类型（用于向后兼容）
export function getAllEventTypes(): string[] {
  const types: string[] = [];
  ACTIVITY_CATEGORIES.forEach((category) => {
    category.subcategories.forEach((subcategory) => {
      types.push(...subcategory.types);
    });
  });
  return types;
}
