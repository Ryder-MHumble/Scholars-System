/**
 * 院士徽章组件
 * 根据学者的院士身份和学术头衔显示相应的徽章
 * 从 ScholarListPage:34-63 提取
 */
import { Award } from "lucide-react";
import { cn } from "@/utils/cn";

interface AcademicianBadgeProps {
  isAcademician: boolean;
  academicTitles: string[];
}

export function AcademicianBadge({
  isAcademician,
  academicTitles,
}: AcademicianBadgeProps) {
  const isCAS =
    isAcademician ||
    academicTitles.some(
      (t) => t.includes("中国科学院") || t.includes("科学院院士"),
    );
  const isCAE = academicTitles.some(
    (t) => t.includes("中国工程院") || t.includes("工程院院士"),
  );

  if (!isCAS && !isCAE) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0",
        isCAS
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-orange-50 text-orange-600 border border-orange-200",
      )}
    >
      <Award className="w-2.5 h-2.5" />
      {isCAS ? "中科院" : "工程院"}
    </span>
  );
}
