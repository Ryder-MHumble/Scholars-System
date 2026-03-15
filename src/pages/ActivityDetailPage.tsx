import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Edit2,
  Trash2,
  User,
  Building2,
  FileText,
  Hash,
  Award,
  Megaphone,
  CheckCircle,
  AlertCircle,
  Circle,
  Link as LinkIcon,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function AuditBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
        <CheckCircle className="w-3.5 h-3.5" />
        已通过
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
        <AlertCircle className="w-3.5 h-3.5" />
        已拒绝
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
      <Circle className="w-3.5 h-3.5" />
      待审核
    </span>
  );
}

interface ActivityScholar {
  scholar_id: string;
  name: string;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ActivityDetailPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();

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

  // Refresh scholars after managing
  const refreshScholars = async () => {
    if (!activityId) return;
    const s = await fetchActivityScholars(activityId).catch(
      () => [] as ActivityScholar[],
    );
    setScholars(s);
    // Also refresh detail to get updated scholar_ids
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
      navigate("/?tab=activities");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "删除失败");
      setIsDeleting(false);
    }
  };

  // Convert ActivityEventDetail -> ActivityEvent for the form modal
  const detailAsListItem: ActivityEvent | null = detail
    ? {
        id: detail.id,
        category: detail.category,
        event_type: detail.event_type,
        series: detail.series,
        title: detail.title,
        speaker_name: detail.speaker_name,
        speaker_organization: detail.speaker_organization,
        event_date: detail.event_date,
        location: detail.location,
        series_number: detail.series_number,
        scholar_count: detail.scholar_ids?.length ?? 0,
        created_at: detail.created_at,
      }
    : null;

  const gradient = detail
    ? (EVENT_TYPE_GRADIENT[detail.event_type] ?? "from-gray-500 to-gray-600")
    : "from-gray-500 to-gray-600";

  // ── Loading / Error states ──
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
            onClick={() => navigate("/?tab=activities")}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            返回活动列表
          </button>
        </div>
      </div>
    );
  }

  const timeStr = formatTime(detail.event_date);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/?tab=activities")}
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

          {/* ── Hero card ── */}
          <div
            className={`rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br ${gradient}`}
          >
            <div className="px-7 py-6 text-white">
              {/* Type + Series */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                  {detail.event_type}
                </span>
                {detail.series_number && (
                  <span className="text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Hash className="w-3 h-3" />第 {detail.series_number} 期
                  </span>
                )}
                <AuditBadge status={detail.audit_status} />
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
                {detail.title}
              </h1>

              {/* Date / Location row */}
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
              </div>
            </div>
          </div>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Left: Abstract + Speaker */}
            <div className="md:col-span-2 space-y-5">
              {/* Abstract */}
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

              {/* Speaker */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  主讲人
                </h3>
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0 overflow-hidden">
                    {detail.speaker_photo_url ? (
                      <img
                        src={detail.speaker_photo_url}
                        alt={detail.speaker_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <User className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900">
                      {detail.speaker_name}
                    </p>
                    {detail.speaker_position && (
                      <p className="text-sm text-primary-600 font-medium mt-0.5">
                        {detail.speaker_position}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      {detail.speaker_organization}
                    </p>
                  </div>
                </div>
                {detail.speaker_bio && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {detail.speaker_bio}
                    </p>
                  </div>
                )}
              </div>

              {/* Scholars */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    参与学者
                    <span className="ml-1 text-gray-300 font-normal normal-case">
                      ({scholars.length})
                    </span>
                  </h3>
                  <button
                    onClick={() => setScholarsModalOpen(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    管理关联
                  </button>
                </div>

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
                        onClick={() => navigate(`/scholars/${s.scholar_id}`)}
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

            {/* Right: Info sidebar */}
            <div className="space-y-4">
              {/* Quick info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  活动信息
                </h3>

                <InfoRow
                  icon={<Calendar className="w-4 h-4 text-blue-500" />}
                  label="日期"
                >
                  <span className="text-sm text-gray-700 font-medium">
                    {new Date(detail.event_date).toLocaleDateString("zh-CN")}
                    {timeStr && (
                      <span className="ml-2 text-primary-600">{timeStr}</span>
                    )}
                  </span>
                </InfoRow>

                {detail.location && (
                  <InfoRow
                    icon={<MapPin className="w-4 h-4 text-rose-500" />}
                    label="地点"
                  >
                    <span className="text-sm text-gray-700">
                      {detail.location}
                    </span>
                  </InfoRow>
                )}

                {detail.duration && (
                  <InfoRow
                    icon={<Clock className="w-4 h-4 text-amber-500" />}
                    label="时长"
                  >
                    <span className="text-sm text-gray-700">
                      {detail.duration} 小时
                    </span>
                  </InfoRow>
                )}

                <InfoRow
                  icon={<Users className="w-4 h-4 text-purple-500" />}
                  label="参与学者"
                >
                  <span className="text-sm text-gray-700">
                    {scholars.length} 人
                  </span>
                </InfoRow>

                <InfoRow
                  icon={<Circle className="w-4 h-4 text-gray-400" />}
                  label="审核状态"
                >
                  <AuditBadge status={detail.audit_status} />
                </InfoRow>
              </div>

              {/* Admin info */}
              {(detail.certificate_number ||
                detail.publicity ||
                detail.needs_email_invitation ||
                detail.created_by) && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    管理信息
                  </h3>

                  {detail.certificate_number && (
                    <InfoRow
                      icon={<Award className="w-4 h-4 text-emerald-500" />}
                      label="证书编号"
                    >
                      <span className="text-sm text-gray-700 font-mono">
                        {detail.certificate_number}
                      </span>
                    </InfoRow>
                  )}

                  {detail.publicity && (
                    <InfoRow
                      icon={<Megaphone className="w-4 h-4 text-orange-500" />}
                      label="宣传方式"
                    >
                      <span className="text-sm text-gray-700">
                        {detail.publicity}
                      </span>
                    </InfoRow>
                  )}

                  {detail.needs_email_invitation && (
                    <InfoRow
                      icon={<CheckCircle className="w-4 h-4 text-blue-500" />}
                      label=""
                    >
                      <span className="text-sm text-blue-600 font-medium">
                        需发邮件邀请
                      </span>
                    </InfoRow>
                  )}

                  {detail.created_by && (
                    <InfoRow
                      icon={<User className="w-4 h-4 text-gray-400" />}
                      label="录入人"
                    >
                      <span className="text-sm text-gray-700">
                        {detail.created_by}
                      </span>
                    </InfoRow>
                  )}
                </div>
              )}

              {/* Timestamps */}
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
                      <p className="text-[10px] text-gray-400 mb-0.5">
                        最后更新
                      </p>
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

      {/* ── Modals ── */}
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

// ─── Helper component ─────────────────────────────────────────────────────────
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
