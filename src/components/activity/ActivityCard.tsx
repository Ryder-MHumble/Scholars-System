import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  Edit2,
  Trash2,
  Users2,
  Clock,
  Megaphone,
  CheckCircle,
  AlertCircle,
  Circle,
} from "lucide-react";
import type { ActivityEvent } from "@/services/activityApi";

interface ActivityCardProps {
  activity: ActivityEvent;
  index: number;
  onEdit?: (activity: ActivityEvent) => void;
  onDelete?: (activity: ActivityEvent) => void;
  onManageScholars?: (activity: ActivityEvent) => void;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  学科前沿讲座: "from-blue-500 to-blue-600",
  前沿沙龙: "from-purple-500 to-purple-600",
  学术带头人论坛: "from-emerald-500 to-emerald-600",
  讲座: "from-amber-500 to-amber-600",
  其他: "from-gray-500 to-gray-600",
};

function AuditBadge({ status }: { status?: string }) {
  if (!status) return null;
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" />
        已通过
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" />
        已拒绝
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <Circle className="w-3 h-3" />
      待审核
    </span>
  );
}

export function ActivityCard({
  activity,
  index,
  onEdit,
  onDelete,
  onManageScholars,
}: ActivityCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const h = date.getHours();
    const m = date.getMinutes();
    if (h === 0 && m === 0) return null;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const gradientClass =
    EVENT_TYPE_COLORS[activity.event_type] ?? "from-primary-500 to-primary-600";
  const timeStr = formatTime(activity.event_date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all flex flex-col"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradientClass} px-5 py-3.5`}>
        <div className="flex items-start justify-between gap-2">
          <div className="text-white min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Calendar className="w-4 h-4 shrink-0" />
              <p className="text-sm font-semibold">
                {formatDate(activity.event_date)}
                {timeStr && (
                  <span className="ml-2 opacity-90 font-normal">
                    {timeStr}
                  </span>
                )}
              </p>
            </div>
            <p className="text-xs opacity-85 pl-6">{activity.event_type}</p>
          </div>
          {activity.series_number && (
            <span className="shrink-0 text-xs font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
              第 {activity.series_number} 期
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-2 leading-snug">
          {activity.title}
        </h3>

        {/* Speaker */}
        <div className="p-3 bg-gray-50 rounded-lg mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            演讲嘉宾
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {activity.speaker_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {activity.speaker_organization}
          </p>
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 mb-3">
          {activity.location && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{activity.location}</span>
            </div>
          )}
          {activity.scholar_count > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              <span>参与学者 {activity.scholar_count} 人</span>
            </div>
          )}
        </div>

        {/* Footer row */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <AuditBadge status="pending" />
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(activity.created_at).toLocaleDateString("zh-CN")}
            </span>
          </div>
        </div>

        {/* Actions */}
        {(onEdit || onDelete || onManageScholars) && (
          <div className="mt-3 flex items-center gap-2">
            {onManageScholars && (
              <button
                onClick={() => onManageScholars(activity)}
                title="管理学者"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-colors"
              >
                <Users2 className="w-3.5 h-3.5" />
                学者
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(activity)}
                title="编辑"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-medium transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                编辑
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(activity)}
                title="删除"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
            )}
          </div>
        )}
      </div>

      {/* Publicity strip if present */}
      {(activity as ActivityEvent & { publicity?: string }).publicity && (
        <div className="px-5 pb-3 -mt-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-lg">
            <Megaphone className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {(activity as ActivityEvent & { publicity?: string }).publicity}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
