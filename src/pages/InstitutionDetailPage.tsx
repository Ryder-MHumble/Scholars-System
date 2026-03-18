import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  GraduationCap,
  UserCheck,
  Layers,
  Handshake,
  CalendarDays,
  Edit2,
  Trash2,
  BookOpen,
  FlaskConical,
  UserCog,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  fetchInstitutionDetail,
  deleteInstitution,
} from "@/services/institutionApi";
import type { InstitutionDetail } from "@/types/institution";
import { UniversityLogo } from "@/components/institution/detail/UniversityLogo";
import {
  CategoryBadge,
  PriorityBadge,
} from "@/components/institution/detail/InstitutionBadges";
import { StatCard } from "@/components/institution/detail/StatCard";
import { CollapsibleSection } from "@/components/institution/detail/CollapsibleSection";
import {
  TagList,
  PersonList,
} from "@/components/institution/detail/PersonComponents";
import { EditInstitutionModal } from "@/components/institution/detail/EditInstitutionModal";
import { DeleteConfirmDialog } from "@/components/institution/detail/DeleteConfirmDialog";

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState<InstitutionDetail | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchInstitutionDetail(id)
      .then(setInstitution)
      .catch(() => setInstitution(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!institution) return;
    await deleteInstitution(institution.id);
    navigate("/?tab=institutions");
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
          <p className="text-slate-500 mb-3 font-medium">
            机构不存在或加载失败
          </p>
          <button
            onClick={() => navigate("/?tab=institutions")}
            className="text-blue-600 hover:underline text-sm"
          >
            ← 返回机构库
          </button>
        </div>
      </div>
    );
  }

  const hasLeadership =
    (institution.resident_leaders?.length ?? 0) > 0 ||
    (institution.degree_committee?.length ?? 0) > 0 ||
    (institution.teaching_committee?.length ?? 0) > 0;

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
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero header ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="py-3 border-b border-slate-700/50">
            <button
              onClick={() => navigate("/?tab=institutions")}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              机构库
            </button>
          </div>

          <div className="py-7 flex items-start justify-between gap-6">
            <div className="flex items-center gap-6 flex-1 min-w-0">
              <UniversityLogo
                name={institution.name}
                id={institution.id}
                avatar={institution.avatar}
                onEditAvatar={() => setEditOpen(true)}
              />
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                  {institution.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 mt-3">
                  {institution.org_name && (
                    <span className="text-xs text-slate-300 font-medium">
                      {institution.org_name}
                    </span>
                  )}
                  {institution.category && (
                    <CategoryBadge label={institution.category} />
                  )}
                  {institution.priority && (
                    <PriorityBadge label={institution.priority} />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all"
              >
                <Edit2 className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          <StatCard
            label="学者总数"
            value={institution.scholar_count}
            icon={Users}
            styleIdx={0}
          />
          <StatCard
            label="24 级学生"
            value={institution.student_count_24}
            icon={GraduationCap}
            styleIdx={1}
          />
          <StatCard
            label="25 级学生"
            value={institution.student_count_25}
            icon={GraduationCap}
            styleIdx={2}
          />
          <StatCard
            label="学生总数"
            value={institution.student_count_total}
            icon={BookOpen}
            styleIdx={3}
          />
          <StatCard
            label="导师数"
            value={institution.mentor_count}
            icon={UserCog}
            styleIdx={4}
          />
        </div>

        {/* Leadership */}
        <CollapsibleSection
          title="负责人 & 委员会"
          icon={UserCheck}
          styleIdx={0}
          count={
            (institution.resident_leaders?.length ?? 0) +
            (institution.degree_committee?.length ?? 0) +
            (institution.teaching_committee?.length ?? 0)
          }
        >
          {!hasLeadership ? (
            <p className="text-sm text-slate-400 italic">暂无数据</p>
          ) : (
            <div className="space-y-4">
              {(institution.resident_leaders?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    驻校负责人
                  </p>
                  <TagList items={institution.resident_leaders || []} />
                </div>
              )}
              {(institution.degree_committee?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    学位委员会
                  </p>
                  <TagList items={institution.degree_committee || []} />
                </div>
              )}
              {(institution.teaching_committee?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    教学委员会
                  </p>
                  <TagList items={institution.teaching_committee || []} />
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>

        {/* University leaders */}
        {(institution.university_leaders?.length ?? 0) > 0 && (
          <CollapsibleSection
            title="大学领导"
            icon={GraduationCap}
            styleIdx={1}
            count={institution.university_leaders?.length ?? 0}
          >
            <PersonList items={institution.university_leaders || []} />
          </CollapsibleSection>
        )}

        {/* Notable scholars */}
        {(institution.notable_scholars?.length ?? 0) > 0 && (
          <CollapsibleSection
            title="知名学者"
            icon={Users}
            styleIdx={2}
            count={institution.notable_scholars?.length ?? 0}
          >
            <PersonList items={institution.notable_scholars || []} />
          </CollapsibleSection>
        )}

        {/* Departments */}
        <CollapsibleSection
          title="院系信息"
          icon={Layers}
          styleIdx={3}
          count={institution.departments?.length ?? 0}
        >
          {(institution.departments?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 italic">暂无院系数据</p>
          ) : (
            <DepartmentList departments={institution.departments || []} />
          )}
        </CollapsibleSection>

        {/* Cooperation */}
        {hasCooperation && (
          <CollapsibleSection title="合作项目" icon={Handshake} styleIdx={4}>
            <div className="space-y-4">
              {(institution.key_departments?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    重点合作院系
                  </p>
                  <TagList items={institution.key_departments || []} />
                </div>
              )}
              {(institution.joint_labs?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    联合实验室
                  </p>
                  <TagList items={institution.joint_labs || []} />
                </div>
              )}
              {(institution.training_cooperation?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    培养合作
                  </p>
                  <TagList items={institution.training_cooperation || []} />
                </div>
              )}
              {(institution.academic_cooperation?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    学术合作
                  </p>
                  <TagList items={institution.academic_cooperation || []} />
                </div>
              )}
              {(institution.talent_dual_appointment?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    人才双聘
                  </p>
                  <TagList items={institution.talent_dual_appointment || []} />
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Activities */}
        {hasActivities && (
          <CollapsibleSection
            title="合作动态"
            icon={CalendarDays}
            styleIdx={5}
            defaultOpen={false}
          >
            <div className="space-y-4">
              {(institution.recruitment_events?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    招募活动
                  </p>
                  <div className="space-y-1.5">
                    {(institution.recruitment_events || []).map((event, i) => (
                      <p
                        key={i}
                        className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-2.5 leading-relaxed"
                      >
                        {event}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {(institution.visit_exchanges?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    访问交流
                  </p>
                  <div className="space-y-1.5">
                    {(institution.visit_exchanges || []).map((event, i) => (
                      <p
                        key={i}
                        className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-2.5 leading-relaxed"
                      >
                        {event}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {(institution.cooperation_focus?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    合作重点
                  </p>
                  <TagList items={institution.cooperation_focus || []} />
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* View all scholars CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-white">学者数据库</p>
                <p className="text-sm text-blue-100 mt-0.5">
                  该机构收录{" "}
                  <span className="font-bold text-white">
                    {institution.scholar_count}
                  </span>{" "}
                  位学者的详细信息
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                navigate(
                  `/?tab=scholars&university=${encodeURIComponent(institution.name)}`,
                )
              }
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-blue-50 text-blue-600 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex-shrink-0"
            >
              <Users className="w-5 h-5" />
              查看全部
            </button>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
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

// ── Department list (local to this page) ───────────────────────────────────

function DepartmentList({
  departments,
}: {
  departments: InstitutionDetail["departments"];
}) {
  const maxCount = Math.max(...departments.map((d) => d.scholar_count), 1);
  return (
    <div className="space-y-3">
      {departments.map((dept) => (
        <motion.div
          key={dept.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all hover:shadow-sm"
        >
          <div className="w-1 h-auto min-h-[60px] rounded-full bg-gradient-to-b from-blue-500 to-blue-300 flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <p className="text-sm font-bold text-slate-800">{dept.name}</p>
              <p className="text-xl font-black text-blue-600 flex-shrink-0">
                {dept.scholar_count}
              </p>
            </div>
            {dept.org_name && dept.org_name !== dept.name && (
              <p className="text-xs text-slate-400 mb-2 truncate">
                {dept.org_name}
              </p>
            )}
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${(dept.scholar_count / maxCount) * 100}%` }}
              />
            </div>
            {dept.sources.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dept.sources.map((src) => (
                  <span
                    key={src.source_id}
                    className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      src.is_enabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {src.source_name}
                    {src.scholar_count > 0 && ` · ${src.scholar_count}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
