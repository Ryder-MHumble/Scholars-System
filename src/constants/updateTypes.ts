/**
 * 动态更新和交流记录的类型映射和样式常量
 * 从 ScholarDetailPage.tsx 提取
 */

/**
 * 预设的动态更新类型列表
 * 用于 AddUpdateModal 中的类型选择
 */
export const PRESET_UPDATE_TYPES = [
  { value: "general", label: "一般动态" },
  { value: "major_project", label: "重大项目" },
  { value: "talent_title", label: "人才称号" },
  { value: "appointment", label: "任职履新" },
  { value: "award", label: "获奖信息" },
  { value: "advisor_committee", label: "顾问委员" },
  { value: "adjunct_supervisor", label: "兼职导师" },
  { value: "supervised_student", label: "指导学生" },
  { value: "research_project", label: "科研立项" },
  { value: "joint_management", label: "联合管理" },
  { value: "academic_exchange", label: "学术交流" },
  { value: "potential_recruit", label: "潜在引进对象" },
];

/**
 * 动态类型 ID → 中文标签的映射表
 */
export const UPDATE_TYPE_LABELS: Record<string, string> = {
  general: "一般动态",
  major_project: "重大项目",
  talent_title: "人才称号",
  appointment: "任职履新",
  award: "获奖信息",
  advisor_committee: "顾问委员",
  adjunct_supervisor: "兼职导师",
  supervised_student: "指导学生",
  research_project: "科研立项",
  joint_management: "联合管理",
  academic_exchange: "学术交流",
  potential_recruit: "潜在引进对象",
};

/**
 * 动态类型 → 样式类名的映射表
 * 用于在 RecentUpdatesCard 中显示不同颜色的类型标签
 */
export const EXCHANGE_TYPE_COLORS: Record<string, string> = {
  一般动态: "bg-gray-100 text-gray-700",
  重大项目: "bg-red-100 text-red-700",
  人才称号: "bg-purple-100 text-purple-700",
  任职履新: "bg-blue-100 text-blue-700",
  获奖信息: "bg-amber-100 text-amber-700",
  顾问委员: "bg-cyan-100 text-cyan-700",
  兼职导师: "bg-violet-100 text-violet-700",
  指导学生: "bg-emerald-100 text-emerald-700",
  科研立项: "bg-indigo-100 text-indigo-700",
  联合管理: "bg-teal-100 text-teal-700",
  学术交流: "bg-pink-100 text-pink-700",
  潜在引进对象: "bg-orange-100 text-orange-700",
};

/**
 * 获取动态类型的中文标签
 * 如果类型不在映射表中，返回原始类型字符串
 */
export function getUpdateTypeLabel(updateType: string): string {
  return UPDATE_TYPE_LABELS[updateType] || updateType;
}
