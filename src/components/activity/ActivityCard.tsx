import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Hash, Clock } from "lucide-react";
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
    gradient: string;
    badge: string;
    badgeText: string;
    accent: string;
    iconBg: string;
    shadow: string;
  }
> = {
  学科前沿讲座: {
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    badge: "bg-blue-500/10 border-blue-500/20",
    badgeText: "text-blue-700",
    accent: "text-blue-600",
    iconBg: "bg-blue-500/10",
    shadow: "hover:shadow-blue-500/10",
  },
  前沿沙龙: {
    gradient: "from-violet-500/10 via-violet-500/5 to-transparent",
    badge: "bg-violet-500/10 border-violet-500/20",
    badgeText: "text-violet-700",
    accent: "text-violet-600",
    iconBg: "bg-violet-500/10",
    shadow: "hover:shadow-violet-500/10",
  },
  学术带头人论坛: {
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    badge: "bg-emerald-500/10 border-emerald-500/20",
    badgeText: "text-emerald-700",
    accent: "text-emerald-600",
    iconBg: "bg-emerald-500/10",
    shadow: "hover:shadow-emerald-500/10",
  },
  讲座: {
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    badge: "bg-amber-500/10 border-amber-500/20",
    badgeText: "text-amber-700",
    accent: "text-amber-600",
    iconBg: "bg-amber-500/10",
    shadow: "hover:shadow-amber-500/10",
  },
  其他: {
    gradient: "from-gray-500/10 via-gray-500/5 to-transparent",
    badge: "bg-gray-500/10 border-gray-500/20",
    badgeText: "text-gray-700",
    accent: "text-gray-600",
    iconBg: "bg-gray-500/10",
    shadow: "hover:shadow-gray-500/10",
  },
};

function safeDate(str: string | null | undefined): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function ActivityCard({ activity, index }: ActivityCardProps) {
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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.03, 0.3),
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="group relative h-full"
    >
      {/* Gradient background overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      {/* Main card */}
      <div
        className={`
        relative bg-white rounded-2xl
        border border-gray-200/60
        shadow-sm ${colors.shadow} hover:shadow-xl
        hover:-translate-y-1
        transition-all duration-300
        flex flex-col h-full overflow-hidden
        backdrop-blur-sm
      `}
      >
        {/* Header with gradient accent */}
        <div
          className={`relative px-5 pt-5 pb-3 bg-gradient-to-br ${colors.gradient}`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <span
              className={`
              inline-flex items-center gap-1.5
              text-xs font-semibold px-3 py-1.5 rounded-full
              ${colors.badge} ${colors.badgeText}
              border backdrop-blur-sm
              transition-transform group-hover:scale-105
            `}
            >
              {activity.event_type || "未分类"}
            </span>
            {activity.series_number && (
              <span className="flex items-center gap-1 text-xs text-gray-400 font-medium tabular-nums bg-gray-50/80 px-2.5 py-1 rounded-full">
                <Hash className="w-3 h-3" />
                {activity.series_number}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.8rem] group-hover:text-gray-700 transition-colors">
            {activity.title || "（无标题）"}
          </h3>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 px-5 py-4 gap-4">
          {/* Date & Time section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <div className={`p-1.5 rounded-lg ${colors.iconBg}`}>
                <Calendar className={`w-4 h-4 ${colors.accent}`} />
              </div>
              <span className="text-gray-700 font-medium">{dateLabel}</span>
            </div>

            {timeLabel && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className={`p-1.5 rounded-lg ${colors.iconBg}`}>
                  <Clock className={`w-4 h-4 ${colors.accent}`} />
                </div>
                <span className={`font-semibold tabular-nums ${colors.accent}`}>
                  {timeLabel}
                </span>
              </div>
            )}

            {activity.location && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className={`p-1.5 rounded-lg ${colors.iconBg}`}>
                  <MapPin className={`w-4 h-4 ${colors.accent}`} />
                </div>
                <span className="text-gray-600 truncate">
                  {activity.location}
                </span>
              </div>
            )}

            <div className="text-xs text-gray-500">
              分类：{activity.category || "未分类"}
              {activity.series ? ` · 系列：${activity.series}` : ""}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto px-5 py-3.5 bg-gray-50/50 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs">
            <div className={`p-1 rounded-md ${colors.iconBg}`}>
              <Users className={`w-3.5 h-3.5 ${colors.accent}`} />
            </div>
            {activity.scholar_count > 0 ? (
              <span className="text-gray-600 font-medium">
                {activity.scholar_count} 位关联学者
              </span>
            ) : (
              <span className="text-gray-400">暂无关联学者</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
