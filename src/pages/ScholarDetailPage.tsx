import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Globe,
  ChevronRight,
  Award,
  BookOpen,
  Users2,
  Handshake,
  History,
  FileText,
  FlaskConical,
  GraduationCap,
  ExternalLink,
  Edit3,
  Save,
  X,
  Plus,
  BarChart3,
  Building2,
  Link2,
  CheckCircle2,
} from "lucide-react";
import PageTransition from "@/layouts/PageTransition";
import { scholars } from "@/data/scholars";
import { universities } from "@/data/universities";
import { papers } from "@/data/papers";
import { projects } from "@/data/projects";
import { relationships } from "@/data/relationships";
import { changelog } from "@/data/changelog";
import { cn } from "@/utils/cn";
import { getAvatarColor, getInitial } from "@/utils/avatar";
import {
  formatNumber,
  formatRelativeTime,
  formatYearRange,
} from "@/utils/format";
import type { AcademicHonor, AcademicTitle, Scholar } from "@/types";

/* ─────────────────────────── constants ──────────────────────────── */

const tabs = [
  { id: "basic", label: "基本信息", icon: BookOpen },
  { id: "academic", label: "学术成果", icon: FileText },
  { id: "relations", label: "学术关系", icon: Users2 },
  { id: "exchange", label: "学术交流", icon: Handshake },
  { id: "history", label: "变更历史", icon: History },
] as const;

type TabId = (typeof tabs)[number]["id"];

const ACADEMIC_TITLES: AcademicTitle[] = [
  "教授",
  "副教授",
  "助理教授",
  "讲师",
  "研究员",
  "副研究员",
  "助理研究员",
  "博士后",
];

/* ─────────────────────────── helpers ────────────────────────────── */

function getHonorStyle(honor: AcademicHonor) {
  if (honor.includes("院士"))
    return "bg-red-50 text-red-700 border-red-200";
  if (honor.includes("杰出"))
    return "bg-orange-50 text-orange-700 border-orange-200";
  if (honor.includes("优秀"))
    return "bg-lime-50 text-lime-700 border-lime-200";
  if (honor.includes("长江"))
    return "bg-violet-50 text-violet-700 border-violet-200";
  if (honor.includes("Fellow"))
    return "bg-cyan-50 text-cyan-700 border-cyan-200";
  if (honor.includes("万人"))
    return "bg-pink-50 text-pink-700 border-pink-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

/* ─────────────────────── edit data type ─────────────────────────── */

interface EditData {
  name: string;
  nameEn: string;
  title: AcademicTitle;
  email: string;
  homepage: string;
  googleScholar: string;
  dblp: string;
  researchFields: string[];
  bio: string;
  hIndex: number | undefined;
  citationCount: number | undefined;
  paperCount: number | undefined;
}

function initData(s: Scholar | undefined): EditData {
  return {
    name: s?.name ?? "",
    nameEn: s?.nameEn ?? "",
    title: s?.title ?? "教授",
    email: s?.email ?? "",
    homepage: s?.homepage ?? "",
    googleScholar: s?.googleScholar ?? "",
    dblp: s?.dblp ?? "",
    researchFields: [...(s?.researchFields ?? [])],
    bio: s?.bio ?? "",
    hIndex: s?.hIndex,
    citationCount: s?.citationCount,
    paperCount: s?.paperCount,
  };
}

/* ──────────────────── relationship graph ────────────────────────── */

function RelationshipGraph({
  scholarId,
  scholarName,
}: {
  scholarId: string;
  scholarName: string;
}) {
  const rels = relationships.filter(
    (r) => r.fromScholarId === scholarId || r.toScholarId === scholarId,
  );

  const nodes = useMemo(() => {
    const nodeMap = new Map<
      string,
      { id: string; name: string; type: string }
    >();
    nodeMap.set(scholarId, { id: scholarId, name: scholarName, type: "center" });
    for (const r of rels) {
      const otherId =
        r.fromScholarId === scholarId ? r.toScholarId : r.fromScholarId;
      const other = scholars.find((s) => s.id === otherId);
      if (other && !nodeMap.has(otherId)) {
        const relType =
          r.fromScholarId === scholarId
            ? r.type === "导师"
              ? "学生"
              : r.type === "学生"
                ? "导师"
                : r.type
            : r.type;
        nodeMap.set(otherId, { id: otherId, name: other.name, type: relType });
      }
    }
    return Array.from(nodeMap.values());
  }, [scholarId, scholarName, rels]);

  if (nodes.length <= 1) {
    return (
      <div className="text-sm text-gray-400 text-center py-10">
        暂无学术关系数据
      </div>
    );
  }

  const cx = 200,
    cy = 150,
    r = 110;

  const typeColor = (type: string) =>
    type === "导师"
      ? "#ef4444"
      : type === "学生"
        ? "#3b82f6"
        : type === "合作者"
          ? "#10b981"
          : "#9ca3af";

  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-lg mx-auto">
      {nodes.slice(1).map((node, i) => {
        const angle = (i / (nodes.length - 1)) * 2 * Math.PI - Math.PI / 2;
        const nx = cx + r * Math.cos(angle);
        const ny = cy + r * Math.sin(angle);
        return (
          <line
            key={node.id}
            x1={cx} y1={cy} x2={nx} y2={ny}
            stroke={typeColor(node.type)}
            strokeWidth={1.5}
            strokeDasharray={node.type === "同事" ? "4 4" : "none"}
            opacity={0.4}
          />
        );
      })}
      {nodes.slice(1).map((node, i) => {
        const angle = (i / (nodes.length - 1)) * 2 * Math.PI - Math.PI / 2;
        const nx = cx + r * Math.cos(angle);
        const ny = cy + r * Math.sin(angle);
        return (
          <g key={node.id}>
            <Link to={`/scholars/${node.id}`}>
              <circle
                cx={nx} cy={ny} r={22}
                fill={getAvatarColor(node.name)}
                opacity={0.9}
                className="cursor-pointer hover:opacity-100 transition-opacity"
              />
              <text x={nx} y={ny + 1} textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize="11" fontWeight="500">
                {getInitial(node.name)}
              </text>
              <text x={nx} y={ny + 36} textAnchor="middle" fill="#6b7280" fontSize="10">
                {node.name}
              </text>
              <text x={nx} y={ny + 48} textAnchor="middle" fill="#9ca3af" fontSize="9">
                {node.type}
              </text>
            </Link>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={30} fill={getAvatarColor(scholarName)} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="14" fontWeight="600">
        {getInitial(scholarName)}
      </text>
      <text x={cx} y={cy + 44} textAnchor="middle" fill="#374151" fontSize="11" fontWeight="500">
        {scholarName}
      </text>
    </svg>
  );
}

/* ──────────────────────── main component ────────────────────────── */

export default function ScholarDetailPage() {
  const { scholarId } = useParams();
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [editing, setEditing] = useState(false);
  const [fieldInput, setFieldInput] = useState("");
  const [saveFlash, setSaveFlash] = useState(false);

  const scholar = scholars.find((s) => s.id === scholarId);
  const [savedData, setSavedData] = useState<EditData>(() => initData(scholar));
  const [editData, setEditData] = useState<EditData>(() => initData(scholar));

  if (!scholar) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-gray-500">未找到该学者</p>
          <Link to="/scholars" className="text-sm text-primary-600 hover:text-primary-700">
            ← 返回学者目录
          </Link>
        </div>
      </PageTransition>
    );
  }

  const uni = universities.find((u) => u.id === scholar.universityId);
  const dept = uni?.departments.find((d) => d.id === scholar.departmentId);
  const scholarPapers = papers.filter((p) => p.scholarId === scholar.id);
  const scholarProjects = projects.filter((p) => p.scholarId === scholar.id);
  const scholarChangelog = changelog.filter((c) => c.scholarId === scholar.id);

  const scholarRels = relationships.filter(
    (r) => r.fromScholarId === scholar.id || r.toScholarId === scholar.id,
  );
  const advisors = scholarRels
    .filter((r) => r.toScholarId === scholar.id && r.type === "导师")
    .map((r) => ({ ...r, scholar: scholars.find((s) => s.id === r.fromScholarId) }));
  const students = scholarRels
    .filter((r) => r.fromScholarId === scholar.id && r.type === "导师")
    .map((r) => ({ ...r, scholar: scholars.find((s) => s.id === r.toScholarId) }));
  const collaborators = scholarRels
    .filter((r) => r.type === "合作者")
    .map((r) => {
      const otherId = r.fromScholarId === scholar.id ? r.toScholarId : r.fromScholarId;
      return { ...r, scholar: scholars.find((s) => s.id === otherId) };
    });

  /* ── edit handlers ── */
  const handleStartEdit = () => {
    setEditData({ ...savedData, researchFields: [...savedData.researchFields] });
    setFieldInput("");
    setEditing(true);
  };

  const handleSave = () => {
    setSavedData({ ...editData, researchFields: [...editData.researchFields] });
    setEditing(false);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2500);
  };

  const handleCancel = () => {
    setEditData({ ...savedData, researchFields: [...savedData.researchFields] });
    setFieldInput("");
    setEditing(false);
  };

  const addField = () => {
    const v = fieldInput.trim();
    if (v && !editData.researchFields.includes(v)) {
      setEditData((d) => ({ ...d, researchFields: [...d.researchFields, v] }));
      setFieldInput("");
    }
  };

  const removeField = (i: number) => {
    setEditData((d) => ({
      ...d,
      researchFields: d.researchFields.filter((_, j) => j !== i),
    }));
  };

  const D = editing ? editData : savedData; // display data shorthand
  const avatarColor = getAvatarColor(savedData.name || scholar.name);

  const inputCls =
    "border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 bg-white transition-colors";

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-4">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center text-sm text-gray-500 gap-1">
          <Link to="/" className="hover:text-primary-600 transition-colors">首页</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/scholars" className="hover:text-primary-600 transition-colors">学者目录</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium">{savedData.name}</span>
        </div>

        {/* ── Save flash notification ── */}
        <AnimatePresence>
          {saveFlash && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              学者信息已更新保存
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Profile Header Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-200",
            editing ? "border-primary-300 ring-2 ring-primary-100" : "border-gray-100",
          )}
        >
          {/* Edit mode banner */}
          {editing && (
            <div className="px-6 py-2.5 bg-primary-50 border-b border-primary-100 flex items-center gap-2 text-xs text-primary-700 font-medium">
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              编辑模式 — 修改完成后点击「保存修改」
            </div>
          )}

          <div className="p-6">
            <div className="flex gap-5 items-start">

              {/* Avatar */}
              <div
                className="w-[88px] h-[88px] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-sm"
                style={{ backgroundColor: avatarColor }}
              >
                {getInitial(savedData.name || scholar.name)}
              </div>

              {/* Info area */}
              <div className="flex-1 min-w-0">
                {/* Row: name + action button */}
                <div className="flex items-start justify-between gap-4">

                  {/* Name + title */}
                  {editing ? (
                    <div className="flex flex-wrap gap-3 items-end flex-1">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs text-gray-400">姓名</label>
                        <input
                          value={editData.name}
                          onChange={(e) =>
                            setEditData((d) => ({ ...d, name: e.target.value }))
                          }
                          className={cn(inputCls, "w-28 font-bold text-base")}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs text-gray-400">英文名</label>
                        <input
                          value={editData.nameEn}
                          onChange={(e) =>
                            setEditData((d) => ({ ...d, nameEn: e.target.value }))
                          }
                          placeholder="English Name"
                          className={cn(inputCls, "w-44")}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs text-gray-400">职称</label>
                        <select
                          value={editData.title}
                          onChange={(e) =>
                            setEditData((d) => ({
                              ...d,
                              title: e.target.value as AcademicTitle,
                            }))
                          }
                          className={cn(inputCls, "pr-7")}
                        >
                          {ACADEMIC_TITLES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      {/* Institution row (read-only hint) */}
                      <div className="w-full flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {uni?.name}
                        <span className="text-gray-200">·</span>
                        {dept?.name}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                        {D.name}
                      </h1>
                      {D.nameEn && (
                        <p className="text-sm text-gray-400 mt-0.5">{D.nameEn}</p>
                      )}
                      <p className="mt-1.5 flex items-center flex-wrap gap-x-1.5 gap-y-1 text-sm text-gray-600">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                          {D.title}
                        </span>
                        <Building2 className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
                        <span>{uni?.name}</span>
                        <span className="text-gray-300">·</span>
                        <span>{dept?.name}</span>
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  {editing ? (
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        保存修改
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      编辑信息
                    </button>
                  )}
                </div>

                {/* Honors */}
                {scholar.honors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {scholar.honors.map((h) => (
                      <span
                        key={h}
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium border px-2.5 py-1 rounded-full",
                          getHonorStyle(h),
                        )}
                      >
                        <Award className="w-3 h-3 shrink-0" />
                        {h}
                      </span>
                    ))}
                  </div>
                )}

                {/* Research fields */}
                <div className="mt-3">
                  {editing ? (
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5">研究方向</p>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {editData.researchFields.map((f, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2.5 py-1 rounded-full"
                          >
                            {f}
                            <button
                              onClick={() => removeField(i)}
                              className="hover:text-primary-900 ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <div className="flex items-center gap-1">
                          <input
                            value={fieldInput}
                            onChange={(e) => setFieldInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addField();
                              }
                            }}
                            placeholder="添加方向…"
                            className="text-xs border border-dashed border-primary-300 rounded-full px-2.5 py-1 w-24 focus:outline-none focus:border-primary-500 bg-primary-50/40"
                          />
                          {fieldInput.trim() && (
                            <button
                              onClick={addField}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {D.researchFields.map((f) => (
                        <span
                          key={f}
                          className="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-1 rounded-full"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact links */}
                <div className="mt-3">
                  {editing ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />邮箱
                        </label>
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) =>
                            setEditData((d) => ({ ...d, email: e.target.value }))
                          }
                          placeholder="user@university.edu.cn"
                          className={cn(inputCls, "text-xs")}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs text-gray-400 flex items-center gap-1">
                          <Globe className="w-3 h-3" />个人主页
                        </label>
                        <input
                          type="url"
                          value={editData.homepage}
                          onChange={(e) =>
                            setEditData((d) => ({ ...d, homepage: e.target.value }))
                          }
                          placeholder="https://…"
                          className={cn(inputCls, "text-xs")}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {D.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          {D.email}
                        </span>
                      )}
                      {D.homepage && (
                        <a
                          href={D.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-600 hover:text-primary-700 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          个人主页
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {D.googleScholar && (
                        <a
                          href={D.googleScholar}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Google Scholar
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: "h-index",
              value: D.hIndex != null ? String(D.hIndex) : "—",
              Icon: BarChart3,
              iconBg: "bg-violet-50",
              iconColor: "text-violet-600",
            },
            {
              label: "总引用",
              value:
                D.citationCount != null ? formatNumber(D.citationCount) : "—",
              Icon: BookOpen,
              iconBg: "bg-amber-50",
              iconColor: "text-amber-600",
            },
            {
              label: "论文数",
              value: D.paperCount != null ? String(D.paperCount) : "—",
              Icon: FileText,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
            {
              label: "科研项目",
              value: String(scholarProjects.length),
              Icon: FlaskConical,
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3.5"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  stat.iconBg,
                )}
              >
                <stat.Icon className={cn("w-5 h-5", stat.iconColor)} />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 leading-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Tab navigation ── */}
        <div className="border-b border-gray-200">
          <div className="flex gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.18 }}
          >
            {/* ─ Basic info ─ */}
            {activeTab === "basic" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="px-6 pt-5 pb-2">
                  <h3 className="text-sm font-semibold text-gray-900">基本信息</h3>
                </div>
                <div className="px-6 pb-5">
                  {editing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            label: "Google Scholar",
                            key: "googleScholar" as keyof EditData,
                            placeholder: "https://scholar.google.com/citations?…",
                          },
                          {
                            label: "DBLP",
                            key: "dblp" as keyof EditData,
                            placeholder: "https://dblp.org/pid/…",
                          },
                        ].map((item) => (
                          <div key={item.key} className="flex flex-col gap-0.5">
                            <label className="text-xs text-gray-400 flex items-center gap-1">
                              <Link2 className="w-3 h-3" />
                              {item.label}
                            </label>
                            <input
                              type="url"
                              value={(editData[item.key] as string) ?? ""}
                              onChange={(e) =>
                                setEditData((d) => ({
                                  ...d,
                                  [item.key]: e.target.value,
                                }))
                              }
                              placeholder={item.placeholder}
                              className={cn(inputCls, "text-xs w-full")}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "h-index", key: "hIndex" as keyof EditData },
                          { label: "总引用数", key: "citationCount" as keyof EditData },
                          { label: "论文数", key: "paperCount" as keyof EditData },
                        ].map((item) => (
                          <div key={item.key} className="flex flex-col gap-0.5">
                            <label className="text-xs text-gray-400">{item.label}</label>
                            <input
                              type="number"
                              min={0}
                              value={
                                (editData[item.key] as number | undefined) ?? ""
                              }
                              onChange={(e) =>
                                setEditData((d) => ({
                                  ...d,
                                  [item.key]: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                }))
                              }
                              className={cn(inputCls, "text-xs w-full")}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col gap-0.5 pt-1 border-t border-gray-50">
                        <label className="text-xs text-gray-400">个人简介</label>
                        <textarea
                          value={editData.bio}
                          onChange={(e) =>
                            setEditData((d) => ({ ...d, bio: e.target.value }))
                          }
                          rows={4}
                          placeholder="填写个人简介…"
                          className={cn(
                            inputCls,
                            "resize-none leading-relaxed text-sm w-full",
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-gray-50">
                        {[
                          { label: "姓名", value: D.name },
                          { label: "英文名", value: D.nameEn || "—" },
                          { label: "职称", value: D.title },
                          { label: "所属院校", value: uni?.name || "—" },
                          { label: "所属院系", value: dept?.name || "—" },
                          { label: "邮箱", value: D.email || "—" },
                          { label: "个人主页", value: D.homepage || "—" },
                          { label: "Google Scholar", value: D.googleScholar || "—" },
                          { label: "DBLP", value: D.dblp || "—" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-start gap-3 py-2.5"
                          >
                            <span className="w-28 shrink-0 text-sm text-gray-400">
                              {item.label}
                            </span>
                            <span className="text-sm text-gray-800 break-all">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      {D.bio && (
                        <div className="mt-4 pt-4 border-t border-gray-50">
                          <p className="text-xs text-gray-400 mb-1.5">个人简介</p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {D.bio}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ─ Academic output ─ */}
            {activeTab === "academic" && (
              <div className="space-y-4">
                {/* Papers */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-500" />
                      代表论文
                    </h3>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      {scholarPapers.length} 篇
                    </span>
                  </div>
                  {scholarPapers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">暂无论文数据</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {scholarPapers.map((p, i) => (
                        <div key={p.id} className="py-3.5 flex items-start gap-3">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold bg-gray-50 text-gray-400">
                            {p.isHighlight ? (
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              i + 1
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 leading-snug">
                              {p.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {p.authors.join(", ")}
                            </p>
                            <p className="text-xs mt-0.5">
                              <span className="text-primary-600 font-medium">
                                {p.venue}
                              </span>
                              <span className="text-gray-400"> · {p.year}</span>
                              {p.citationCount != null && (
                                <span className="text-gray-400 ml-2">
                                  被引 {p.citationCount}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Projects */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-emerald-500" />
                      科研项目
                    </h3>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      {scholarProjects.length} 项
                    </span>
                  </div>
                  {scholarProjects.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">暂无项目数据</p>
                  ) : (
                    <div className="space-y-2">
                      {scholarProjects.map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 bg-gray-50 rounded-lg hover:bg-gray-100/70 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-gray-900 flex-1 leading-snug">
                              {p.name}
                            </p>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                                p.status === "进行中"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-200 text-gray-600",
                              )}
                            >
                              {p.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                            <span>{p.fundingSource}</span>
                            <span className="text-gray-300">·</span>
                            <span>{p.role}</span>
                            {p.amount && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span>{p.amount}</span>
                              </>
                            )}
                            <span className="text-gray-300">·</span>
                            <span>{formatYearRange(p.startYear, p.endYear)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─ Relations ─ */}
            {activeTab === "relations" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    学术关系图谱
                  </h3>
                  <RelationshipGraph
                    scholarId={scholar.id}
                    scholarName={savedData.name}
                  />
                  <div className="flex justify-center gap-6 mt-4">
                    {[
                      { color: "bg-red-400", label: "导师" },
                      { color: "bg-blue-400", label: "学生" },
                      { color: "bg-emerald-400", label: "合作者" },
                      { color: "bg-gray-300", label: "同事" },
                    ].map(({ color, label }) => (
                      <span
                        key={label}
                        className="flex items-center gap-1.5 text-xs text-gray-500"
                      >
                        <span
                          className={cn("w-3 h-0.5 rounded-full inline-block", color)}
                        />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      title: "导师",
                      data: advisors,
                      Icon: GraduationCap,
                      iconColor: "text-red-500",
                      iconBg: "bg-red-50",
                    },
                    {
                      title: "指导学生",
                      data: students,
                      Icon: Users2,
                      iconColor: "text-blue-500",
                      iconBg: "bg-blue-50",
                    },
                    {
                      title: "合作者",
                      data: collaborators,
                      Icon: Handshake,
                      iconColor: "text-emerald-500",
                      iconBg: "bg-emerald-50",
                    },
                  ].map(({ title, data, Icon, iconColor, iconBg }) => (
                    <div
                      key={title}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center",
                            iconBg,
                          )}
                        >
                          <Icon className={cn("w-3.5 h-3.5", iconColor)} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {title}
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                          {data.length}
                        </span>
                      </div>
                      {data.length === 0 ? (
                        <p className="text-xs text-gray-400">暂无数据</p>
                      ) : (
                        <div className="space-y-1">
                          {data.map(
                            (r) =>
                              r.scholar && (
                                <Link
                                  key={r.id}
                                  to={`/scholars/${r.scholar.id}`}
                                  className="flex items-center gap-2 py-1 px-1.5 -mx-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0"
                                    style={{
                                      backgroundColor: getAvatarColor(
                                        r.scholar.name,
                                      ),
                                    }}
                                  >
                                    {getInitial(r.scholar.name)}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-medium text-gray-900">
                                      {r.scholar.name}
                                    </span>
                                    {r.description && (
                                      <span className="text-xs text-gray-400 ml-1">
                                        {r.description}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              ),
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─ Exchange ─ */}
            {activeTab === "exchange" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">学术交流</h3>
                <p className="text-sm text-gray-400 text-center py-8">暂无学术交流数据</p>
              </div>
            )}

            {/* ─ History ─ */}
            {activeTab === "history" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-400" />
                  变更历史
                </h3>
                {scholarChangelog.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">暂无变更记录</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {scholarChangelog.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 py-4">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0 mt-2",
                            log.action === "新增"
                              ? "bg-emerald-500"
                              : log.action === "修改"
                                ? "bg-primary-500"
                                : "bg-red-500",
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                "text-xs font-medium px-1.5 py-0.5 rounded",
                                log.action === "新增"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : log.action === "修改"
                                    ? "bg-primary-50 text-primary-700"
                                    : "bg-red-50 text-red-700",
                              )}
                            >
                              {log.action}
                            </span>
                            <span className="text-sm text-gray-700">
                              {log.description}
                            </span>
                          </div>
                          {log.field && log.oldValue && log.newValue && (
                            <div className="mt-1.5 text-xs bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap">
                              <span className="text-gray-500">{log.field}:</span>
                              <span className="line-through text-red-500">
                                {log.oldValue}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="text-emerald-600">{log.newValue}</span>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeTime(log.timestamp)} · {log.operator}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
