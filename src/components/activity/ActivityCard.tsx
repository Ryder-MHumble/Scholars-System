import { motion } from "framer-motion";
import { Calendar, MapPin, Users, User, Hash } from "lucide-react";
import type { ActivityEvent } from "@/services/activityApi";

interface ActivityCardProps {
  activity: ActivityEvent;
  index: number;
  onEdit?: (activity: ActivityEvent) => void;
  onDelete?: (activity: ActivityEvent) => void;
  onManageScholars?: (activity: ActivityEvent) => void;
}

/* ── Color mapping per event type ─────────────────────────────────── */

const TYPE_COLORS: Record<
  string,
  {
    border: string;
    badge: string;
    badgeText: string;
    accent: string;
    bgHover: string;
  }
> = {
  学科前沿讲座: {
    border: "border-l-blue-500",
    badge: "bg-blue-50",
    badgeText: "text-blue-700",
    accent: "text-blue-600",
    bgHover: "hover:border-l-blue-600",
  },
  前沿沙龙: {
    border: "border-l-violet-500",
    badge: "bg-violet-50",
    badgeText: "text-violet-700",
    accent: "text-violet-600",
    bgHover: "hover:border-l-violet-600",
  },
  学术带头人论坛: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-50",
    badgeText: "text-emerald-700",
    accent: "text-emerald-600",
    bgHover: "hover:border-l-emerald-600",
  },
  讲座: {
    border: "border-l-amber-500",
    badge: "bg-amber-50",
    badgeText: "text-amber-700",
    accent: "text-amber-600",
    bgHover: "hover:border-l-amber-600",
  },
  其他: {
    border: "border-l-gray-400",
    badge: "bg-gray-100",
    badgeText: "text-gray-600",
    accent: "text-gray-500",
    bgHover: "hover:border-l-gray-500",
  },
};

function safeDate(str: string | null | undefined): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function ActivityCard({
  activity,
  index,
}: ActivityCardProps) {
  const date = safeDate(activity.event_date);

  const dateLabel = date
    ? date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "日期待定";

  const timeLabel =
    date && (date.getHours() !== 0 || date.getMinutes() !== 0)
      ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
      : null;

  const colors = TYPE_COLORS[activity.event_type] ?? TYPE_COLORS["其他"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.25) }}
      className={`
        group relative bg-white rounded-xl
        border border-gray-100 border-l-[3px] ${colors.border} ${colors.bgHover}
        shadow-sm hover:shadow-md
        hover:-translate-y-0.5
        transition-all duration-200
        flex flex-col h-full overflow-hidden
      `}
    >
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* ── Header: badge + series ── */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${colors.badge} ${colors.badgeText} leading-none`}
          >
            {activity.event_type || "未分类"}
          </span>
          {activity.series_number && (
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400 font-medium tabular-nums">
              <Hash className="w-3 h-3" />
              {activity.series_number}
            </span>
          )}
        </div>

        {/* ── Title ── */}
        <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-gray-800">
          {activity.title || "（无标题）"}
        </h3>

        {/* ── Speaker ── */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shrink-0 ring-1 ring-gray-100">
            <User className="w-4 h-4 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
              {activity.speaker_name || "主讲人待定"}
            </p>
            {activity.speaker_organization && (
              <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">
                {activity.speaker_organization}
              </p>
            )}
          </div>
        </div>

        {/* ── Meta row: date + location ── */}
        <div className="flex flex-col gap-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{dateLabel}</span>
            {timeLabel && (
              <span className={`font-medium tabular-nums ${colors.accent}`}>
                {timeLabel}
              </span>
            )}
          </div>
          {activity.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{activity.location}</span>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="mt-auto pt-2.5 border-t border-gray-50 flex items-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users className="w-3.5 h-3.5 shrink-0" />
            {activity.scholar_count > 0 ? (
              <span className="text-gray-500">
                {activity.scholar_count} 位关联学者
              </span>
            ) : (
              <span>暂无关联学者</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
