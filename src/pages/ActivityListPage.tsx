import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  CalendarDays,
  LayoutGrid,
  CalendarRange,
  ArrowDownUp,
  Upload,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { ActivityFormModal } from "@/components/activity/ActivityFormModal";
import { ActivityBatchImportModal } from "@/components/activity/ActivityBatchImportModal";
import { ActivityCard } from "@/components/activity/ActivityCard";
import { ActivityCalendar } from "@/components/activity/ActivityCalendar";
import { ActivityCalendarPanel } from "@/components/activity/ActivityCalendarPanel";
import { SUBTAB_TO_SERIES } from "@/constants/activityTypes";
import {
  createActivity,
  deleteActivity,
  fetchActivities,
  fetchActivityStats,
} from "@/services/activityApi";
import {
  fetchAllScholars,
  type ScholarListItem,
} from "@/services/scholarApi";
import type {
  ActivityEvent,
  ActivityCreateRequest,
  ActivityStats,
} from "@/services/activityApi";

export default function ActivityListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const today = new Date();

  const subtab = searchParams.get("subtab") ?? "";
  const activeSeries = SUBTAB_TO_SERIES[subtab] ?? "";

  const [viewMode, setViewMode] = useState<"card" | "calendar">("card");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeType, setActiveType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allActivities, setAllActivities] = useState<ActivityEvent[]>([]);
  const [allScholars, setAllScholars] = useState<ScholarListItem[]>([]);
  const [scholarLoading, setScholarLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [batchImportModalOpen, setBatchImportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const autoJumped = useRef(false);
  const shouldDeleteUntitledActivity = (activity: ActivityEvent) => {
    const title = activity.title.trim();
    return title === "无标题" || title === "（无标题）";
  };
  const isUntitledActivity = (activity: ActivityEvent) => {
    const title = activity.title.trim();
    return title === "" || title === "无标题" || title === "（无标题）";
  };

  const loadActivities = async (
    eventType?: string,
    series?: string,
    category?: string,
  ) => {
    setLoading(true);
    setActionError(null);
    try {
      const firstPage = await fetchActivities(
        1,
        200,
        eventType || undefined,
        series || undefined,
        category || undefined,
      );
      const allItems = [...firstPage.items];
      for (let page = 2; page <= firstPage.total_pages; page++) {
        const pageData = await fetchActivities(
          page,
          200,
          eventType || undefined,
          series || undefined,
          category || undefined,
        );
        allItems.push(...pageData.items);
      }
      const untitledItems = allItems.filter(shouldDeleteUntitledActivity);
      if (untitledItems.length > 0) {
        await Promise.allSettled(untitledItems.map((item) => deleteActivity(item.id)));
        fetchActivityStats()
          .then(setStats)
          .catch(() => {});
      }
      setAllActivities(allItems.filter((item) => !isUntitledActivity(item)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "加载活动失败");
    } finally {
      setLoading(false);
    }
  };

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
    setActiveType("");
    autoJumped.current = false;
    loadActivities("", activeSeries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeries]);

  useEffect(() => {
    autoJumped.current = false;
    loadActivities(activeType, activeSeries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  useEffect(() => {
    fetchActivityStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setScholarLoading(true);
    fetchAllScholars(undefined, controller.signal)
      .then((items) => setAllScholars(items))
      .catch(() => setAllScholars([]))
      .finally(() => setScholarLoading(false));
    return () => controller.abort();
  }, []);

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

  const panelActivities = useMemo<ActivityEvent[]>(() => {
    let list =
      selectedDay !== null
        ? (dayActivities[selectedDay] ?? [])
        : Object.values(dayActivities)
            .flat()
            .sort(
              (a, b) =>
                new Date(a.event_date).getTime() -
                new Date(b.event_date).getTime(),
            );
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.event_type.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q),
    );
  }, [dayActivities, selectedDay, searchQuery]);

  const cardActivities = useMemo<ActivityEvent[]>(() => {
    let list = [...allActivities];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.event_type.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      const diff =
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });
    return list;
  }, [allActivities, searchQuery, sortOrder]);

  const taggedScholars = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return allScholars.filter((scholar) => {
      const tags = scholar.event_tags ?? [];
      if (tags.length === 0) return false;
      if (activeType) {
        const hit = tags.some(
          (tag) =>
            tag.event_type === activeType ||
            tag.series === activeType ||
            tag.category === activeType,
        );
        if (!hit) return false;
      }
      if (activeSeries) {
        const hit = tags.some(
          (tag) =>
            tag.event_type === activeSeries ||
            tag.series === activeSeries ||
            tag.category === activeSeries,
        );
        if (!hit) return false;
      }
      if (!keyword) return true;
      const fields = [
        scholar.name,
        scholar.university,
        scholar.department,
        scholar.position,
        ...(scholar.research_areas ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return fields.includes(keyword);
    });
  }, [allScholars, activeType, activeSeries, searchQuery]);

  const panelTitle = selectedDay
    ? `${currentYear}年${currentMonth + 1}月${selectedDay}日`
    : `${currentYear}年${currentMonth + 1}月`;

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else setCurrentMonth((m) => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else setCurrentMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const handleFormSubmit = async (data: ActivityCreateRequest) => {
    try {
      setIsSubmitting(true);
      setActionError(null);
      await createActivity(data);
      loadActivities(activeType, activeSeries);
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
        {actionError && <ErrorBanner message={actionError} />}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeSeries || "学术活动"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              共{" "}
              <span className="font-semibold text-gray-700">
                {allActivities.length}
              </span>{" "}
              场活动
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
              {(["card", "calendar"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={mode === "card" ? "卡片视图" : "日历视图"}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === mode
                      ? "bg-white shadow-sm text-primary-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {mode === "card" ? (
                    <LayoutGrid className="w-4 h-4" />
                  ) : (
                    <CalendarRange className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setBatchImportModalOpen(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              批量导入
            </button>
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

        {/* Tagged scholars in current activity category */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">分类关联学者</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {scholarLoading ? "加载中..." : `当前条件下 ${taggedScholars.length} 位`}
              </p>
            </div>
          </div>
          {scholarLoading ? (
            <p className="text-xs text-gray-400">正在加载学者数据...</p>
          ) : taggedScholars.length === 0 ? (
            <p className="text-xs text-gray-400">当前活动分类下暂无关联学者</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {taggedScholars.slice(0, 12).map((scholar) => (
                <button
                  key={scholar.url_hash}
                  onClick={() => navigate(`/scholars/${scholar.url_hash}`)}
                  className="text-left border border-gray-200 rounded-lg p-3 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {scholar.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {scholar.university || "未知机构"}
                  </p>
                  {(scholar.event_tags ?? []).length > 0 && (
                    <p className="text-[11px] text-primary-600 mt-1 truncate">
                      {(scholar.event_tags ?? [])
                        .map((tag) => tag.event_type || tag.series || tag.category)
                        .filter(Boolean)
                        .slice(0, 2)
                        .join(" · ")}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

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
              placeholder="搜索标题、类型、地点..."
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
          cardActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <CalendarDays className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">暂无活动</p>
              <p className="text-xs mt-1 opacity-70">
                尝试调整筛选条件或添加新活动
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-stretch">
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <ActivityCalendar
              currentYear={currentYear}
              currentMonth={currentMonth}
              selectedDay={selectedDay}
              dayActivities={dayActivities}
              monthActivityCount={monthActivityCount}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onSelectDay={setSelectedDay}
            />
            <ActivityCalendarPanel
              panelTitle={panelTitle}
              activities={panelActivities}
              selectedDay={selectedDay}
              onClearDay={() => setSelectedDay(null)}
              onActivityClick={(id) => navigate(`/activities/${id}`)}
            />
          </div>
        )}
      </motion.div>

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

      <ActivityBatchImportModal
        isOpen={batchImportModalOpen}
        onClose={() => setBatchImportModalOpen(false)}
        onSuccess={() => {
          loadActivities(activeType, activeSeries);
          fetchActivityStats()
            .then(setStats)
            .catch(() => {});
        }}
      />
    </div>
  );
}
