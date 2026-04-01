import { useState, useEffect, useMemo } from "react";
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
  Mail,
  ArrowUpRight,
  Building2,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ActivityFormModal } from "@/components/activity/ActivityFormModal";
import { ActivityScholarsModal } from "@/components/activity/ActivityScholarsModal";
import { ScholarAvatar } from "@/components/common/ScholarSearchPicker";
import {
  fetchActivityDetail,
  fetchActivityScholars,
  updateActivity,
  deleteActivity,
} from "@/services/activityApi";
import type {
  ActivityEvent,
  ActivityEventDetail,
  ActivityScholarDetail,
  ActivityUpdateRequest,
} from "@/services/activityApi";

const EVENT_TYPE_GRADIENT: Record<string, string> = {
  学科前沿讲座: "from-blue-600 via-blue-500 to-cyan-500",
  前沿沙龙: "from-indigo-600 via-violet-500 to-purple-500",
  学术带头人论坛: "from-emerald-600 via-emerald-500 to-teal-500",
  讲座: "from-amber-600 via-orange-500 to-amber-500",
  其他: "from-slate-700 via-slate-600 to-slate-500",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "日期待定";
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("zh-CN");
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("zh-CN");
}

function formatTime(dateStr: string): string | null {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
  const [scholars, setScholars] = useState<ActivityScholarDetail[]>([]);
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
        fetchActivityScholars(id).catch(() => [] as ActivityScholarDetail[]),
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
    if (activityId) void loadDetail(activityId);
  }, [activityId]);

  const refreshScholars = async () => {
    if (!activityId) return;
    const s = await fetchActivityScholars(activityId).catch(
      () => [] as ActivityScholarDetail[],
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
    if (!confirm(`确定要删除活动「${detail.title}」吗？此操作无法撤销。`)) {
      return;
    }
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
    ? (EVENT_TYPE_GRADIENT[detail.event_type] ?? EVENT_TYPE_GRADIENT["其他"])
    : EVENT_TYPE_GRADIENT["其他"];

  const timeStr = detail?.event_time?.trim() || (detail ? formatTime(detail.event_date) : null);
  const safeTitle = String(detail?.title ?? "").trim() || "未命名活动";

  const scholarRows = useMemo(
    () =>
      scholars.map((scholar, idx) => {
        const name = String(scholar.name ?? "").trim() || "未命名学者";
        const linkId = String(
          scholar.scholar_url_hash ?? scholar.scholar_id ?? "",
        ).trim();
        const keyBase =
          String(scholar.scholar_id || scholar.scholar_url_hash || "").trim() ||
          `${name}-${idx}`;

        return {
          key: `${keyBase}-${idx}`,
          name,
          linkId,
          photoUrl: String(scholar.photo_url ?? "").trim() || undefined,
          university: String(scholar.university ?? "").trim() || "未知机构",
          department: String(scholar.department ?? "").trim() || "—",
          position: String(scholar.position ?? "").trim() || "—",
          email: String(scholar.email ?? "").trim() || "",
        };
      }),
    [scholars],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
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

      <div className="max-w-6xl mx-auto px-6 py-8">
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

          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_45%)]" />
            <div className="relative px-7 py-7 md:px-9 md:py-8 text-white">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                  {detail.event_type || "未分类"}
                </span>
                <span className="text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full">
                  {detail.category || "未分类"}
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

              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-5 tracking-tight">
                {safeTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/90">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 shrink-0" />
                  {formatDate(detail.event_date)}
                </span>
                {timeStr && (
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Clock className="w-4 h-4 shrink-0" />
                    {timeStr}
                  </span>
                )}
                {detail.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {detail.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 shrink-0" />
                  {scholarRows.length} 位关联学者
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_340px] gap-6">
            <div className="space-y-5">
              {detail.abstract && (
                <section className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    摘要
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {detail.abstract}
                  </p>
                </section>
              )}

              <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-600" />
                    参与学者
                    <span className="text-xs text-gray-400">{scholarRows.length} 人</span>
                  </h3>
                  <button
                    onClick={() => setScholarsModalOpen(true)}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    管理名单
                  </button>
                </div>

                {scholarRows.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <Users className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">暂无关联学者</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_40px] gap-4 px-6 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/70">
                      <span>学者</span>
                      <span>所属机构</span>
                      <span>院系 / 职称</span>
                      <span />
                    </div>
                    {scholarRows.map((row) => (
                      <button
                        key={row.key}
                        type="button"
                        disabled={!row.linkId}
                        onClick={() =>
                          row.linkId
                            ? navigate(`/scholars/${row.linkId}`, {
                                state: { from: location },
                              })
                            : undefined
                        }
                        className="w-full text-left px-6 py-4 hover:bg-primary-50/50 transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_40px] gap-3 md:gap-4 items-center">
                          <div className="min-w-0 flex items-center gap-3">
                            <ScholarAvatar
                              name={row.name}
                              photoUrl={row.photoUrl}
                              size={36}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{row.name}</p>
                              {row.email ? (
                                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {row.email}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400">暂无邮箱</p>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0 flex items-center gap-1.5 text-sm text-gray-700">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{row.university}</span>
                          </div>

                          <div className="min-w-0 text-sm text-gray-600">
                            <p className="truncate">{row.department}</p>
                            <p className="truncate text-xs text-gray-400 mt-0.5">{row.position}</p>
                          </div>

                          <div className="hidden md:flex justify-end">
                            <ArrowUpRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-4">
              <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  活动信息
                </h3>

                <InfoItem icon={<Calendar className="w-4 h-4 text-blue-500" />} label="日期">
                  <span className="text-sm text-gray-700 font-medium">
                    {formatDateShort(detail.event_date)}
                    {timeStr && <span className="ml-2 text-primary-600">{timeStr}</span>}
                  </span>
                </InfoItem>

                <InfoItem icon={<MapPin className="w-4 h-4 text-rose-500" />} label="地点">
                  <span className="text-sm text-gray-700">{detail.location || "—"}</span>
                </InfoItem>

                {detail.duration ? (
                  <InfoItem icon={<Clock className="w-4 h-4 text-indigo-500" />} label="时长">
                    <span className="text-sm text-gray-700">{detail.duration} 小时</span>
                  </InfoItem>
                ) : null}

                <InfoItem icon={<Users className="w-4 h-4 text-purple-500" />} label="参与学者">
                  <span className="text-sm text-gray-700">{scholarRows.length} 人</span>
                </InfoItem>

                {detail.photo_url && (
                  <InfoItem
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
                  </InfoItem>
                )}
              </section>

              <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  记录时间
                </h3>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">创建时间</p>
                  <p className="text-xs text-gray-600">{formatDateTime(detail.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">最后更新</p>
                  <p className="text-xs text-gray-600">
                    {formatDateTime(detail.updated_at ?? detail.created_at)}
                  </p>
                </div>
              </section>
            </aside>
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
          void refreshScholars();
        }}
        activityId={detail.id}
        activityTitle={safeTitle}
      />
    </div>
  );
}

function InfoItem({
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
        <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
