import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  Edit2,
  Trash2,
  Users2,
  User,
  Clock,
} from "lucide-react";
import type { ActivityEvent } from "@/services/activityApi";

interface ActivityCardProps {
  activity: ActivityEvent;
  index: number;
  onEdit?: (activity: ActivityEvent) => void;
  onDelete?: (activity: ActivityEvent) => void;
  onManageScholars?: (activity: ActivityEvent) => void;
}

const TYPE_STRIP: Record<string, string> = {
  学科前沿讲座: "from-blue-500 to-blue-600",
  前沿沙龙: "from-purple-500 to-purple-600",
  学术带头人论坛: "from-emerald-500 to-emerald-600",
  讲座: "from-amber-500 to-amber-600",
  其他: "from-gray-400 to-gray-500",
};

const TYPE_BADGE: Record<string, string> = {
  学科前沿讲座: "bg-blue-50 text-blue-700 border-blue-200",
  前沿沙龙: "bg-purple-50 text-purple-700 border-purple-200",
  学术带头人论坛: "bg-emerald-50 text-emerald-700 border-emerald-200",
  讲座: "bg-amber-50 text-amber-700 border-amber-200",
  其他: "bg-gray-50 text-gray-600 border-gray-200",
};

function safeDate(str: string | null | undefined): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function ActivityCard({
  activity,
  index,
  onEdit,
  onDelete,
  onManageScholars,
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

  const createdDate = safeDate(activity.created_at);
  const createdLabel = createdDate
    ? createdDate.toLocaleDateString("zh-CN", {
        month: "numeric",
        day: "numeric",
      })
    : null;

  const strip = TYPE_STRIP[activity.event_type] ?? TYPE_STRIP["其他"];
  const badge = TYPE_BADGE[activity.event_type] ?? TYPE_BADGE["其他"];
  const hasActions = onEdit || onDelete || onManageScholars;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.3) }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full overflow-hidden"
    >
      {/* Colored top strip */}
      <div className={`h-[3px] w-full bg-gradient-to-r ${strip} shrink-0`} />

      <div className="flex flex-col flex-1 px-4 pt-3.5 pb-4 gap-0">
        {/* ── Row 1: type badge + series number ── */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border leading-tight ${badge}`}
          >
            {activity.event_type || "未分类"}
          </span>
          {activity.series_number ? (
            <span className="text-[11px] text-gray-400 font-medium tabular-nums">
              第 {activity.series_number} 期
            </span>
          ) : (
            <span />
          )}
        </div>

        {/* ── Row 2: date ── */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-medium text-gray-700">{dateLabel}</span>
          {timeLabel && (
            <>
              <span className="text-gray-300 select-none">·</span>
              <span className="tabular-nums text-gray-500">{timeLabel}</span>
            </>
          )}
        </div>

        {/* ── Row 3: title — fixed min-height so same-row cards align ── */}
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug min-h-[2.625rem] mb-3">
          {activity.title || "（无标题）"}
        </h3>

        {/* ── Divider ── */}
        <div className="border-t border-gray-50 mb-3" />

        {/* ── Row 4: speaker ── */}
        <div className="flex items-start gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
              {activity.speaker_name || "主讲人待定"}
            </p>
            <p
              className="text-xs text-gray-500 truncate mt-0.5 leading-tight min-h-[1rem]"
            >
              {activity.speaker_organization || ""}
            </p>
          </div>
        </div>

        {/* ── Row 5: location — always occupies space ── */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 min-h-[1.25rem]">
          {activity.location ? (
            <>
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{activity.location}</span>
            </>
          ) : null}
        </div>

        {/* ── Footer ── */}
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {activity.scholar_count > 0 ? (
              <span>{activity.scholar_count} 位学者</span>
            ) : (
              <span className="text-gray-300">暂无学者</span>
            )}
          </div>
          {createdLabel && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              {createdLabel}
            </span>
          )}
        </div>

        {/* ── Action buttons (optional) ── */}
        {hasActions && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-50 mt-3">
            {onManageScholars && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onManageScholars(activity);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-colors"
              >
                <Users2 className="w-3.5 h-3.5" />
                学者
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(activity);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-medium transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                编辑
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(activity);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
