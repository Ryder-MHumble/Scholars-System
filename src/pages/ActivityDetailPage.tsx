import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Edit2,
  Trash2,
  FileText,
  Hash,
  Image as ImageIcon,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ActivityFormModal } from "@/components/activity/ActivityFormModal";
import { ActivityScholarsModal } from "@/components/activity/ActivityScholarsModal";
import {
  fetchActivityDetail,
  fetchActivityScholars,
  updateActivity,
  deleteActivity,
} from "@/services/activityApi";
import type {
  ActivityEvent,
  ActivityEventDetail,
  ActivityUpdateRequest,
} from "@/services/activityApi";

const EVENT_TYPE_GRADIENT: Record<string, string> = {
  学科前沿讲座: "from-blue-500 to-blue-600",
  前沿沙龙: "from-purple-500 to-purple-600",
  学术带头人论坛: "from-emerald-500 to-emerald-600",
  讲座: "from-amber-500 to-amber-600",
  其他: "from-gray-500 to-gray-600",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface ActivityScholar {
  scholar_id: string;
  name: string;
}

interface ActivityListViewState {
  subtab: string;
  viewMode: "card" | "calendar";
  sortOrder: "desc" | "asc";
  currentYear: number;
  currentMonth: number;
  selectedDay: number | null;
  activeType: string;
  searchQuery: string;
  scrollY: number;
}

export default function ActivityDetailPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (
    location.state as { from?: { pathname?: string; search?: string } } | null
  )?.from;
  const restoreActivityListState = (
    location.state as { restoreActivityListState?: ActivityListViewState } | null
  )?.restoreActivityListState;
  const backHref =
    from?.pathname && from.pathname !== ""
      ? `${from.pathname}${from.search ?? ""}`
      : window.sessionStorage.getItem("activity_list_return_to") ??
        "/?tab=activities";

  const goBackToList = () => {
    if (restoreActivityListState) {
      navigate(backHref, { state: { restoreActivityListState } });
      return;
    }
    navigate(backHref);
  };

  const [detail, setDetail] = useState<ActivityEventDetail | null>(null);
  const [scholars, setScholars] = useState<ActivityScholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [scholarsModalOpen, setScholarsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const [d, s] = await Promise.all([
        fetchActivityDetail(id),
        fetchActivityScholars(id).catch(() => [] as ActivityScholar[]),
      ]);
      setDetail(d);
      setScholars(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activityId) loadDetail(activityId);
  }, [activityId]);

  const refreshScholars = async () => {
    if (!activityId) return;
    const s = await fetchActivityScholars(activityId).catch(
      () => [] as ActivityScholar[],
    );
    setScholars(s);
    const d = await fetchActivityDetail(activityId).catch(() => null);
    if (d) setDetail(d);
  };

  const handleUpdate = async (data: ActivityUpdateRequest) => {
    if (!activityId) return;
    await updateActivity(activityId, data);
    await loadDetail(activityId);
  };

  const handleDelete = async () => {
    if (!detail) return;
    if (!confirm(`确定要删除活动「${detail.title}」吗？此操作无法撤销。`))
      return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteActivity(detail.id);
      goBackToList();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "删除失败");
      setIsDeleting(false);
    }
  };

  const detailAsListItem: ActivityEvent | null = detail
    ? {
        id: detail.id,
        category: detail.category,
        event_type: detail.event_type,
        series: detail.series,
        series_number: detail.series_number,
        title: detail.title,
        abstract: detail.abstract,
        event_date: detail.event_date,
        duration: detail.duration,
        location: detail.location,
        photo_url: detail.photo_url,
        scholar_ids: detail.scholar_ids,
        scholar_count: detail.scholar_ids?.length ?? 0,
        created_at: detail.created_at,
        updated_at: detail.updated_at,
      }
    : null;

  const gradient = detail
    ? (EVENT_TYPE_GRADIENT[detail.event_type] ?? "from-gray-500 to-gray-600")
    : "from-gray-500 to-gray-600";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">加载失败</p>
          <p className="text-sm text-gray-500 mb-5">{error ?? "活动不存在"}</p>
          <button
            onClick={goBackToList}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            返回活动列表
          </button>
        </div>
      </div>
    );
  }

  const timeStr = detail.event_time?.trim() || formatTime(detail.event_date);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button
            onClick={goBackToList}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            返回活动列表
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScholarsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              管理学者
            </button>
            <button
              onClick={() => setFormModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              编辑活动
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? "删除中..." : "删除"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          {deleteError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{deleteError}</p>
            </div>
          )}

          <div
            className={`rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br ${gradient}`}
          >
            <div className="px-7 py-6 text-white">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                  {detail.event_type}
                </span>
                <span className="text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full">
                  {detail.category}
                </span>
                {detail.series && (
                  <span className="text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full">
                    {detail.series}
                  </span>
                )}
                {detail.series_number && (
                  <span className="text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Hash className="w-3 h-3" />第 {detail.series_number} 期
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
                {detail.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/90">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 shrink-0" />
                  {formatDate(detail.event_date)}
                  {timeStr && (
                    <span className="ml-1 font-semibold">{timeStr}</span>
                  )}
                </span>
                {detail.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {detail.location}
                  </span>
                )}
                {detail.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 shrink-0" />
                    {detail.duration} 小时
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 shrink-0" />
                  {scholars.length} 位关联学者
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-5">
              {detail.abstract && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    摘要
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {detail.abstract}
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  参与学者
                  <span className="ml-1 text-gray-300 font-normal normal-case">
                    ({scholars.length})
                  </span>
                </h3>

                {scholars.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">暂无关联学者</p>
                    <button
                      onClick={() => setScholarsModalOpen(true)}
                      className="mt-3 text-xs text-primary-600 hover:underline"
                    >
                      点击添加学者
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {scholars.map((s) => (
                      <button
                        key={s.scholar_id}
                        onClick={() =>
                          navigate(`/scholars/${s.scholar_id}`, {
                            state: { from: location },
                          })
                        }
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-gray-200 rounded-lg transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-white">
                            {s.name.slice(0, 1)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700 transition-colors">
                          {s.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  活动信息
                </h3>

                <InfoRow icon={<Calendar className="w-4 h-4 text-blue-500" />} label="日期">
                  <span className="text-sm text-gray-700 font-medium">
                    {new Date(detail.event_date).toLocaleDateString("zh-CN")}
                    {timeStr && (
                      <span className="ml-2 text-primary-600">{timeStr}</span>
                    )}
                  </span>
                </InfoRow>

                <InfoRow icon={<MapPin className="w-4 h-4 text-rose-500" />} label="地点">
                  <span className="text-sm text-gray-700">{detail.location}</span>
                </InfoRow>

                <InfoRow icon={<Users className="w-4 h-4 text-purple-500" />} label="参与学者">
                  <span className="text-sm text-gray-700">{scholars.length} 人</span>
                </InfoRow>

                {detail.photo_url && (
                  <InfoRow
                    icon={<ImageIcon className="w-4 h-4 text-emerald-500" />}
                    label="活动照片"
                  >
                    <a
                      href={detail.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline break-all"
                    >
                      {detail.photo_url}
                    </a>
                  </InfoRow>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  记录时间
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">创建时间</p>
                    <p className="text-xs text-gray-600">
                      {new Date(detail.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  {detail.updated_at && (
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">最后更新</p>
                      <p className="text-xs text-gray-600">
                        {new Date(detail.updated_at).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {detailAsListItem && (
        <ActivityFormModal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          onSubmit={
            handleUpdate as Parameters<typeof ActivityFormModal>[0]["onSubmit"]
          }
          activity={detailAsListItem}
          mode="edit"
        />
      )}

      <ActivityScholarsModal
        isOpen={scholarsModalOpen}
        onClose={() => {
          setScholarsModalOpen(false);
          refreshScholars();
        }}
        activityId={detail.id}
        activityTitle={detail.title}
      />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        {label && <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>}
        {children}
      </div>
    </div>
  );
}
