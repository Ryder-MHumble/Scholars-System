export const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export const MONTH_LABELS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export const EVENT_TYPE_DOT: Record<string, string> = {
  学科前沿讲座: "bg-blue-500",
  前沿沙龙: "bg-purple-500",
  学术带头人论坛: "bg-emerald-500",
  讲座: "bg-amber-500",
  其他: "bg-gray-400",
};

export const EVENT_TYPE_BADGE: Record<string, string> = {
  学科前沿讲座: "bg-blue-50 text-blue-700 border-blue-200",
  前沿沙龙: "bg-purple-50 text-purple-700 border-purple-200",
  学术带头人论坛: "bg-emerald-50 text-emerald-700 border-emerald-200",
  讲座: "bg-amber-50 text-amber-700 border-amber-200",
  其他: "bg-gray-50 text-gray-700 border-gray-200",
};

// Maps URL subtab values (from left navigation) to series filter values
export const SUBTAB_TO_SERIES: Record<string, string> = {
  xai_forum: "XAI智汇讲坛",
  ai_scientist_summit: "国际AI科学家大会",
  academic_conference: "学术年会",
  youth_forum: "青年论坛",
  intl_summer_school: "国际暑校",
  opening_ceremony: "开学典礼",
  joint_symposium: "共建高校座谈会",
  committee_meeting: "委员会会议",
};
