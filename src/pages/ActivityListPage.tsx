import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  BarChart2,
  MapPin,
  Clock,
  Search,
  CalendarDays,
  LayoutGrid,
  CalendarRange,
  ArrowDownUp,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ActivityFormModal } from "@/components/activity/ActivityFormModal";
import { ActivityCard } from "@/components/activity/ActivityCard";
import {
  createActivity,
  fetchActivities,
  fetchActivityStats,
} from "@/services/activityApi";
import type {
  ActivityEvent,
  ActivityCreateRequest,
  ActivityStats,
} from "@/services/activityApi";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_LABELS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

const EVENT_TYPE_DOT: Record<string, string> = {
  学科前沿讲座: "bg-blue-500",
  前沿沙龙: "bg-purple-500",
  学术带头人论坛: "bg-emerald-500",
  讲座: "bg-amber-500",
  其他: "bg-gray-400",
};

const EVENT_TYPE_BADGE: Record<string, string> = {
  学科前沿讲座: "bg-blue-50 text-blue-700 border-blue-200",
  前沿沙龙: "bg-purple-50 text-purple-700 border-purple-200",
  学术带头人论坛: "bg-emerald-50 text-emerald-700 border-emerald-200",
  讲座: "bg-amber-50 text-amber-700 border-amber-200",
  其他: "bg-gray-50 text-gray-700 border-gray-200",
};

// ─── Activity list item in calendar panel ────────────────────────────────────
function ActivityListItem({
  activity,
  onClick,
}: {
  activity: ActivityEvent;
  onClick: () => void;
}) {
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
          {activity.speaker_name}
          {activity.speaker_organization && (
            <span className="text-gray-400">
              {" "}
              · {activity.speaker_organization}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeClass}`}
          >
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ActivityListPage() {
  const navigate = useNavigate();
  const today = new Date();

  // View mode
  const [viewMode, setViewMode] = useState<"card" | "calendar">("card");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Calendar state
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // null = show full month

  // Common state
  const [activeType, setActiveType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [allActivities, setAllActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ActivityStats | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Track whether we've done the initial auto-jump so the user can freely
  // navigate without the calendar snapping back.
  const autoJumped = useRef(false);

  const loadActivities = async (type?: string) => {
    setLoading(true);
    setActionError(null);
    try {
      // Backend limits page_size to 200, so we need to fetch all pages
      const firstPage = await fetchActivities(1, 200, type || undefined);
      const allItems = [...firstPage.items];

      // Fetch remaining pages if needed
      for (let page = 2; page <= firstPage.total_pages; page++) {
        const pageData = await fetchActivities(page, 200, type || undefined);
        allItems.push(...pageData.items);
      }

      setAllActivities(allItems);
    } catch (err) {
      console.error("Failed to load activities:", err);
      setActionError(err instanceof Error ? err.message : "加载活动失败");
    } finally {
      setLoading(false);
    }
  };

  // On first non-empty load: jump to the month of the most recent activity
  // if the current month has no activities.
  useEffect(() => {
    if (allActivities.length === 0 || autoJumped.current) return;
    autoJumped.current = true;

    const hasInCurrent = allActivities.some((a) => {
      const d = new Date(a.event_date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    if (!hasInCurrent) {
      const latest = allActivities.reduce((max, a) =>
        new Date(a.event_date).getTime() > new Date(max.event_date).getTime()
          ? a
          : max,
      );
      const ld = new Date(latest.event_date);
      setCurrentYear(ld.getFullYear());
      setCurrentMonth(ld.getMonth());
      setSelectedDay(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allActivities]);

  useEffect(() => {
    autoJumped.current = false;
    loadActivities(activeType);
  }, [activeType]);

  useEffect(() => {
    fetchActivityStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  // ── Calendar maths ──
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Group activities by day (for current displayed month)
  const dayActivities = useMemo<Record<number, ActivityEvent[]>>(() => {
    const map: Record<number, ActivityEvent[]> = {};
    for (const a of allActivities) {
      const d = new Date(a.event_date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        map[day] = [...(map[day] ?? []), a];
      }
    }
    return map;
  }, [allActivities, currentYear, currentMonth]);

  const monthActivityCount = useMemo(
    () => Object.values(dayActivities).flat().length,
    [dayActivities],
  );

  // Panel list (calendar view)
  const panelActivities = useMemo<ActivityEvent[]>(() => {
    let list: ActivityEvent[];
    if (selectedDay !== null) {
      list = dayActivities[selectedDay] ?? [];
    } else {
      list = Object.values(dayActivities)
        .flat()
        .sort(
          (a, b) =>
            new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
        );
    }
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.speaker_name.toLowerCase().includes(q) ||
        a.speaker_organization.toLowerCase().includes(q),
    );
  }, [dayActivities, selectedDay, searchQuery]);

  const panelTitle = selectedDay
    ? `${currentYear}年${currentMonth + 1}月${selectedDay}日`
    : `${currentYear}年${currentMonth + 1}月`;

  // Card view: sorted + filtered activities
  const cardActivities = useMemo<ActivityEvent[]>(() => {
    let list = [...allActivities];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.speaker_name.toLowerCase().includes(q) ||
          a.speaker_organization.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      const diff =
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });
    return list;
  }, [allActivities, searchQuery, sortOrder]);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  // Create activity
  const handleFormSubmit = async (data: ActivityCreateRequest) => {
    try {
      setIsSubmitting(true);
      setActionError(null);
      await createActivity(data);
      loadActivities(activeType);
      fetchActivityStats()
        .then(setStats)
        .catch(() => {});
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "操作失败");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="p-6 md:p-8 space-y-5"
      >
        {/* Error banner */}
        {actionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">学术活动</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              共{" "}
              <span className="font-semibold text-gray-700">
                {stats?.total ?? allActivities.length}
              </span>{" "}
              场活动
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
              <button
                onClick={() => setViewMode("card")}
                title="卡片视图"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "card"
                    ? "bg-white shadow-sm text-primary-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                title="日历视图"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "calendar"
                    ? "bg-white shadow-sm text-primary-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <CalendarRange className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setFormModalOpen(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              添加活动
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: Calendar,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                value: stats.total,
                label: "总活动数",
              },
              {
                icon: Users,
                iconBg: "bg-purple-50",
                iconColor: "text-purple-600",
                value: stats.total_speakers,
                label: "演讲嘉宾",
              },
              {
                icon: BarChart2,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                value: stats.by_type.length,
                label: "活动类型",
              },
              {
                icon: Clock,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                value: `${stats.avg_duration.toFixed(1)}h`,
                label: "平均时长",
              },
            ].map(({ icon: Icon, iconBg, iconColor, value, label }) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
              >
                <div
                  className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Type filter + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-wrap gap-2 items-center flex-1">
            <button
              onClick={() => {
                setActiveType("");
                setSelectedDay(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeType === ""
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
              }`}
            >
              全部
            </button>
            {stats?.by_type.map((t) => (
              <button
                key={t.event_type}
                onClick={() => {
                  setActiveType((prev) =>
                    prev === t.event_type ? "" : t.event_type,
                  );
                  setSelectedDay(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeType === t.event_type
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
                }`}
              >
                {t.event_type}
                <span
                  className={`ml-1.5 ${activeType === t.event_type ? "text-white/70" : "text-gray-400"}`}
                >
                  {t.count}
                </span>
              </button>
            ))}
            {/* Sort toggle — card view only */}
            {viewMode === "card" && (
              <button
                onClick={() =>
                  setSortOrder((o) => (o === "desc" ? "asc" : "desc"))
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-primary-300 transition-colors"
              >
                <ArrowDownUp className="w-3 h-3" />
                {sortOrder === "desc" ? "最新优先" : "最早优先"}
              </button>
            )}
          </div>
          <div className="relative sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标题、主讲人..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Main content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner />
          </div>
        ) : viewMode === "card" ? (
          /* ── Card grid view ── */
          cardActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <CalendarDays className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">暂无活动</p>
              <p className="text-xs mt-1 opacity-70">
                尝试调整筛选条件或添加新活动
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
              {cardActivities.map((activity, i) => (
                <div
                  key={activity.id}
                  onClick={() => navigate(`/activities/${activity.id}`)}
                  className="cursor-pointer"
                >
                  <ActivityCard activity={activity} index={i} />
                </div>
              ))}
            </div>
          )
        ) : (
          /* ── Calendar + Panel view ── */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* ── Calendar ── */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={prevMonth}
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
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-medium text-gray-400 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty offset cells */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-12" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                  (day) => {
                    const acts = dayActivities[day] ?? [];
                    const isSelected = selectedDay === day;
                    const todayDay = isToday(day);
                    const hasActs = acts.length > 0;

                    return (
                      <button
                        key={day}
                        onClick={() =>
                          setSelectedDay((d) => (d === day ? null : day))
                        }
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

                        {/* Activity dots */}
                        {hasActs && (
                          <div className="flex gap-0.5 items-center">
                            {acts.slice(0, 3).map((a, idx) => (
                              <span
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected
                                    ? "bg-white/80"
                                    : (EVENT_TYPE_DOT[a.event_type] ??
                                      "bg-gray-400")
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
                  },
                )}
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

            {/* ── Activity Panel ── */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 flex flex-col min-h-[400px] max-h-[600px]">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {panelTitle}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {panelActivities.length} 场活动
                  </p>
                </div>
                {selectedDay !== null && (
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-xs text-gray-400 hover:text-primary-600 transition-colors px-2 py-1 hover:bg-gray-50 rounded"
                  >
                    查看全月 →
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {panelActivities.length === 0 ? (
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
                  panelActivities.map((activity) => (
                    <ActivityListItem
                      key={activity.id}
                      activity={activity}
                      onClick={() => navigate(`/activities/${activity.id}`)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create modal */}
      <ActivityFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={
          handleFormSubmit as Parameters<
            typeof ActivityFormModal
          >[0]["onSubmit"]
        }
        activity={null}
        mode="create"
      />
    </div>
  );
}
