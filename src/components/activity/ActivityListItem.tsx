import { MapPin, Users } from "lucide-react";
import { MONTH_LABELS, EVENT_TYPE_DOT, EVENT_TYPE_BADGE } from "@/constants/activityTypes";
import type { ActivityEvent } from "@/services/activityApi";

interface ActivityListItemProps {
  activity: ActivityEvent;
  onClick: () => void;
}

export function ActivityListItem({ activity, onClick }: ActivityListItemProps) {
  const date = new Date(activity.event_date);
  const h = date.getHours();
  const m = date.getMinutes();
  const timeStr =
    h === 0 && m === 0
      ? null
      : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const dotColor = EVENT_TYPE_DOT[activity.event_type] ?? "bg-gray-300";
  const badgeClass =
    EVENT_TYPE_BADGE[activity.event_type] ??
    "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors group flex gap-3 border-b border-gray-50 last:border-0"
    >
      {/* Day + month label */}
      <div className="shrink-0 w-10 text-center pt-0.5">
        <p className="text-xl font-bold text-gray-900 leading-none">
          {date.getDate()}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {MONTH_LABELS[date.getMonth()]}
        </p>
        {timeStr && (
          <p className="text-[10px] text-primary-500 mt-1 font-medium">
            {timeStr}
          </p>
        )}
      </div>

      {/* Type color bar */}
      <div className={`w-0.5 rounded-full shrink-0 ${dotColor}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 flex-1 leading-snug">
            {activity.title}
          </p>
          {activity.series_number && (
            <span className="shrink-0 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
              第{activity.series_number}期
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate">
          {activity.category || "未分类"}
          {activity.series ? (
            <span className="text-gray-400"> · {activity.series}</span>
          ) : null}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeClass}`}>
            {activity.event_type}
          </span>
          {activity.location && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5 truncate max-w-[120px]">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              {activity.location}
            </span>
          )}
          {activity.scholar_count > 0 && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5 shrink-0" />
              {activity.scholar_count}人
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
