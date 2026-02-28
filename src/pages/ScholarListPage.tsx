import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  GraduationCap,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Plus,
  List,
  LayoutGrid,
  SlidersHorizontal,
  BookOpen,
  Building2,
  Award,
} from "lucide-react";
import { scholars } from "@/data/scholars";
import { universities } from "@/data/universities";
import { relationships } from "@/data/relationships";
import { changelog } from "@/data/changelog";
import { cn } from "@/utils/cn";
import { getAvatarColor, getInitial } from "@/utils/avatar";
import { formatRelativeTime } from "@/utils/format";
import type { University } from "@/types";

const PAGE_SIZE = 15;

const ALL_TITLES = [
  "教授",
  "副教授",
  "助理教授",
  "研究员",
  "副研究员",
  "助理研究员",
  "讲师",
  "博士后",
] as const;

type ViewMode = "list" | "grid";

/* ── get relationship info for a scholar ── */
function getScholarRelationships(scholarId: string) {
  const rels = relationships.filter(
    (r) => r.fromScholarId === scholarId || r.toScholarId === scholarId,
  );
  const result: { color: string; label: string }[] = [];
  const types = new Set<string>();
  for (const r of rels) {
    if (
      r.type === "导师" &&
      r.toScholarId === scholarId &&
      !types.has("导师")
    ) {
      result.push({ color: "bg-emerald-500", label: "有导师关系" });
      types.add("导师");
    }
    if (
      r.type === "导师" &&
      r.fromScholarId === scholarId &&
      !types.has("学生")
    ) {
      result.push({ color: "bg-blue-500", label: "指导学生" });
      types.add("学生");
    }
    if (r.type === "合作者" && !types.has("合作者")) {
      result.push({ color: "bg-amber-500", label: "合作研究" });
      types.add("合作者");
    }
    if (r.type === "同事" && !types.has("同事")) {
      result.push({ color: "bg-indigo-500", label: "同事关系" });
      types.add("同事");
    }
  }
  return result;
}

/* ── get recent update for a scholar ── */
function getRecentUpdate(scholarId: string) {
  const logs = changelog
    .filter((c) => c.scholarId === scholarId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  return logs[0] || null;
}

/* ── academician badge ── */
function AcademicianBadge({ honors }: { honors: string[] }) {
  const isCAS = honors.some((h) => h.includes("中国科学院院士"));
  const isCAE = honors.some((h) => h.includes("中国工程院院士"));
  if (!isCAS && !isCAE) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0",
        isCAS
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-orange-50 text-orange-600 border border-orange-200",
      )}
    >
      <Award className="w-2.5 h-2.5" />
      {isCAS ? "中科院" : "工程院"}
    </span>
  );
}

/* ── sidebar university tree ── */
function SidebarTree({
  sidebarSearch,
  activeUniId,
  activeDeptId,
  onSelectUni,
  onSelectDept,
}: {
  sidebarSearch: string;
  activeUniId: string | null;
  activeDeptId: string | null;
  onSelectUni: (id: string | null) => void;
  onSelectDept: (uniId: string, deptId: string) => void;
}) {
  const [expandedUnis, setExpandedUnis] = useState<Set<string>>(
    new Set(["tsinghua"]),
  );

  const toggleUni = (id: string) =>
    setExpandedUnis((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const q = sidebarSearch.toLowerCase().trim();

  const visibleUnis = useMemo(() => {
    if (!q) return universities;
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.shortName.toLowerCase().includes(q) ||
        u.departments.some((d) => d.name.toLowerCase().includes(q)),
    );
  }, [q]);

  function getVisibleDepts(uni: University) {
    if (!q) return uni.departments;
    if (
      uni.name.toLowerCase().includes(q) ||
      uni.shortName.toLowerCase().includes(q)
    )
      return uni.departments;
    return uni.departments.filter((d) => d.name.toLowerCase().includes(q));
  }

  const isExpanded = (uniId: string) => (q ? true : expandedUnis.has(uniId));

  return (
    <nav className="space-y-0.5 px-3">
      {/* "All" entry */}
      <button
        onClick={() => onSelectUni(null)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
          !activeUniId && !activeDeptId
            ? "bg-primary-50 text-primary-700 font-medium"
            : "text-gray-600 hover:bg-gray-50",
        )}
      >
        <Building2 className="w-4 h-4 shrink-0 text-gray-400" />
        <span>全部院校</span>
        <span className="ml-auto text-[10px] text-gray-400">
          {scholars.length}
        </span>
      </button>

      {visibleUnis.map((uni) => {
        const depts = getVisibleDepts(uni);
        const expanded = isExpanded(uni.id);
        const isUniActive = activeUniId === uni.id && !activeDeptId;
        const uniScholarCount = scholars.filter(
          (s) => s.universityId === uni.id,
        ).length;

        return (
          <div key={uni.id}>
            <div className="flex items-center">
              <button
                onClick={() => toggleUni(uni.id)}
                className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
              >
                {expanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => onSelectUni(uni.id)}
                className={cn(
                  "flex-1 flex items-center gap-2 px-1.5 py-1.5 rounded-md text-sm transition-colors min-w-0",
                  isUniActive
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50",
                )}
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0 text-primary-400" />
                <span className="truncate text-sm">{uni.name}</span>
                <span className="ml-auto text-[10px] text-gray-400 shrink-0">
                  {uniScholarCount}
                </span>
              </button>
            </div>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden ml-4 pl-2 border-l border-gray-100"
                >
                  {depts.map((dept) => {
                    const isDeptActive = activeDeptId === dept.id;
                    return (
                      <button
                        key={dept.id}
                        onClick={() => onSelectDept(uni.id, dept.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1 rounded-md transition-colors my-0.5",
                          isDeptActive
                            ? "bg-primary-50 text-primary-700 font-medium"
                            : dept.scholarCount === 0
                              ? "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                              : "text-gray-600 hover:bg-gray-50",
                        )}
                      >
                        <BookOpen className="w-3 h-3 shrink-0 text-gray-300" />
                        <span className="truncate text-xs">{dept.name}</span>
                        {dept.scholarCount > 0 && (
                          <span className="ml-auto text-[10px] text-gray-400 shrink-0">
                            {dept.scholarCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}

/* ── filter drawer ── */
function FilterDrawer({
  open,
  onClose,
  filterTitles,
  setFilterTitles,
  filterResearchField,
  setFilterResearchField,
  filterAcademician,
  setFilterAcademician,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  filterTitles: string[];
  setFilterTitles: (v: string[]) => void;
  filterResearchField: string;
  setFilterResearchField: (v: string) => void;
  filterAcademician: string[];
  setFilterAcademician: (v: string[]) => void;
  onReset: () => void;
}) {
  const toggleTitle = (t: string) =>
    setFilterTitles(
      filterTitles.includes(t)
        ? filterTitles.filter((x) => x !== t)
        : [...filterTitles, t],
    );

  const toggleAcad = (a: string) =>
    setFilterAcademician(
      filterAcademician.includes(a)
        ? filterAcademician.filter((x) => x !== a)
        : [...filterAcademician, a],
    );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary-500" />
                高级筛选
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-6">
              {/* 职称 */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  职称
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ALL_TITLES.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTitle(t)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        filterTitles.includes(t)
                          ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </section>

              {/* 研究方向 */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  研究方向
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={filterResearchField}
                    onChange={(e) => setFilterResearchField(e.target.value)}
                    placeholder="输入研究方向关键词..."
                    className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {filterResearchField && (
                    <button
                      onClick={() => setFilterResearchField("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </section>

              {/* 两院院士 */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  两院院士
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      id: "cas",
                      label: "中国科学院院士",
                      desc: "科学院当选院士",
                    },
                    {
                      id: "cae",
                      label: "中国工程院院士",
                      desc: "工程院当选院士",
                    },
                  ].map(({ id, label, desc }) => (
                    <label
                      key={id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        filterAcademician.includes(id)
                          ? "bg-primary-50 border-primary-200"
                          : "bg-white border-gray-200 hover:border-gray-300",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={filterAcademician.includes(id)}
                        onChange={() => toggleAcad(id)}
                        className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {label}
                        </p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={onReset}
                className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                重置
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                完成
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── main component ── */
export default function ScholarListPage() {
  /* sidebar state */
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [activeUniId, setActiveUniId] = useState<string | null>(null);
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);

  /* toolbar */
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  /* advanced filters */
  const [filterTitles, setFilterTitles] = useState<string[]>([]);
  const [filterResearchField, setFilterResearchField] = useState("");
  const [filterAcademician, setFilterAcademician] = useState<string[]>([]);

  /* sidebar callbacks */
  const handleSelectUni = (id: string | null) => {
    setActiveUniId(id);
    setActiveDeptId(null);
    setPage(1);
  };
  const handleSelectDept = (uniId: string, deptId: string) => {
    setActiveUniId(uniId);
    setActiveDeptId(deptId);
    setPage(1);
  };

  /* reset all filters */
  const resetFilters = () => {
    setFilterTitles([]);
    setFilterResearchField("");
    setFilterAcademician([]);
  };

  const clearAll = () => {
    setQuery("");
    setActiveUniId(null);
    setActiveDeptId(null);
    resetFilters();
    setPage(1);
  };

  /* filter logic */
  const filtered = useMemo(() => {
    let result = scholars;

    // sidebar navigation
    if (activeDeptId)
      result = result.filter((s) => s.departmentId === activeDeptId);
    else if (activeUniId)
      result = result.filter((s) => s.universityId === activeUniId);

    // text search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
          s.researchFields.some((f) => f.toLowerCase().includes(q)),
      );
    }

    // title filter
    if (filterTitles.length > 0)
      result = result.filter((s) => filterTitles.includes(s.title));

    // research field filter
    if (filterResearchField.trim()) {
      const rf = filterResearchField.toLowerCase();
      result = result.filter((s) =>
        s.researchFields.some((f) => f.toLowerCase().includes(rf)),
      );
    }

    // academician filter (OR logic)
    if (filterAcademician.length > 0) {
      result = result.filter((s) =>
        filterAcademician.some((a) => {
          if (a === "cas")
            return s.honors.some((h) => h.includes("中国科学院院士"));
          if (a === "cae")
            return s.honors.some((h) => h.includes("中国工程院院士"));
          return false;
        }),
      );
    }

    return result;
  }, [
    activeDeptId,
    activeUniId,
    query,
    filterTitles,
    filterResearchField,
    filterAcademician,
  ]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, filterTitles, filterResearchField, filterAcademician]);

  /* active filter count */
  const activeFilterCount =
    filterTitles.length +
    (filterResearchField ? 1 : 0) +
    filterAcademician.length;

  /* active filter chips */
  const filterChips: { label: string; onRemove: () => void }[] = [
    ...filterTitles.map((t) => ({
      label: t,
      onRemove: () => setFilterTitles(filterTitles.filter((x) => x !== t)),
    })),
    ...(filterResearchField
      ? [
          {
            label: `方向: ${filterResearchField}`,
            onRemove: () => setFilterResearchField(""),
          },
        ]
      : []),
    ...filterAcademician.map((a) => ({
      label: a === "cas" ? "中科院院士" : "工程院院士",
      onRemove: () =>
        setFilterAcademician(filterAcademician.filter((x) => x !== a)),
    })),
    ...(activeUniId
      ? [
          {
            label:
              universities.find((u) => u.id === activeUniId)?.shortName ?? "",
            onRemove: () => handleSelectUni(null),
          },
        ]
      : []),
    ...(activeDeptId
      ? [
          {
            label: (() => {
              const uni = universities.find((u) => u.id === activeUniId);
              const dept = uni?.departments.find((d) => d.id === activeDeptId);
              return dept?.name ?? "";
            })(),
            onRemove: () => {
              setActiveDeptId(null);
              setPage(1);
            },
          },
        ]
      : []),
  ].filter((c) => c.label);

  const hasAnyFilter = filterChips.length > 0 || query;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ══ BODY ══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar ── */}
        <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0 hidden md:flex overflow-hidden">
          {/* Sidebar search */}
          <div className="px-3 pt-4 pb-2 shrink-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
              机构层级
            </p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="搜索高校或院系..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-transparent placeholder-gray-400"
              />
              {sidebarSearch && (
                <button
                  onClick={() => setSidebarSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Sidebar tree (scrollable) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar py-1 pb-4">
            <SidebarTree
              sidebarSearch={sidebarSearch}
              activeUniId={activeUniId}
              activeDeptId={activeDeptId}
              onSelectUni={handleSelectUni}
              onSelectDept={handleSelectDept}
            />
          </div>

          {/* DB status */}
          <div className="p-3 border-t border-gray-100 shrink-0">
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-2.5">
              <p className="text-[10px] font-semibold text-primary-600 mb-1">
                数据库状态
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                同步中：98%
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="p-6 md:p-8"
          >
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  学者信息管理
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  共{" "}
                  <span className="font-medium text-gray-700">
                    {filtered.length}
                  </span>{" "}
                  位学者
                  {(activeUniId || activeDeptId) && (
                    <span className="text-gray-400">
                      {" "}
                      ·{" "}
                      {activeDeptId
                        ? universities
                            .find((u) => u.id === activeUniId)
                            ?.departments.find((d) => d.id === activeDeptId)
                            ?.name
                        : universities.find((u) => u.id === activeUniId)?.name}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜索学者、研究方向..."
                    className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow placeholder-gray-400"
                  />
                </div>

                {/* Filter button */}
                <button
                  onClick={() => setFilterOpen(true)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                    activeFilterCount > 0
                      ? "bg-primary-50 text-primary-700 border-primary-200"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                  )}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  筛选
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* View toggle */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "px-2.5 py-2 transition-colors",
                      viewMode === "list"
                        ? "bg-primary-50 text-primary-600"
                        : "text-gray-400 hover:text-gray-600",
                    )}
                    title="列表视图"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "px-2.5 py-2 transition-colors",
                      viewMode === "grid"
                        ? "bg-primary-50 text-primary-600"
                        : "text-gray-400 hover:text-gray-600",
                    )}
                    title="卡片视图"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                {/* Add */}
                <button className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />
                  添加学者
                </button>
              </div>
            </div>

            {/* Active filter chips */}
            <AnimatePresence>
              {filterChips.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 flex-wrap mb-4"
                >
                  {filterChips.map((chip) => (
                    <span
                      key={chip.label}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-medium"
                    >
                      {chip.label}
                      <button
                        onClick={chip.onRemove}
                        className="hover:text-primary-900 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    清除全部
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content area with view mode switch */}
            <AnimatePresence mode="wait">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-24 text-gray-400"
                >
                  <Search className="w-12 h-12 mb-3 opacity-25" />
                  <p className="text-sm">未找到匹配的学者</p>
                  {hasAnyFilter && (
                    <button
                      onClick={clearAll}
                      className="mt-3 text-xs text-primary-600 hover:underline"
                    >
                      清除所有筛选条件
                    </button>
                  )}
                </motion.div>
              ) : viewMode === "list" ? (
                /* ── List View ── */
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                            </th>
                            <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              学者
                            </th>
                            <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              所属机构
                            </th>
                            <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              研究方向
                            </th>
                            <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              学术关系
                            </th>
                            <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              动态更新
                            </th>
                            <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {paged.map((s, i) => {
                            const uni = universities.find(
                              (u) => u.id === s.universityId,
                            );
                            const dept = uni?.departments.find(
                              (d) => d.id === s.departmentId,
                            );
                            const relInfo = getScholarRelationships(s.id);
                            const recentLog = getRecentUpdate(s.id);
                            return (
                              <motion.tr
                                key={s.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.015 }}
                                className="group hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-5 py-3.5">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  />
                                </td>
                                <td className="px-5 py-3.5">
                                  <Link
                                    to={`/scholars/${s.id}`}
                                    className="flex items-center gap-3"
                                  >
                                    <div
                                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                                      style={{
                                        backgroundColor: getAvatarColor(s.name),
                                      }}
                                    >
                                      {getInitial(s.name)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                          {s.name}
                                        </p>
                                        <AcademicianBadge honors={s.honors} />
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {s.title}
                                      </p>
                                    </div>
                                  </Link>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="min-w-0">
                                    <p className="text-sm text-gray-800 font-medium truncate">
                                      {uni?.name ?? "—"}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {dept?.name ?? "—"}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                                    {s.researchFields.slice(0, 2).map((f) => (
                                      <span
                                        key={f}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200"
                                      >
                                        {f}
                                      </span>
                                    ))}
                                    {s.researchFields.length > 2 && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                        +{s.researchFields.length - 2}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  {relInfo.length > 0 ? (
                                    <div className="space-y-1">
                                      {relInfo.slice(0, 2).map((r, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-1.5 text-xs text-gray-700"
                                        >
                                          <span
                                            className={cn(
                                              "w-2 h-2 rounded-full shrink-0",
                                              r.color,
                                            )}
                                          />
                                          {r.label}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">
                                      —
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5">
                                  {recentLog ? (
                                    <div className="text-xs text-gray-600">
                                      <p className="mb-0.5">
                                        <span className="font-medium text-gray-900">
                                          {recentLog.action}:
                                        </span>{" "}
                                        {recentLog.field ||
                                          recentLog.description}
                                      </p>
                                      <p className="text-gray-400">
                                        {formatRelativeTime(
                                          recentLog.timestamp,
                                        )}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400">
                                      {formatRelativeTime(s.updatedAt)}
                                    </p>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <Link
                                    to={`/scholars/${s.id}`}
                                    className="inline-flex text-gray-400 hover:text-primary-600 transition-colors p-1"
                                    title="查看详情"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        显示第{" "}
                        <span className="font-medium">
                          {(page - 1) * PAGE_SIZE + 1}
                        </span>{" "}
                        到{" "}
                        <span className="font-medium">
                          {Math.min(page * PAGE_SIZE, filtered.length)}
                        </span>{" "}
                        条，共{" "}
                        <span className="font-medium">{filtered.length}</span>{" "}
                        条
                      </p>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                          >
                            <ChevronLeft className="w-3 h-3" />
                            上一页
                          </button>
                          {Array.from(
                            { length: Math.min(totalPages, 7) },
                            (_, i) => {
                              let p: number;
                              if (totalPages <= 7) p = i + 1;
                              else if (page <= 4) p = i + 1;
                              else if (page >= totalPages - 3)
                                p = totalPages - 6 + i;
                              else p = page - 3 + i;
                              return (
                                <button
                                  key={p}
                                  onClick={() => setPage(p)}
                                  className={cn(
                                    "w-8 h-8 text-xs font-medium rounded-lg transition-colors",
                                    p === page
                                      ? "bg-primary-500 text-white"
                                      : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50",
                                  )}
                                >
                                  {p}
                                </button>
                              );
                            },
                          )}
                          <button
                            onClick={() =>
                              setPage(Math.min(totalPages, page + 1))
                            }
                            disabled={page === totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                          >
                            下一页
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ── Grid View ── */
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paged.map((s, i) => {
                      const uni = universities.find(
                        (u) => u.id === s.universityId,
                      );
                      const dept = uni?.departments.find(
                        (d) => d.id === s.departmentId,
                      );
                      const isCAS = s.honors.some((h) =>
                        h.includes("中国科学院院士"),
                      );
                      const isCAE = s.honors.some((h) =>
                        h.includes("中国工程院院士"),
                      );
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <Link
                            to={`/scholars/${s.id}`}
                            className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-primary-100 transition-all group"
                          >
                            {/* Card header */}
                            <div className="flex items-start gap-3 mb-3">
                              <div
                                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                                style={{
                                  backgroundColor: getAvatarColor(s.name),
                                }}
                              >
                                {getInitial(s.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                                  {s.name}
                                </p>
                                {s.nameEn && (
                                  <p className="text-[10px] text-gray-400 truncate">
                                    {s.nameEn}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {s.title}
                                </p>
                              </div>
                            </div>

                            {/* Academician badges */}
                            {(isCAS || isCAE) && (
                              <div className="mb-2">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium",
                                    isCAS
                                      ? "bg-red-50 text-red-600 border border-red-200"
                                      : "bg-orange-50 text-orange-600 border border-orange-200",
                                  )}
                                >
                                  <Award className="w-2.5 h-2.5" />
                                  {isCAS ? "中国科学院院士" : "中国工程院院士"}
                                </span>
                              </div>
                            )}

                            {/* Institution */}
                            <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
                              <Building2 className="w-3 h-3 shrink-0 text-gray-400" />
                              <span className="truncate">
                                {uni?.shortName}
                                {dept && (
                                  <span className="text-gray-400">
                                    {" "}
                                    · {dept.name}
                                  </span>
                                )}
                              </span>
                            </div>

                            {/* Research fields */}
                            <div className="flex flex-wrap gap-1">
                              {s.researchFields.slice(0, 3).map((f) => (
                                <span
                                  key={f}
                                  className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-50 text-primary-700 border border-primary-100"
                                >
                                  {f}
                                </span>
                              ))}
                              {s.researchFields.length > 3 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                  +{s.researchFields.length - 3}
                                </span>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Grid pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        第 {page} / {totalPages} 页，共 {filtered.length} 条
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                          <ChevronLeft className="w-3 h-3" />
                          上一页
                        </button>
                        <button
                          onClick={() =>
                            setPage(Math.min(totalPages, page + 1))
                          }
                          disabled={page === totalPages}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                          下一页
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>

      {/* ── Filter Drawer ── */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filterTitles={filterTitles}
        setFilterTitles={setFilterTitles}
        filterResearchField={filterResearchField}
        setFilterResearchField={setFilterResearchField}
        filterAcademician={filterAcademician}
        setFilterAcademician={setFilterAcademician}
        onReset={resetFilters}
      />
    </div>
  );
}
