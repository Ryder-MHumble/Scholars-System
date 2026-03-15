export const STATUS_OPTIONS = ["在研", "已结题", "已验收", "已终止"];

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  在研: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  已结题: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  已验收: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  已终止: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

export const ROLE_PRESETS = ["负责人", "参与者", "顾问", "联络人", "共同PI", "博士后"];

export const OUTPUT_TYPE_OPTIONS = ["论文", "专利", "报告", "软件", "数据集", "其他"];
