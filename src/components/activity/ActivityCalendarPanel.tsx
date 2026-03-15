import { CalendarDays } from "lucide-react";
import { ActivityListItem } from "./ActivityListItem";
import type { ActivityEvent } from "@/services/activityApi";

interface ActivityCalendarPanelProps {
  panelTitle: string;
  activities: ActivityEvent[];
  selectedDay: number | null;
  onClearDay: () => void;
  onActivityClick: (id: string | number) => void;
}

export function ActivityCalendarPanel({
  panelTitle,
  activities,
  selectedDay,
  onClearDay,
  onActivityClick,
}: ActivityCalendarPanelProps) {
  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 flex flex-col min-h-[400px] max-h-[600px]">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{panelTitle}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {activities.length} 场活动
          </p>
        </div>
        {selectedDay !== null && (
          <button
            onClick={onClearDay}
            className="text-xs text-gray-400 hover:text-primary-600 transition-colors px-2 py-1 hover:bg-gray-50 rounded"
          >
            查看全月 →
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400">
            <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {selectedDay ? "当天暂无活动" : "本月暂无活动"}
            </p>
            <p className="text-xs mt-1 opacity-70">
              {selectedDay ? "请选择其他日期" : "切换月份或添加新活动"}
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityListItem
              key={activity.id}
              activity={activity}
              onClick={() => onActivityClick(activity.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
