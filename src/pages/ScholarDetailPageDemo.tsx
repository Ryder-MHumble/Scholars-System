import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Globe,
  ExternalLink,
  Award,
  Building2,
  Eye,
  Shield,
} from "lucide-react";
import { scholars } from "@/data/scholars";
import { universities } from "@/data/universities";
import { papers } from "@/data/papers";
import { getEducationByScholarId } from "@/data/educationHistory";
import { getExperienceByScholarId } from "@/data/workExperience";
import { getAwardsByScholarId } from "@/data/detailedAwards";
import { VerificationBadge } from "@/components/scholar-detail/shared/VerificationBadge";
import { BioSection } from "@/components/scholar-detail/sidebar/BioSection";
import { EducationSection } from "@/components/scholar-detail/sidebar/EducationSection";
import { ExperienceSection } from "@/components/scholar-detail/sidebar/ExperienceSection";
import { AwardsSection } from "@/components/scholar-detail/sidebar/AwardsSection";
import { PaperCard } from "@/components/scholar-detail/papers/PaperCard";
import { YearFilterBar } from "@/components/scholar-detail/papers/YearFilterBar";
import { PaperFilterPanel } from "@/components/scholar-detail/papers/PaperFilterPanel";
import { StatsSidebar } from "@/components/scholar-detail/stats/StatsSidebar";
import { PageSkeleton } from "@/components/scholar-detail/shared/SkeletonLoader";
import { getInitial } from "@/utils/avatar";
import {
  slideInLeft,
  slideInUp,
  slideInRight,
  staggerContainer,
  listItem,
  tapScale,
} from "@/utils/animations";

export default function ScholarDetailPageDemo() {
  const { scholarId } = useParams();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"year" | "citation">("year");
  const [isLoading, setIsLoading] = useState(true);

  // 模拟数据加载
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [scholarId]);

  const scholar = scholars.find((s) => s.id === scholarId);
  const scholarPapers = scholar
    ? papers.filter((p) => p.scholarId === scholar.id)
    : [];

  // Paper filtering and sorting
  const filteredPapers = useMemo(() => {
    let filtered = [...scholarPapers];

    if (selectedYear !== null) {
      filtered = filtered.filter((p) => p.year === selectedYear);
    }

    if (sortBy === "year") {
      filtered.sort((a, b) => b.year - a.year);
    } else {
      filtered.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
    }

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

  if (isLoading) {
    return <PageSkeleton />;
  }

  const uni = universities.find((u) => u.id === scholar.universityId);

  // Get enhanced data
  const education = getEducationByScholarId(scholar.id);
  const experience = getExperienceByScholarId(scholar.id);
  const awards = getAwardsByScholarId(scholar.id);

  // Mock stats data
  const statsData = {
    papers: scholar.paperCount || 0,
    citations: scholar.citationCount || 0,
    hIndex: scholar.hIndex || 0,
    gIndex: Math.floor((scholar.hIndex || 0) * 1.3),
    sociability: 7,
    diversity: 2,
    activity: 101,
  };

  // Mock collaborators data
  const mockCollaborators = [
    {
      id: "1",
      name: "张祥雨",
      nameEn: "Xiangyu Zhang",
      institution: "Megvii Technology Limited",
      paperCount: 66,
    },
    {
      id: "2",
      name: "何恺明",
      nameEn: "Kaiming He",
      institution: "Department of Electrical Engineering",
      paperCount: 39,
    },
    {
      id: "3",
      name: "Harry Shum",
      institution: "Jockey Club Institute for Advanced",
      paperCount: 36,
    },
    {
      id: "4",
      name: "黎泽明",
      institution: "ByteDance",
      paperCount: 32,
    },
    {
      id: "5",
      name: "汤晓鸥",
      nameEn: "Xiaoou Tang",
      institution: "SenseTime;Department of Information",
      paperCount: 27,
    },
    {
      id: "6",
      name: "危夷晨",
      institution: "SHUKUN Technology",
      paperCount: 26,
    },
  ];

  return (
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
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
            返回列表
          </Link>
        </motion.div>

        {/* Three Column Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar - Scholar Profile Card */}
          <motion.aside
            className="w-80 shrink-0 space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Profile Card */}
            <motion.div
              variants={slideInLeft}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-violet-600 via-blue-600 to-blue-500 rounded-xl shadow-lg hover:shadow-xl overflow-hidden transition-shadow duration-300"
            >
              <div className="p-6 text-white">
                {/* Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    {scholar.profileImageUrl ? (
                      <img
                        src={scholar.profileImageUrl}
                        alt={scholar.name}
                        className="w-20 h-20 rounded-xl object-cover border-2 border-white/50"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold bg-white/20 border-2 border-white/50">
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
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold mb-1">
                      {scholar.name}
                      {scholar.nameEn && (
                        <div className="text-sm font-normal text-white/80 mt-1">
                          {scholar.nameEn}
                        </div>
                      )}
                    </h2>
                    <div className="text-sm text-white/90">{scholar.title}</div>
                  </div>
                </div>

                {/* Institution */}
                <div className="text-sm text-white/90 mb-4">{uni?.name}</div>

                {/* Honors */}
                {scholar.honors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {scholar.honors.slice(0, 2).map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"
                      >
                        <Award className="w-3 h-3" />
                        {h.length > 12 ? h.slice(0, 12) + "..." : h}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={tapScale}
                    className="flex-1 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg text-sm font-medium border border-white/30 transition-all duration-200"
                  >
                    关注
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={tapScale}
                    className="flex-1 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
                  >
                    交流
                  </motion.button>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-white/80 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>浏览量: {scholar.profileViews || 9466}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>职业证明</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bio and Other Sections */}
            <motion.div variants={listItem}>
              <BioSection bio={scholar.bio} />
            </motion.div>
            <motion.div variants={listItem}>
              <EducationSection education={education} />
            </motion.div>
            <motion.div variants={listItem}>
              <ExperienceSection experience={experience} />
            </motion.div>
            <motion.div variants={listItem}>
              <AwardsSection awards={awards} />
            </motion.div>
          </motion.aside>

          {/* Center Content */}
          <motion.main
            className="flex-1 min-w-0 space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Contact Information */}
            <motion.div
              variants={slideInUp}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md p-6 transition-shadow duration-300"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                联系方式
              </h3>
              <div className="space-y-3">
                {scholar.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">邮箱:</span>
                    <a
                      href={`mailto:${scholar.email}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {scholar.email}
                    </a>
                  </div>
                )}
                {scholar.homepage && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">个人主页:</span>
                    <a
                      href={scholar.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      {scholar.homepage}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {uni && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">所属机构:</span>
                    <span className="text-gray-900">{uni.name}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Relationship with Two Academies */}
            <motion.div
              variants={slideInUp}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md p-6 transition-shadow duration-300"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                与两院关系
              </h3>
              <motion.div
                className="grid grid-cols-2 gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {[
                  { title: "顾问委员", desc: "综办、培养部、科研部数据" },
                  { title: "兼职导师", desc: "人力部数据" },
                  { title: "指导学生", desc: "培养部数据" },
                  { title: "科研立项", desc: "科研部数据" },
                  { title: "联合管理", desc: "学工部数据" },
                  {
                    title: "学术交流",
                    desc: "活动数据: XAI讲坛、联合研讨会等",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={listItem}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer"
                  >
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </motion.div>
                ))}
                <motion.div
                  variants={listItem}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg col-span-2 transition-colors duration-200 cursor-pointer"
                >
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    潜在引进对象
                  </div>
                  <div className="text-xs text-gray-500">
                    活动数据: 学术顶会、青年论坛等
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Dynamic Updates */}
            <motion.div
              variants={slideInUp}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md p-6 transition-shadow duration-300"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                动态更新
              </h3>
              <motion.div
                className="space-y-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  variants={listItem}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="p-4 border border-gray-200 hover:border-primary-300 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      重大项目立项
                    </span>
                    <span className="text-xs text-gray-500">网络数据</span>
                  </div>
                  <p className="text-xs text-gray-600">暂无数据</p>
                </motion.div>
                <motion.div
                  variants={listItem}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="p-4 border border-gray-200 hover:border-primary-300 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      人才称号
                    </span>
                    <span className="text-xs text-gray-500">网络数据</span>
                  </div>
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
                </motion.div>
                <motion.div
                  variants={listItem}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="p-4 border border-gray-200 hover:border-primary-300 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      任职履新
                    </span>
                    <span className="text-xs text-gray-500">网络数据</span>
                  </div>
                  <p className="text-xs text-gray-600">暂无数据</p>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Papers Section */}
            <motion.div
              variants={slideInUp}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md p-6 transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  论文{" "}
                  <span className="text-primary-600">
                    共 {scholarPapers.length} 篇
                  </span>
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
                  <p className="text-center text-gray-500 py-12">
                    暂无论文数据
                  </p>
                )}
              </motion.div>
            </motion.div>
          </motion.main>

          {/* Right Sidebar - Stats */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            animate="visible"
          >
            <StatsSidebar stats={statsData} collaborators={mockCollaborators} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
