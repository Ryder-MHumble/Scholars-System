import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Globe,
  ExternalLink,
  Award,
  Building2,
  Eye,
  Shield,
  GraduationCap,
  Briefcase,
  User,
  Medal,
  Calendar,
  BookOpen,
  Handshake,
  ClipboardList,
  Pencil,
  Phone,
  Save,
  X,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { scholars } from "@/data/scholars";
import { universities } from "@/data/universities";
import { papers } from "@/data/papers";
import { getEducationByScholarId } from "@/data/educationHistory";
import { getExperienceByScholarId } from "@/data/workExperience";
import { getAwardsByScholarId } from "@/data/detailedAwards";
import { getAgreementsByScholarId } from "@/data/agreements";
import { getInteractionsByScholarId } from "@/data/interactions";
import { getExternalContactById } from "@/data/externalContacts";
import { VerificationBadge } from "@/components/scholar-detail/shared/VerificationBadge";
import { PaperCard } from "@/components/scholar-detail/papers/PaperCard";
import { YearFilterBar } from "@/components/scholar-detail/papers/YearFilterBar";
import { PaperFilterPanel } from "@/components/scholar-detail/papers/PaperFilterPanel";
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
  tapScale,
} from "@/utils/animations";

// ─── 左侧分区标题（不可折叠） ─────────────────────────────────────────────────
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

// ─── 两院交往记录类型 ──────────────────────────────────────────────────────────
interface AcademyRecord {
  date: string;
  type: "学术交流" | "科研合作" | "人才培养" | "顾问咨询" | "联合活动";
  title: string;
  description: string;
  academy: "科学院" | "工程院" | "两院";
}

export default function ScholarDetailPageDemo() {
  const { scholarId } = useParams();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"year" | "citation">("year");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Record<string, unknown>>({});
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [scholarId]);

  const scholar = scholars.find((s) => s.id === scholarId);
  const scholarPapers = scholar
    ? papers.filter((p) => p.scholarId === scholar.id)
    : [];

  const filteredPapers = useMemo(() => {
    let filtered = [...scholarPapers];
    if (selectedYear !== null)
      filtered = filtered.filter((p) => p.year === selectedYear);
    if (sortBy === "year") filtered.sort((a, b) => b.year - a.year);
    else filtered.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
    return filtered;
  }, [scholarPapers, selectedYear, sortBy]);

  const paperYears = useMemo(() => {
    const years = new Set(scholarPapers.map((p) => p.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [scholarPapers]);

  if (!scholar) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500">未找到该学者</p>
        <Link
          to="/"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 返回列表
        </Link>
      </div>
    );
  }

  if (isLoading) return <PageSkeleton />;

  const uni = universities.find((u) => u.id === scholar.universityId);
  const dept = uni?.departments.find((d) => d.id === scholar.departmentId);
  const education = getEducationByScholarId(scholar.id);
  const experience = getExperienceByScholarId(scholar.id);
  const awards = getAwardsByScholarId(scholar.id);
  const agreementRecords = getAgreementsByScholarId(scholar.id);
  const interactionRecords = getInteractionsByScholarId(scholar.id);

  const statsData = {
    papers: scholar.paperCount || 0,
    citations: scholar.citationCount || 0,
    hIndex: scholar.hIndex || 0,
    gIndex: Math.floor((scholar.hIndex || 0) * 1.3),
    sociability: 7,
    diversity: 2,
    activity: 101,
  };

  const mockAdvisedStudents: {
    id: string;
    name: string;
    degree: "博士" | "硕士" | "博士后";
    startYear: number;
    endYear?: number;
    currentPosition?: string;
  }[] = [
    { id: "1", name: "陈浩然", degree: "博士", startYear: 2021, currentPosition: "清华大学博士在读" },
    { id: "2", name: "刘雨欣", degree: "博士", startYear: 2020, endYear: 2024, currentPosition: "腾讯 AI Lab 研究员" },
    { id: "3", name: "王博文", degree: "硕士", startYear: 2022, endYear: 2024, currentPosition: "字节跳动算法工程师" },
    { id: "4", name: "赵梦琪", degree: "博士后", startYear: 2023, currentPosition: "在站博士后" },
    { id: "5", name: "孙志远", degree: "硕士", startYear: 2021, endYear: 2023, currentPosition: "百度研究院" },
  ];

  const mockAcademyRelations = [
    { label: "兼职导师", desc: "人力资源部", active: true },
    { label: "顾问委员", desc: "综合办公室", active: true },
    { label: "科研立项", desc: "科研部 · 2项", active: true },
    { label: "联合培养", desc: "培养部 · 3名学生", active: false },
  ];

  const mockAcademyRecords: AcademyRecord[] = [
    {
      date: "2025-11-12",
      type: "学术交流",
      title: "XAI 讲坛第 18 期主讲嘉宾",
      description: "受邀在 XAI 讲坛作《大语言模型的可解释性研究》报告，参与人员 120 余人。",
      academy: "科学院",
    },
    {
      date: "2025-08-05",
      type: "科研合作",
      title: "联合申报国家重点研发计划",
      description: "与科研部联合申报《智能知识服务关键技术》重点研发计划项目，已立项。",
      academy: "两院",
    },
    {
      date: "2025-05-20",
      type: "人才培养",
      title: "指导联合培养博士生",
      description: "受聘为联合培养博士生导师，目前联合培养学生 2 名。",
      academy: "科学院",
    },
    {
      date: "2024-12-10",
      type: "顾问咨询",
      title: "参加学术委员会年度会议",
      description: "受邀出席年度学术委员会会议，就 AI 前沿方向发展提供咨询意见。",
      academy: "工程院",
    },
    {
      date: "2024-09-18",
      type: "联合活动",
      title: "中青年学者联合研讨会",
      description: "参加两院联合举办的中青年学者研讨会，作大会报告并担任圆桌嘉宾。",
      academy: "两院",
    },
  ];

  const recordTypeColor: Record<AcademyRecord["type"], string> = {
    学术交流: "bg-blue-100 text-blue-700",
    科研合作: "bg-violet-100 text-violet-700",
    人才培养: "bg-emerald-100 text-emerald-700",
    顾问咨询: "bg-amber-100 text-amber-700",
    联合活动: "bg-rose-100 text-rose-700",
  };

  const academyBadgeColor: Record<AcademyRecord["academy"], string> = {
    科学院: "bg-blue-50 text-blue-600 border-blue-200",
    工程院: "bg-orange-50 text-orange-600 border-orange-200",
    两院: "bg-purple-50 text-purple-600 border-purple-200",
  };

  const medalColors: Record<string, string> = {
    gold: "text-amber-500 bg-amber-50 border-amber-200",
    silver: "text-gray-400 bg-gray-100 border-gray-300",
    bronze: "text-orange-600 bg-orange-50 border-orange-200",
  };

  const agreementStatusColor: Record<string, string> = {
    已签署: 'bg-emerald-100 text-emerald-700',
    流程中: 'bg-amber-100 text-amber-700',
  };

  const interactionTypeIcon: Record<string, React.ReactNode> = {
    讲座: <BookOpen className="w-4 h-4" />,
    学术访问: <GraduationCap className="w-4 h-4" />,
    合作研究: <Handshake className="w-4 h-4" />,
    研讨会: <User className="w-4 h-4" />,
    座谈: <ClipboardList className="w-4 h-4" />,
    其他: <FileText className="w-4 h-4" />,
  };

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
              <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {scholar.email && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${scholar.email}`} className="text-sm text-primary-600 hover:underline">{scholar.email}</a>
                </div>
              )}
              {scholar.phone && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{scholar.phone}</span>
                </div>
              )}
              {scholar.homepage && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a href={scholar.homepage} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                    个人主页 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {!scholar.email && !scholar.phone && !scholar.homepage && (
                <p className="text-sm text-gray-400 text-center py-4">暂无联系方式</p>
              )}
            </div>
          </motion.div>
        </motion.div>
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
          {/* ══ Left Sidebar: Unified White Card ══ */}
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
              {/* ─ Profile Header ─ */}
              <div className="p-5">
                {/* Avatar + Name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    {scholar.profileImageUrl ? (
                      <img
                        src={scholar.profileImageUrl}
                        alt={scholar.name}
                        className="w-[72px] h-[72px] rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-2xl font-bold bg-primary-600 text-white">
                        {getInitial(scholar.name)}
                      </div>
                    )}
                    {(scholar.verified || scholar.claimed) && (
                      <div className="absolute -bottom-1 -right-1">
                        <VerificationBadge
                          verified={scholar.verified}
                          claimed={scholar.claimed}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                  <div className={cn("flex-1 min-w-0 space-y-1", isEditing && "ring-2 ring-primary-200 rounded-lg p-2")}>
                    {isEditing ? (
                      <>
                        <input
                          value={String(editDraft.name ?? scholar.name)}
                          onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                          className="w-full text-base font-bold text-gray-900 border-b border-primary-300 focus:outline-none bg-transparent"
                          placeholder="姓名"
                        />
                        <input
                          value={String(editDraft.nameEn ?? scholar.nameEn ?? '')}
                          onChange={(e) => setEditDraft((d) => ({ ...d, nameEn: e.target.value }))}
                          className="w-full text-xs text-gray-500 border-b border-gray-200 focus:outline-none bg-transparent"
                          placeholder="English Name"
                        />
                        <select
                          value={String(editDraft.title ?? scholar.title)}
                          onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                          className="w-full text-xs text-gray-600 border border-gray-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
                        >
                          {["教授","副教授","助理教授","讲师","研究员","副研究员","助理研究员","博士后"].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <h2 className="text-lg font-bold text-gray-900 leading-snug">{scholar.name}</h2>
                        {scholar.nameEn && <div className="text-sm text-gray-500 mt-0.5">{scholar.nameEn}</div>}
                        <div className="text-sm text-gray-600 mt-1">{scholar.title}</div>
                        {dept && <div className="text-xs text-gray-400 mt-0.5">{dept.name}</div>}
                      </>
                    )}
                  </div>
                </div>

                {/* Institution */}
                {uni && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{uni.name}</span>
                  </div>
                )}

                {/* Honors */}
                {scholar.honors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {scholar.honors.slice(0, 3).map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-200"
                      >
                        <Award className="w-3 h-3" />
                        {h.length > 12 ? h.slice(0, 12) + "…" : h}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  {isEditing ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={tapScale}
                        onClick={() => {
                          console.log('保存', editDraft);
                          setIsEditing(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        保存
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={tapScale}
                        onClick={() => { setEditDraft({}); setIsEditing(false); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        <X className="w-3.5 h-3.5" />
                        取消
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={tapScale}
                        onClick={() => { setIsEditing(true); setEditDraft({ ...scholar }); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-primary-300 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        编辑
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={tapScale}
                        onClick={() => setShowContactModal(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        联系
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>浏览 {scholar.profileViews || 9466}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>职业已认证</span>
                  </div>
                </div>
              </div>

              {/* ─ Contact ─ */}
              {(scholar.email || scholar.homepage || scholar.phone || isEditing) && (
                <div className={cn("px-5 py-4 border-t border-gray-100", isEditing && "ring-2 ring-primary-200 rounded-b-xl mx-2 mb-2")}>
                  <SideLabel icon={Mail} title="联系方式" />
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                          value={String(editDraft.email ?? scholar.email ?? '')}
                          onChange={(e) => setEditDraft((d) => ({ ...d, email: e.target.value }))}
                          placeholder="邮箱"
                          className="flex-1 text-sm border-b border-gray-200 focus:outline-none focus:border-primary-400 bg-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                          value={String(editDraft.phone ?? scholar.phone ?? '')}
                          onChange={(e) => setEditDraft((d) => ({ ...d, phone: e.target.value }))}
                          placeholder="电话"
                          className="flex-1 text-sm border-b border-gray-200 focus:outline-none focus:border-primary-400 bg-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                          value={String(editDraft.homepage ?? scholar.homepage ?? '')}
                          onChange={(e) => setEditDraft((d) => ({ ...d, homepage: e.target.value }))}
                          placeholder="个人主页 URL"
                          className="flex-1 text-sm border-b border-gray-200 focus:outline-none focus:border-primary-400 bg-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {scholar.email && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <a href={`mailto:${scholar.email}`} className="hover:text-primary-600 truncate transition-colors">
                            {scholar.email}
                          </a>
                        </div>
                      )}
                      {scholar.phone && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{scholar.phone}</span>
                        </div>
                      )}
                      {scholar.homepage && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <a href={scholar.homepage} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 flex items-center gap-1 transition-colors">
                            个人主页
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ─ Bio ─ */}
              {(scholar.bio || isEditing) && (
                <div className={cn("px-5 py-4 border-t border-gray-100", isEditing && "ring-2 ring-primary-200 rounded-lg mx-2 my-1")}>
                  <SideLabel icon={User} title="个人简介" />
                  {isEditing ? (
                    <textarea
                      value={String(editDraft.bio ?? scholar.bio ?? '')}
                      onChange={(e) => setEditDraft((d) => ({ ...d, bio: e.target.value }))}
                      rows={4}
                      className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                      placeholder="个人简介..."
                    />
                  ) : (
                    <p className="text-sm text-gray-600 leading-relaxed">{scholar.bio}</p>
                  )}
                </div>
              )}

              {/* ─ Education ─ */}
              {education && education.length > 0 && (
                <div className={cn("px-5 py-4 border-t border-gray-100", isEditing && "ring-2 ring-primary-200 rounded-lg mx-2 my-1")}>
                  <SideLabel icon={GraduationCap} title="教育经历" />
                  <div className="space-y-4">
                    {education.map((edu, i) => (
                      <div key={i} className="relative pl-5">
                        <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-white shadow-sm" />
                        {i < education.length - 1 && (
                          <div className="absolute left-[4px] top-4 w-0.5 h-full bg-gray-200" />
                        )}
                        <div className="space-y-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-800">{edu.degree}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {edu.endYear ? `${edu.year}–${edu.endYear}` : edu.year}
                              </span>
                              {isEditing && (
                                <button className="text-gray-300 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">{edu.institution}</div>
                          {edu.major && (
                            <div className="text-xs text-gray-400">{edu.major}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <button className="mt-3 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors">
                      <Plus className="w-3 h-3" />
                      添加教育经历
                    </button>
                  )}
                </div>
              )}

              {/* ─ Experience ─ */}
              {experience && experience.length > 0 && (
                <div className={cn("px-5 py-4 border-t border-gray-100", isEditing && "ring-2 ring-primary-200 rounded-lg mx-2 my-1")}>
                  <SideLabel icon={Briefcase} title="工作经历" />
                  <div className="space-y-4">
                    {experience.map((exp, i) => (
                      <div key={i} className="relative pl-5">
                        <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                        {i < experience.length - 1 && (
                          <div className="absolute left-[4px] top-4 w-0.5 h-full bg-gray-200" />
                        )}
                        <div className="space-y-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-800">{exp.position}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {exp.endYear ? `${exp.startYear}–${exp.endYear}` : `${exp.startYear}–至今`}
                              </span>
                              {isEditing && (
                                <button className="text-gray-300 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">{exp.institution}</div>
                          {exp.description && (
                            <div className="text-xs text-gray-400 leading-relaxed">{exp.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <button className="mt-3 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors">
                      <Plus className="w-3 h-3" />
                      添加工作经历
                    </button>
                  )}
                </div>
              )}

              {/* ─ Awards ─ */}
              {awards && awards.length > 0 && (
                <div className={cn("px-5 py-4 border-t border-gray-100", isEditing && "ring-2 ring-primary-200 rounded-lg mx-2 my-1")}>
                  <SideLabel icon={Award} title="所获奖项" />
                  <div className="space-y-3">
                    {[...awards].sort((a, b) => b.year - a.year).map((award, i) => (
                      <div key={i} className="flex gap-3">
                        <div
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border",
                            medalColors[award.category] ?? "text-gray-400 bg-gray-50 border-gray-200",
                          )}
                        >
                          <Medal className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium text-gray-800 leading-snug">
                              {award.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                {award.year}
                              </span>
                              {isEditing && (
                                <button className="text-gray-300 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          {award.issuer && (
                            <div className="text-xs text-gray-400 mt-0.5">{award.issuer}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <button className="mt-3 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors">
                      <Plus className="w-3 h-3" />
                      添加奖项
                    </button>
                  )}
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

              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  关系概况
                </p>
                <div className="flex flex-wrap gap-2">
                  {mockAcademyRelations.map((rel) => (
                    <div
                      key={rel.label}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm",
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
                      <span className={cn("text-xs", rel.active ? "text-primary-500" : "text-gray-400")}>
                        {rel.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  交往记录
                </p>
                <div className="space-y-3">
                  {mockAcademyRecords.map((record, index) => (
                    <motion.div
                      key={index}
                      variants={listItem}
                      className="flex gap-3 p-3.5 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex-shrink-0 flex flex-col items-center gap-1 w-14 text-center">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] text-gray-400 leading-tight">
                          {record.date.replace(/-/g, "/")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              recordTypeColor[record.type],
                            )}
                          >
                            {record.type}
                          </span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full border",
                              academyBadgeColor[record.academy],
                            )}
                          >
                            {record.academy}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {record.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {record.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
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
              </div>
              <motion.div
                className="space-y-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {[
                  { label: "重大项目立项", content: null },
                  {
                    label: "人才称号",
                    content: (
                      <div className="flex flex-wrap gap-2">
                        {scholar.honors.map((honor) => (
                          <span
                            key={honor}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                          >
                            <Award className="w-3 h-3" />
                            {honor}
                          </span>
                        ))}
                      </div>
                    ),
                  },
                  { label: "任职履新", content: null },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    variants={listItem}
                    className="p-4 border border-gray-200 hover:border-primary-300 rounded-lg transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{item.label}</span>
                      <span className="text-xs text-gray-400">网络数据</span>
                    </div>
                    {item.content ?? (
                      <p className="text-xs text-gray-500">暂无数据</p>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* ─ 协议记录 ─ */}
            <motion.div
              variants={slideInUp}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="text-base font-semibold text-gray-900">协议记录</h3>
                <span className="ml-auto text-xs text-gray-400">{agreementRecords.length} 条</span>
              </div>
              {agreementRecords.length > 0 ? (
                <div className="space-y-3">
                  {agreementRecords.map((agr) => (
                    <div key={agr.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium text-gray-800">{agr.agreementType}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", agreementStatusColor[agr.status])}>
                            {agr.status}
                          </span>
                        </div>
                        {agr.signedAt && (
                          <div className="text-xs text-gray-400">签署日期：{agr.signedAt}</div>
                        )}
                        {agr.parties && agr.parties.length > 0 && (
                          <div className="text-xs text-gray-400">第三方：{agr.parties.join('、')}</div>
                        )}
                        {agr.notes && (
                          <div className="text-xs text-gray-500 mt-1 leading-relaxed">{agr.notes}</div>
                        )}
                      </div>
                      {isEditing && (
                        <button className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">暂无协议记录</p>
              )}
              {isEditing && (
                <button className="mt-3 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors">
                  <Plus className="w-3 h-3" />
                  添加协议记录
                </button>
              )}
            </motion.div>

            {/* ─ 交往记录 ─ */}
            <motion.div
              variants={slideInUp}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Handshake className="w-5 h-5 text-primary-600" />
                <h3 className="text-base font-semibold text-gray-900">交往记录</h3>
                <span className="ml-auto text-xs text-gray-400">{interactionRecords.length} 条</span>
              </div>
              {interactionRecords.length > 0 ? (
                <div className="space-y-3">
                  {[...interactionRecords].sort((a, b) => b.date.localeCompare(a.date)).map((record) => (
                    <div key={record.id} className="flex gap-3 p-3.5 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/20 transition-all cursor-pointer">
                      <div className="flex-shrink-0 flex flex-col items-center gap-1 w-14 text-center">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                          {interactionTypeIcon[record.type] ?? <FileText className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] text-gray-400 leading-tight">{record.date.replace(/-/g, '/')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary-50 text-primary-600">
                            {record.type}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate">{record.title}</span>
                        </div>
                        {record.venue && (
                          <div className="text-xs text-gray-400 mb-1">{record.venue}</div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {record.participants.map((p, pi) => {
                            if (p.type === 'scholar') {
                              const s = scholars.find((sc) => sc.id === p.scholarId);
                              return s ? (
                                <span key={pi} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">
                                  🎓 {s.name}{p.role ? `（${p.role}）` : ''}
                                </span>
                              ) : null;
                            } else {
                              const c = getExternalContactById(p.contactId ?? '');
                              return c ? (
                                <span key={pi} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">
                                  🏢 {c.name}（{c.organization}）{p.role ? `（${p.role}）` : ''}
                                </span>
                              ) : null;
                            }
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">暂无交往记录</p>
              )}
            </motion.div>

            {/* ─ 论文 ─ */}
            <motion.div
              variants={slideInUp}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  论文{" "}
                  <span className="text-primary-600">共 {scholarPapers.length} 篇</span>
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                <PaperFilterPanel sortBy={sortBy} onSortChange={setSortBy} />
                <YearFilterBar
                  years={paperYears}
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                />
              </div>

              <motion.div
                className="space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {filteredPapers.length > 0 ? (
                  filteredPapers.map((paper) => (
                    <motion.div key={paper.id} variants={listItem}>
                      <PaperCard paper={paper} />
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-12">暂无论文数据</p>
                )}
              </motion.div>
            </motion.div>
          </motion.main>

          {/* ══ Right Sidebar ══ */}
          <motion.div variants={slideInRight} initial="hidden" animate="visible">
            <StatsSidebar stats={statsData} advisedStudents={mockAdvisedStudents} />
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}
