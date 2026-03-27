import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarDays,
  Edit2,
  GraduationCap,
  Handshake,
  Landmark,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DeleteConfirmDialog } from "@/components/institution/detail/DeleteConfirmDialog";
import { EditInstitutionModal } from "@/components/institution/detail/EditInstitutionModal";
import {
  CategoryBadge,
  PriorityBadge,
  Tag,
} from "@/components/institution/detail/InstitutionBadges";
import { LeadershipCardList, PersonList } from "@/components/institution/detail/PersonComponents";
import { UniversityLogo } from "@/components/institution/detail/UniversityLogo";
import {
  deleteInstitution,
  fetchInstitutionDetail,
  fetchInstitutionLeadership,
} from "@/services/institutionApi";
import type { InstitutionDetail, LeadershipDetailResponse } from "@/types/institution";

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState<InstitutionDetail | null>(null);
  const [leadership, setLeadership] = useState<LeadershipDetailResponse | null>(null);
  const [leadershipLoading, setLeadershipLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const from = (location.state as { from?: { pathname?: string; search?: string } })
    ?.from;
  const restoreInstitutionListState = (
    location.state as { restoreInstitutionListState?: unknown }
  )?.restoreInstitutionListState;

  const backHref =
    from?.pathname && from.pathname !== ""
      ? `${from.pathname}${from.search ?? ""}`
      : "/?tab=institutions";

  const goBackToList = () => {
    if (restoreInstitutionListState) {
      navigate(backHref, { state: { restoreInstitutionListState } });
      return;
    }
    navigate(backHref);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLeadershipLoading(true);
    Promise.all([
      fetchInstitutionDetail(id),
      fetchInstitutionLeadership(id).catch(() => null),
    ])
      .then(([institutionDetail, leadershipDetail]) => {
        setInstitution(institutionDetail);
        setLeadership(leadershipDetail);
      })
      .catch(() => setInstitution(null))
      .finally(() => {
        setLoading(false);
        setLeadershipLoading(false);
      });
  }, [id]);

  async function handleDelete() {
    if (!institution) return;
    await deleteInstitution(institution.id);
    goBackToList();
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-3 font-medium">机构不存在或加载失败</p>
          <button
            onClick={goBackToList}
            className="text-blue-600 hover:underline text-sm"
          >
            ← 返回机构库
          </button>
        </div>
      </div>
    );
  }

  const hasLeadership = (leadership?.leaders?.length ?? 0) > 0;

  const hasCooperation =
    (institution.key_departments?.length ?? 0) > 0 ||
    (institution.joint_labs?.length ?? 0) > 0 ||
    (institution.training_cooperation?.length ?? 0) > 0 ||
    (institution.academic_cooperation?.length ?? 0) > 0 ||
    (institution.talent_dual_appointment?.length ?? 0) > 0;

  const hasActivities =
    (institution.recruitment_events?.length ?? 0) > 0 ||
    (institution.visit_exchanges?.length ?? 0) > 0 ||
    (institution.cooperation_focus?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#f8fafc_0%,_#f1f5f9_45%,_#eef2ff_100%)]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-5">
        <HeroHeader
          institution={institution}
          onBack={goBackToList}
          onEdit={() => setEditOpen(true)}
          onDelete={() => setDeleteOpen(true)}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-5">
          <main className="xl:col-span-8 space-y-4">
            <SectionCard
              title="领导信息"
              icon={Landmark}
              count={leadership?.leader_count ?? undefined}
            >
              {leadershipLoading ? (
                <EmptyState text="领导信息加载中..." />
              ) : !hasLeadership ? (
                <EmptyState text="暂无院领导数据" />
              ) : (
                <LeadershipCardList leaders={leadership?.leaders || []} />
              )}
            </SectionCard>

            <SectionCard
              title="院系结构"
              icon={Building2}
              count={institution.departments?.length ?? 0}
            >
              {(institution.departments?.length ?? 0) > 0 ? (
                <DepartmentList departments={institution.departments || []} />
              ) : (
                <EmptyState text="暂无院系数据" />
              )}
            </SectionCard>

            {hasCooperation && (
              <SectionCard title="合作网络" icon={Handshake}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <SubBlock title="重点合作院系" items={institution.key_departments || []} />
                  <SubBlock title="联合实验室" items={institution.joint_labs || []} />
                  <SubBlock title="培养合作" items={institution.training_cooperation || []} />
                  <SubBlock title="学术合作" items={institution.academic_cooperation || []} />
                  <div className="md:col-span-2">
                    <SubBlock title="人才双聘" items={institution.talent_dual_appointment || []} />
                  </div>
                </div>
              </SectionCard>
            )}

            {hasActivities && (
              <SectionCard title="合作动态" icon={CalendarDays}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ParagraphList title="招募活动" items={institution.recruitment_events || []} />
                  <ParagraphList title="访问交流" items={institution.visit_exchanges || []} />
                </div>
                {(institution.cooperation_focus?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      合作重点
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(institution.cooperation_focus || []).map((item, idx) => (
                        <Tag key={`${item}-${idx}`}>{item}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}
          </main>

          <aside className="xl:col-span-4 space-y-4 xl:sticky xl:top-4 self-start">
            <SectionCard title="核心数据" icon={BookOpen} compact>
              <div className="grid grid-cols-2 gap-2.5">
                <MetricCard icon={Users} label="学者总数" value={institution.scholar_count} />
                <MetricCard
                  icon={GraduationCap}
                  label="24级学生"
                  value={institution.student_count_24}
                />
                <MetricCard
                  icon={GraduationCap}
                  label="25级学生"
                  value={institution.student_count_25}
                />
                <MetricCard
                  icon={BookOpen}
                  label="学生总数"
                  value={institution.student_count_total}
                />
                <div className="col-span-2">
                  <MetricCard icon={UserCog} label="导师数" value={institution.mentor_count} />
                </div>
              </div>
            </SectionCard>

            {(institution.notable_scholars?.length ?? 0) > 0 && (
              <SectionCard
                title="知名学者"
                icon={Users}
                count={institution.notable_scholars?.length ?? 0}
                compact
              >
                <PersonList items={institution.notable_scholars || []} />
              </SectionCard>
            )}

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.12 }}
              className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 border border-blue-500/20 shadow-lg"
            >
              <p className="text-sm font-bold text-white">学者数据库</p>
              <p className="mt-1 text-xs text-blue-100 leading-relaxed">
                该机构当前收录
                <span className="mx-1 text-white font-extrabold text-base">
                  {institution.scholar_count ?? 0}
                </span>
                位学者，可进入学者库查看详情。
              </p>
              <button
                onClick={() =>
                  navigate(`/?tab=scholars&university=${encodeURIComponent(institution.name)}`)
                }
                className="mt-3 w-full px-3 py-2 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                查看全部学者
              </button>
            </motion.div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {editOpen && (
          <EditInstitutionModal
            institution={institution}
            onClose={() => setEditOpen(false)}
            onSaved={(updated) => {
              setInstitution(updated);
              setEditOpen(false);
            }}
          />
        )}
        {deleteOpen && (
          <DeleteConfirmDialog
            name={institution.name}
            onCancel={() => setDeleteOpen(false)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function HeroHeader({
  institution,
  onBack,
  onEdit,
  onDelete,
}: {
  institution: InstitutionDetail;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.28),transparent_45%)]" />
      <div className="relative p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            机构库
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> 编辑
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-400/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> 删除
            </button>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <UniversityLogo
            name={institution.name}
            id={institution.id}
            avatar={institution.avatar}
            onEditAvatar={onEdit}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              {institution.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-sm text-slate-300">
              {institution.org_name && <span className="font-medium">{institution.org_name}</span>}
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 text-xs border border-white/10">
                ID: {institution.id}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {institution.category && <CategoryBadge label={institution.category} />}
              {institution.priority && <PriorityBadge label={institution.priority} />}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  count,
  compact = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count?: number;
  compact?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className={`flex items-center gap-3 border-b border-slate-100 ${compact ? "px-4 py-3" : "px-4 py-3.5"}`}>
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        {count != null && (
          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {count}
          </span>
        )}
      </div>
      <div className={compact ? "p-3.5" : "p-4"}>{children}</div>
    </motion.section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 font-medium">{label}</span>
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <p className={`mt-1 text-xl font-extrabold ${value != null ? "text-slate-800" : "text-slate-300"}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

function SubBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, idx) => (
            <Tag key={`${item}-${idx}`}>{item}</Tag>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">暂无数据</p>
      )}
    </div>
  );
}

function ParagraphList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <p
            key={`${item}-${idx}`}
            className="text-sm text-slate-700 bg-white rounded-lg px-2.5 py-2 border border-slate-100"
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function DepartmentList({ departments }: { departments: InstitutionDetail["departments"] }) {
  const maxCount = Math.max(...departments.map((d) => d.scholar_count), 1);

  return (
    <div className="space-y-2.5">
      {departments.map((dept) => (
        <motion.div
          key={dept.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-slate-200 bg-slate-50/40 px-3 py-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 leading-snug truncate">{dept.name}</p>
              {dept.org_name && dept.org_name !== dept.name && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{dept.org_name}</p>
              )}
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {dept.scholar_count} 学者
            </span>
          </div>

          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              style={{ width: `${(dept.scholar_count / maxCount) * 100}%` }}
            />
          </div>

          {(dept.sources?.length ?? 0) > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(dept.sources || []).map((src) => (
                <span
                  key={src.source_id}
                  className={
                    src.is_enabled
                      ? "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700"
                      : "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-200 text-slate-600"
                  }
                >
                  {src.source_name}
                  {src.scholar_count > 0 && ` · ${src.scholar_count}`}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 italic">{text}</p>;
}
