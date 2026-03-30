export const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export const MONTH_LABELS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export const EVENT_TYPE_DOT: Record<string, string> = {
  开学典礼: "bg-blue-500",
  共建高校座谈会: "bg-cyan-500",
  委员会会议: "bg-indigo-500",
  国际AI科学家大会: "bg-emerald-500",
  XAI智汇讲坛: "bg-violet-500",
  学术年会: "bg-teal-500",
  青年论坛: "bg-amber-500",
  国际暑校: "bg-rose-500",
  其他: "bg-gray-400",
};

export const EVENT_TYPE_BADGE: Record<string, string> = {
  开学典礼: "bg-blue-50 text-blue-700 border-blue-200",
  共建高校座谈会: "bg-cyan-50 text-cyan-700 border-cyan-200",
  委员会会议: "bg-indigo-50 text-indigo-700 border-indigo-200",
  国际AI科学家大会: "bg-emerald-50 text-emerald-700 border-emerald-200",
  XAI智汇讲坛: "bg-violet-50 text-violet-700 border-violet-200",
  学术年会: "bg-teal-50 text-teal-700 border-teal-200",
  青年论坛: "bg-amber-50 text-amber-700 border-amber-200",
  国际暑校: "bg-rose-50 text-rose-700 border-rose-200",
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
