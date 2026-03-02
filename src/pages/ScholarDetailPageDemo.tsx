import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Globe,
  ExternalLink,
  Award,
  Building2,
  GraduationCap,
  Briefcase,
  User,
  Calendar,
  BookOpen,
  Handshake,
  ClipboardList,
  Phone,
  FileText,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Link2,
} from "lucide-react";
import {
  fetchFacultyDetail,
  patchFacultyRelation,
  postFacultyUpdate,
  type FacultyDetail,
  type NewFacultyUpdate,
} from "@/services/facultyApi";
import { StatsSidebar } from "@/components/scholar-detail/stats/StatsSidebar";
import { PageSkeleton } from "@/components/scholar-detail/shared/SkeletonLoader";
import { getInitial } from "@/utils/avatar";
import { cn } from "@/utils/cn";
import {
  slideInLeft,
  slideInUp,
  slideInRight,
  staggerContainer,
  listItem,
} from "@/utils/animations";

// ─── 左侧分区标题 ─────────────────────────────────────────────────
function SideLabel({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <Icon className="w-3.5 h-3.5 text-primary-500" />
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </span>
    </div>
  );
}

// ─── 新增动态弹窗 ────────────────────────────────────────────────
function AddUpdateModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: NewFacultyUpdate) => Promise<void>;
}) {
  const [form, setForm] = useState<NewFacultyUpdate>({
    update_type: "general",
    title: "",
    content: "",
    source_url: "",
    published_at: "",
    added_by: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">新增动态备注</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">类型</label>
            <select
              value={form.update_type}
              onChange={(e) => setForm((f) => ({ ...f, update_type: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
            >
              <option value="general">一般动态</option>
              <option value="major_project">重大项目</option>
              <option value="talent_title">人才称号</option>
              <option value="appointment">任职履新</option>
              <option value="award">获奖信息</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">标题 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="请输入标题"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">内容 *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
              placeholder="请输入内容"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">来源链接</label>
            <input
              value={form.source_url}
              onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">发布日期</label>
            <input
              type="date"
              value={form.published_at}
              onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">添加人</label>
            <input
              value={form.added_by}
              onChange={(e) => setForm((f) => ({ ...f, added_by: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="姓名或工号"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.title.trim() || !form.content.trim()}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "提交中..." : "提交"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ScholarDetailPageDemo() {
  const { scholarId } = useParams<{ scholarId: string }>();
  const [faculty, setFaculty] = useState<FacultyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    if (!scholarId) return;
    setIsLoading(true);
    setError(null);
    fetchFacultyDetail(scholarId)
      .then((data) => {
        setFaculty(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "加载失败");
        setIsLoading(false);
      });
  }, [scholarId]);

  if (isLoading) return <PageSkeleton />;

  if (error || !faculty) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500">{error ?? "未找到该学者"}</p>
        <Link
          to="/"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 返回列表
        </Link>
      </div>
    );
  }

  const statsData = {
    papers: faculty.publications_count > 0 ? faculty.publications_count : 0,
    citations: faculty.citations_count > 0 ? faculty.citations_count : 0,
    hIndex: faculty.h_index > 0 ? faculty.h_index : 0,
    gIndex: faculty.h_index > 0 ? Math.floor(faculty.h_index * 1.3) : 0,
    sociability: 0,
    diversity: 0,
    activity: 0,
  };

  // Build advised students from supervised_students
  const advisedStudents = (faculty.supervised_students ?? []).map((s, idx) => ({
    id: String(idx),
    name: s.name ?? "未知",
    degree: (s.degree as "博士" | "硕士" | "博士后") ?? "博士",
    startYear: Number(s.start_year) || 0,
    endYear: s.end_year ? Number(s.end_year) : undefined,
    currentPosition: s.current_position,
  }));

  // Relation badges from boolean flags
  const relationBadges = [
    {
      label: "顾问委员",
      active: faculty.is_advisor_committee,
      desc: faculty.is_advisor_committee ? "顾问委员会" : "",
    },
    {
      label: "兼职导师",
      active: faculty.is_adjunct_supervisor,
      desc: faculty.is_adjunct_supervisor ? "联合培养" : "",
    },
    {
      label: "潜在引进",
      active: faculty.is_potential_recruit,
      desc: faculty.is_potential_recruit ? "已标记" : "",
    },
  ];

  const exchangeTypeColor: Record<string, string> = {
    学术交流: "bg-blue-100 text-blue-700",
    科研合作: "bg-violet-100 text-violet-700",
    人才培养: "bg-emerald-100 text-emerald-700",
    顾问咨询: "bg-amber-100 text-amber-700",
    联合活动: "bg-rose-100 text-rose-700",
  };

  const updateTypeLabel: Record<string, string> = {
    general: "一般动态",
    major_project: "重大项目",
    talent_title: "人才称号",
    appointment: "任职履新",
    award: "获奖信息",
  };

  const handleAddUpdate = async (data: NewFacultyUpdate) => {
    const updated = await postFacultyUpdate(faculty.url_hash, data);
    setFaculty(updated);
  };

  const handleRelationToggle = async (
    field: "is_advisor_committee" | "is_adjunct_supervisor" | "is_potential_recruit",
  ) => {
    const updated = await patchFacultyRelation(faculty.url_hash, {
      [field]: !faculty[field],
    });
    setFaculty(updated);
  };

  const BIO_LIMIT = 200;
  const bioText = faculty.bio ?? "";
  const bioNeedsExpand = bioText.length > BIO_LIMIT;

  return (
    <>
      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">联系方式</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {faculty.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${faculty.email}`}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      {faculty.email}
                    </a>
                  </div>
                )}
                {faculty.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{faculty.phone}</span>
                  </div>
                )}
                {faculty.profile_url && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a
                      href={faculty.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                    >
                      个人主页 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {!faculty.email && !faculty.phone && !faculty.profile_url && (
                  <p className="text-sm text-gray-400 text-center py-4">暂无联系方式</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Update Modal */}
      <AnimatePresence>
        {showAddUpdate && (
          <AddUpdateModal
            onClose={() => setShowAddUpdate(false)}
            onSubmit={handleAddUpdate}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              返回列表
            </Link>
          </motion.div>

          {/* Three Column Layout */}
          <div className="flex gap-5">
            {/* ══ Left Sidebar ══ */}
            <motion.aside
              className="w-[400px] shrink-0"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={slideInLeft}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Profile Header */}
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      {faculty.photo_url ? (
                        <img
                          src={faculty.photo_url}
                          alt={faculty.name}
                          className="w-[72px] h-[72px] rounded-xl object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-2xl font-bold bg-primary-600 text-white">
                          {getInitial(faculty.name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h2 className="text-lg font-bold text-gray-900 leading-snug">
                        {faculty.name}
                      </h2>
                      {faculty.name_en && (
                        <div className="text-sm text-gray-500">{faculty.name_en}</div>
                      )}
                      {faculty.position && (
                        <div className="text-sm text-gray-600">{faculty.position}</div>
                      )}
                      {faculty.department && (
                        <div className="text-xs text-gray-400">{faculty.department}</div>
                      )}
                    </div>
                  </div>

                  {/* University */}
                  {faculty.university && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{faculty.university}</span>
                    </div>
                  )}

                  {/* Academic titles */}
                  {faculty.academic_titles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {faculty.academic_titles.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200"
                        >
                          <Award className="w-3 h-3" />
                          {t.length > 12 ? t.slice(0, 12) + "..." : t}
                        </span>
                      ))}
                    </div>
                  )}
                  {faculty.is_academician && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                        <Award className="w-3 h-3" />
                        院士
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mb-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowContactModal(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      联系
                    </motion.button>
                    {faculty.profile_url && (
                      <motion.a
                        href={faculty.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-primary-300 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        主页
                      </motion.a>
                    )}
                  </div>

                  {/* Data completeness */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <span>数据完整度</span>
                      <span className="font-medium text-gray-600">{faculty.data_completeness}%</span>
                    </div>
                    <div className="text-gray-400">
                      {faculty.crawled_at ? `采集于 ${faculty.crawled_at.slice(0, 10)}` : ""}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                {(faculty.email || faculty.phone || faculty.profile_url || faculty.office) && (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <SideLabel icon={Mail} title="联系方式" />
                    <div className="space-y-2.5">
                      {faculty.email && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <a
                            href={`mailto:${faculty.email}`}
                            className="hover:text-primary-600 truncate transition-colors"
                          >
                            {faculty.email}
                          </a>
                        </div>
                      )}
                      {faculty.phone && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{faculty.phone}</span>
                        </div>
                      )}
                      {faculty.office && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{faculty.office}</span>
                        </div>
                      )}
                      {faculty.profile_url && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <a
                            href={faculty.profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary-600 flex items-center gap-1 transition-colors"
                          >
                            个人主页
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                      {faculty.google_scholar_url && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Link2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <a
                            href={faculty.google_scholar_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary-600 flex items-center gap-1 transition-colors"
                          >
                            Google Scholar
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                      {faculty.dblp_url && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Link2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <a
                            href={faculty.dblp_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary-600 flex items-center gap-1 transition-colors"
                          >
                            DBLP
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {bioText && (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <SideLabel icon={User} title="个人简介" />
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {bioNeedsExpand && !bioExpanded
                        ? bioText.slice(0, BIO_LIMIT) + "..."
                        : bioText}
                    </p>
                    {bioNeedsExpand && (
                      <button
                        onClick={() => setBioExpanded((v) => !v)}
                        className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        {bioExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" /> 收起
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" /> 展开全文
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Education */}
                {(() => {
                  const eduItems = faculty.education && faculty.education.length > 0
                    ? faculty.education
                    : faculty.phd_institution
                    ? [
                        {
                          degree: "博士",
                          institution: faculty.phd_institution,
                          major: "",
                          year: faculty.phd_year || "",
                          end_year: "",
                        },
                      ]
                    : [];
                  if (eduItems.length === 0) return null;
                  return (
                    <div className="px-5 py-4 border-t border-gray-100">
                      <SideLabel icon={GraduationCap} title="教育经历" />
                      <div className="space-y-4">
                        {eduItems.map((edu, i) => (
                          <div key={i} className="relative pl-5">
                            <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-white shadow-sm" />
                            {i < eduItems.length - 1 && (
                              <div className="absolute left-[4px] top-4 w-0.5 h-full bg-gray-200" />
                            )}
                            <div className="space-y-0.5">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-semibold text-gray-800">
                                  {edu.degree || "学历"}
                                </span>
                                {(edu.year || edu.end_year) && (
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {edu.end_year
                                      ? `${edu.year}–${edu.end_year}`
                                      : edu.year}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">{edu.institution}</div>
                              {edu.major && (
                                <div className="text-xs text-gray-400">{edu.major}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Work Experience (joint_management_roles) */}
                {faculty.joint_management_roles && faculty.joint_management_roles.length > 0 && (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <SideLabel icon={Briefcase} title="任职经历" />
                    <div className="space-y-4">
                      {faculty.joint_management_roles.map((role, i) => (
                        <div key={i} className="relative pl-5">
                          <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                          <div className="space-y-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-semibold text-gray-800">
                                {role.role || "职务"}
                              </span>
                              {(role.start_year || role.end_year) && (
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                  {role.end_year
                                    ? `${role.start_year}–${role.end_year}`
                                    : `${role.start_year}–至今`}
                                </span>
                              )}
                            </div>
                            {role.organization && (
                              <div className="text-sm text-gray-600">{role.organization}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research Areas */}
                {faculty.research_areas.length > 0 && (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <SideLabel icon={BookOpen} title="研究方向" />
                    <div className="flex flex-wrap gap-1.5">
                      {faculty.research_areas.slice(0, 10).map((area) => (
                        <span
                          key={area}
                          className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-100"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.aside>

            {/* ══ Center Content ══ */}
            <motion.main
              className="flex-1 min-w-0 space-y-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* ─ 与两院关系 ─ */}
              <motion.div
                variants={slideInUp}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Handshake className="w-5 h-5 text-primary-600" />
                  <h3 className="text-base font-semibold text-gray-900">与两院关系</h3>
                </div>

                {/* Relation badges */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    关系概况
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {relationBadges.map((rel) => (
                      <button
                        key={rel.label}
                        onClick={() => {
                          const fieldMap: Record<string, "is_advisor_committee" | "is_adjunct_supervisor" | "is_potential_recruit"> = {
                            顾问委员: "is_advisor_committee",
                            兼职导师: "is_adjunct_supervisor",
                            潜在引进: "is_potential_recruit",
                          };
                          const field = fieldMap[rel.label];
                          if (field) handleRelationToggle(field);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all hover:opacity-80",
                          rel.active
                            ? "bg-primary-50 border-primary-200 text-primary-700"
                            : "bg-gray-50 border-gray-200 text-gray-400",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            rel.active ? "bg-primary-500" : "bg-gray-300",
                          )}
                        />
                        <span className="font-medium">{rel.label}</span>
                        {rel.active && rel.desc && (
                          <span className="text-xs text-primary-500">{rel.desc}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {faculty.institute_relation_notes && (
                    <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {faculty.institute_relation_notes}
                    </p>
                  )}
                </div>

                {/* Exchange Records */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    交往记录
                  </p>
                  {faculty.academic_exchange_records && faculty.academic_exchange_records.length > 0 ? (
                    <div className="space-y-3">
                      {faculty.academic_exchange_records.map((record, index) => (
                        <motion.div
                          key={index}
                          variants={listItem}
                          className="flex gap-3 p-3.5 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200"
                        >
                          <div className="flex-shrink-0 flex flex-col items-center gap-1 w-14 text-center">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[10px] text-gray-400 leading-tight">
                              {(record.date ?? "").replace(/-/g, "/")}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {record.type && (
                                <span
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                    exchangeTypeColor[record.type] ?? "bg-gray-100 text-gray-600",
                                  )}
                                >
                                  {record.type}
                                </span>
                              )}
                              {record.organization && (
                                <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">
                                  {record.organization}
                                </span>
                              )}
                              <span className="text-sm font-medium text-gray-900">
                                {record.title}
                              </span>
                            </div>
                            {record.description && (
                              <p className="text-xs text-gray-500 leading-relaxed">
                                {record.description}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">暂无交往记录</p>
                  )}
                </div>
              </motion.div>

              {/* ─ 动态更新 ─ */}
              <motion.div
                variants={slideInUp}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="w-5 h-5 text-primary-600" />
                  <h3 className="text-base font-semibold text-gray-900">动态更新</h3>
                  <span className="ml-auto text-xs text-gray-400">
                    {faculty.recent_updates.length} 条
                  </span>
                  <button
                    onClick={() => setShowAddUpdate(true)}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors px-2 py-1 rounded border border-primary-200 hover:bg-primary-50"
                  >
                    <Plus className="w-3 h-3" />
                    添加备注
                  </button>
                </div>
                {faculty.recent_updates.length > 0 ? (
                  <div className="space-y-3">
                    {faculty.recent_updates.map((update, i) => (
                      <motion.div
                        key={i}
                        variants={listItem}
                        className="p-4 border border-gray-100 hover:border-primary-200 rounded-lg transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {update.title || updateTypeLabel[update.update_type ?? "general"] || "动态"}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {update.update_type && (
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                                {updateTypeLabel[update.update_type] || update.update_type}
                              </span>
                            )}
                            {update.published_at && (
                              <span>{update.published_at.slice(0, 10)}</span>
                            )}
                          </div>
                        </div>
                        {update.content && (
                          <p className="text-sm text-gray-600 leading-relaxed">{update.content}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {update.source_url && (
                            <a
                              href={update.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              查看来源
                            </a>
                          )}
                          {update.added_by && (
                            <span className="text-xs text-gray-400">
                              由 {update.added_by} 添加
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">暂无动态更新</p>
                )}
              </motion.div>

              {/* ─ 联合研究项目 ─ */}
              {faculty.joint_research_projects && faculty.joint_research_projects.length > 0 && (
                <motion.div
                  variants={slideInUp}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <h3 className="text-base font-semibold text-gray-900">联合研究项目</h3>
                    <span className="ml-auto text-xs text-gray-400">
                      {faculty.joint_research_projects.length} 项
                    </span>
                  </div>
                  <div className="space-y-3">
                    {faculty.joint_research_projects.map((proj, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-800">
                              {proj.title || "研究项目"}
                            </span>
                            {proj.year && (
                              <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                {String(proj.year)}
                              </span>
                            )}
                          </div>
                          {proj.description && (
                            <p className="text-xs text-gray-500 leading-relaxed">
                              {proj.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ─ 论文 ─ */}
              <motion.div
                variants={slideInUp}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    论文{" "}
                    {faculty.publications_count > 0 && (
                      <span className="text-primary-600">
                        共约 {faculty.publications_count} 篇
                      </span>
                    )}
                  </h3>
                </div>
                <p className="text-sm text-gray-400 text-center py-8">
                  论文详情数据暂未收录，可前往{" "}
                  {faculty.dblp_url ? (
                    <a
                      href={faculty.dblp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      DBLP
                    </a>
                  ) : (
                    "DBLP"
                  )}{" "}
                  或{" "}
                  {faculty.google_scholar_url ? (
                    <a
                      href={faculty.google_scholar_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Google Scholar
                    </a>
                  ) : (
                    "Google Scholar"
                  )}{" "}
                  查看
                </p>
              </motion.div>
            </motion.main>

            {/* ══ Right Sidebar ══ */}
            <motion.div variants={slideInRight} initial="hidden" animate="visible">
              <StatsSidebar
                stats={statsData}
                advisedStudents={advisedStudents}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
