import { ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAYS, EVENT_TYPE_DOT } from "@/constants/activityTypes";
import type { ActivityEvent } from "@/services/activityApi";

interface ActivityCalendarProps {
  currentYear: number;
  currentMonth: number;
  selectedDay: number | null;
  dayActivities: Record<number, ActivityEvent[]>;
  monthActivityCount: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (day: number | null) => void;
}

export function ActivityCalendar({
  currentYear,
  currentMonth,
  selectedDay,
  dayActivities,
  monthActivityCount,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: ActivityCalendarProps) {
  const today = new Date();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  return (
    <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onPrevMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {currentYear}年{currentMonth + 1}月
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            本月 {monthActivityCount} 场活动
          </p>
        </div>
        <button
          onClick={onNextMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-12" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const acts = dayActivities[day] ?? [];
          const isSelected = selectedDay === day;
          const todayDay = isToday(day);
          const hasActs = acts.length > 0;

          return (
            <button
              key={day}
              onClick={() => onSelectDay(selectedDay === day ? null : day)}
              className={`
                h-12 flex flex-col items-center justify-center rounded-lg transition-all text-sm gap-0.5
                ${
                  isSelected
                    ? "bg-primary-600 text-white shadow-md scale-105"
                    : todayDay
                      ? "ring-2 ring-primary-400 bg-primary-50 font-bold"
                      : hasActs
                        ? "bg-gray-50 hover:bg-gray-100"
                        : "hover:bg-gray-50 text-gray-600"
                }
              `}
            >
              <span
                className={`font-semibold leading-none text-sm ${
                  isSelected
                    ? "text-white"
                    : todayDay
                      ? "text-primary-700"
                      : "text-gray-800"
                }`}
              >
                {day}
              </span>

              {hasActs && (
                <div className="flex gap-0.5 items-center">
                  {acts.slice(0, 3).map((a, idx) => (
                    <span
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? "bg-white/80"
                          : (EVENT_TYPE_DOT[a.event_type] ?? "bg-gray-400")
                      }`}
                    />
                  ))}
                  {acts.length > 3 && (
                    <span
                      className={`text-[9px] font-medium ${isSelected ? "text-white/70" : "text-gray-400"}`}
                    >
                      +{acts.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
        {Object.entries(EVENT_TYPE_DOT).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-gray-500">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
