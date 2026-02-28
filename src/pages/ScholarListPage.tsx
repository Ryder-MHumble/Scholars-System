import { useState, useMemo, useEffect, useRef } from "react";
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
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import { scholars } from "@/data/scholars";
import { universities as defaultUniversities } from "@/data/universities";
import { relationships } from "@/data/relationships";
import { changelog } from "@/data/changelog";
import { cn } from "@/utils/cn";
import { getAvatarColor, getInitial } from "@/utils/avatar";
import { formatRelativeTime } from "@/utils/format";
import type { University, Department } from "@/types";

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
  uniList,
  onRenameUni,
  onDeleteUni,
  onAddUni,
  onRenameDept,
  onDeleteDept,
  onAddDept,
}: {
  sidebarSearch: string;
  activeUniId: string | null;
  activeDeptId: string | null;
  onSelectUni: (id: string | null) => void;
  onSelectDept: (uniId: string, deptId: string) => void;
  uniList: University[];
  onRenameUni: (id: string, name: string) => void;
  onDeleteUni: (id: string) => void;
  onAddUni: (name: string) => void;
  onRenameDept: (uniId: string, deptId: string, name: string) => void;
  onDeleteDept: (uniId: string, deptId: string) => void;
  onAddDept: (uniId: string, name: string) => void;
}) {
  const [expandedUnis, setExpandedUnis] = useState<Set<string>>(
    new Set(["tsinghua"]),
  );

  /* editing state — all lives here, no lifting needed */
  type EditTarget =
    | { type: "uni"; id: string }
    | { type: "dept"; uniId: string; id: string }
    | null;
  const [editing, setEditing] = useState<EditTarget>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [addingDeptFor, setAddingDeptFor] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [addingUni, setAddingUni] = useState(false);
  const [newUniName, setNewUniName] = useState("");

  const startEditUni = (uni: University, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing({ type: "uni", id: uni.id });
    setEditValue(uni.name);
    setConfirmDel(null);
    setAddingDeptFor(null);
    setAddingUni(false);
  };

  const startEditDept = (
    uniId: string,
    dept: Department,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setEditing({ type: "dept", uniId, id: dept.id });
    setEditValue(dept.name);
    setConfirmDel(null);
    setAddingDeptFor(null);
    setAddingUni(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const confirmEdit = () => {
    if (!editing || !editValue.trim()) {
      cancelEdit();
      return;
    }
    if (editing.type === "uni") {
      onRenameUni(editing.id, editValue.trim());
    } else {
      onRenameDept(editing.uniId, editing.id, editValue.trim());
    }
    cancelEdit();
  };

  const toggleUni = (id: string) =>
    setExpandedUnis((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const q = sidebarSearch.toLowerCase().trim();

  const visibleUnis = useMemo(() => {
    if (!q) return uniList;
    return uniList.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.shortName.toLowerCase().includes(q) ||
        u.departments.some((d) => d.name.toLowerCase().includes(q)),
    );
  }, [q, uniList]);

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
        const isEditingUni = editing?.type === "uni" && editing.id === uni.id;
        const isConfirmDelUni = confirmDel === uni.id;

        return (
          <div key={uni.id}>
            {/* University row */}
            <div className="group flex items-center">
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

              {isEditingUni ? (
                <div className="flex-1 flex items-center gap-1 pr-1 min-w-0">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="flex-1 min-w-0 px-1.5 py-0.5 text-xs bg-white border border-primary-400 rounded focus:outline-none"
                  />
                  <button
                    onClick={confirmEdit}
                    className="text-emerald-600 hover:text-emerald-700 p-0.5 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-400 hover:text-gray-600 p-0.5 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : isConfirmDelUni ? (
                <div className="flex-1 flex items-center gap-1 px-1.5 py-1 min-w-0">
                  <span className="text-xs text-red-500 truncate flex-1">
                    确认删除？
                  </span>
                  <button
                    onClick={() => {
                      onDeleteUni(uni.id);
                      setConfirmDel(null);
                    }}
                    className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 shrink-0"
                  >
                    删除
                  </button>
                  <button
                    onClick={() => setConfirmDel(null)}
                    className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 shrink-0"
                  >
                    取消
                  </button>
                </div>
              ) : (
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
              )}

              {/* Hover edit/delete icons */}
              {!isEditingUni && !isConfirmDelUni && (
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
                  <button
                    onClick={(e) => startEditUni(uni, e)}
                    className="p-1 text-gray-400 hover:text-primary-600 rounded transition-colors"
                    title="编辑院校名称"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDel(uni.id);
                      setEditing(null);
                      setAddingDeptFor(null);
                      setAddingUni(false);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    title="删除院校"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Department list */}
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
                    const isEditingDept =
                      editing?.type === "dept" && editing.id === dept.id;
                    const isConfirmDelDept = confirmDel === dept.id;

                    return (
                      <div
                        key={dept.id}
                        className="group/dept flex items-center my-0.5"
                      >
                        {isEditingDept ? (
                          <div className="flex-1 flex items-center gap-1 min-w-0">
                            <input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") confirmEdit();
                                if (e.key === "Escape") cancelEdit();
                              }}
                              className="flex-1 min-w-0 px-1.5 py-0.5 text-[11px] bg-white border border-primary-400 rounded focus:outline-none"
                            />
                            <button
                              onClick={confirmEdit}
                              className="text-emerald-600 hover:text-emerald-700 p-0.5 shrink-0"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-400 hover:text-gray-600 p-0.5 shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : isConfirmDelDept ? (
                          <div className="flex-1 flex items-center gap-1 px-2 py-0.5 min-w-0">
                            <span className="text-[10px] text-red-500 truncate flex-1">
                              确认删除？
                            </span>
                            <button
                              onClick={() => {
                                onDeleteDept(uni.id, dept.id);
                                setConfirmDel(null);
                              }}
                              className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 shrink-0"
                            >
                              删除
                            </button>
                            <button
                              onClick={() => setConfirmDel(null)}
                              className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 shrink-0"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => onSelectDept(uni.id, dept.id)}
                              className={cn(
                                "flex-1 flex items-center gap-2 px-2 py-1 rounded-md transition-colors min-w-0",
                                isDeptActive
                                  ? "bg-primary-50 text-primary-700 font-medium"
                                  : dept.scholarCount === 0
                                    ? "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                    : "text-gray-600 hover:bg-gray-50",
                              )}
                            >
                              <BookOpen className="w-3 h-3 shrink-0 text-gray-300" />
                              <span className="truncate text-xs">
                                {dept.name}
                              </span>
                              {dept.scholarCount > 0 && (
                                <span className="ml-auto text-[10px] text-gray-400 shrink-0">
                                  {dept.scholarCount}
                                </span>
                              )}
                            </button>
                            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/dept:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => startEditDept(uni.id, dept, e)}
                                className="p-0.5 text-gray-400 hover:text-primary-600 rounded transition-colors"
                                title="编辑院系名称"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDel(dept.id);
                                  setEditing(null);
                                  setAddingDeptFor(null);
                                  setAddingUni(false);
                                }}
                                className="p-0.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                                title="删除院系"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Add department row */}
                  {addingDeptFor === uni.id ? (
                    <div className="flex items-center gap-1 mt-1 px-2">
                      <input
                        autoFocus
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newDeptName.trim()) {
                            onAddDept(uni.id, newDeptName.trim());
                            setNewDeptName("");
                            setAddingDeptFor(null);
                          }
                          if (e.key === "Escape") {
                            setAddingDeptFor(null);
                            setNewDeptName("");
                          }
                        }}
                        placeholder="院系名称"
                        className="flex-1 min-w-0 px-1.5 py-0.5 text-[11px] bg-white border border-primary-400 rounded focus:outline-none placeholder-gray-300"
                      />
                      <button
                        onClick={() => {
                          if (newDeptName.trim())
                            onAddDept(uni.id, newDeptName.trim());
                          setNewDeptName("");
                          setAddingDeptFor(null);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 p-0.5 shrink-0"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setAddingDeptFor(null);
                          setNewDeptName("");
                        }}
                        className="text-gray-400 hover:text-gray-600 p-0.5 shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingDeptFor(uni.id);
                        setEditing(null);
                        setAddingUni(false);
                        setConfirmDel(null);
                      }}
                      className="flex items-center gap-1.5 w-full px-2 py-1 text-[11px] text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors mt-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      添加院系
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Add university */}
      {addingUni ? (
        <div className="flex items-center gap-1 px-1 mt-1">
          <input
            autoFocus
            value={newUniName}
            onChange={(e) => setNewUniName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newUniName.trim()) {
                onAddUni(newUniName.trim());
                setNewUniName("");
                setAddingUni(false);
              }
              if (e.key === "Escape") {
                setAddingUni(false);
                setNewUniName("");
              }
            }}
            placeholder="院校名称"
            className="flex-1 min-w-0 px-1.5 py-0.5 text-xs bg-white border border-primary-400 rounded focus:outline-none placeholder-gray-300"
          />
          <button
            onClick={() => {
              if (newUniName.trim()) onAddUni(newUniName.trim());
              setNewUniName("");
              setAddingUni(false);
            }}
            className="text-emerald-600 hover:text-emerald-700 p-0.5 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setAddingUni(false);
              setNewUniName("");
            }}
            className="text-gray-400 hover:text-gray-600 p-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setAddingUni(true);
            setEditing(null);
            setAddingDeptFor(null);
            setConfirmDel(null);
          }}
          className="flex items-center gap-1.5 w-full px-2 py-1.5 mt-2 text-xs text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors border border-dashed border-gray-200 hover:border-primary-300"
        >
          <Plus className="w-3.5 h-3.5" />
          添加院校
        </button>
      )}
    </nav>
  );
}

/* ── filter popover (anchored dropdown, no backdrop) ── */
function FilterPopover({
  open,
  filterTitles,
  setFilterTitles,
  filterResearchField,
  setFilterResearchField,
  filterAcademician,
  setFilterAcademician,
  onReset,
}: {
  open: boolean;
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
        <motion.div
          key="popover"
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute top-full right-0 mt-1.5 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Popover header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary-500" />
              筛选条件
            </span>
            <button
              onClick={onReset}
              className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
              重置
            </button>
          </div>

          {/* Popover body */}
          <div className="px-4 py-4 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* 职称 */}
            <section>
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                职称
                {filterTitles.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full font-semibold">
                    {filterTitles.length}
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TITLES.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTitle(t)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all",
                      filterTitles.includes(t)
                        ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>

            <div className="h-px bg-gray-100" />

            {/* 研究方向 */}
            <section>
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                研究方向
                {filterResearchField && (
                  <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full font-semibold">
                    已筛选
                  </span>
                )}
              </h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  value={filterResearchField}
                  onChange={(e) => setFilterResearchField(e.target.value)}
                  placeholder="输入关键词..."
                  className="w-full pl-7 pr-7 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                />
                {filterResearchField && (
                  <button
                    onClick={() => setFilterResearchField("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </section>

            <div className="h-px bg-gray-100" />

            {/* 两院院士 */}
            <section>
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                两院院士
                {filterAcademician.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full font-semibold">
                    {filterAcademician.length}
                  </span>
                )}
              </h3>
              <div className="space-y-1.5">
                {[
                  {
                    id: "cas",
                    label: "中国科学院院士",
                    badge: "中科院",
                    color: "bg-red-50 border-red-200",
                    activeColor: "bg-red-50 border-red-400",
                  },
                  {
                    id: "cae",
                    label: "中国工程院院士",
                    badge: "工程院",
                    color: "bg-orange-50 border-orange-200",
                    activeColor: "bg-orange-50 border-orange-400",
                  },
                ].map(({ id, label, badge, color, activeColor }) => {
                  const checked = filterAcademician.includes(id);
                  return (
                    <label
                      key={id}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all",
                        checked ? activeColor : `${color}`,
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAcad(id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-xs font-medium text-gray-700 flex-1">
                        {label}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {badge}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>
        </motion.div>
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

  /* editable university list */
  const [uniList, setUniList] = useState<University[]>(defaultUniversities);

  const handleRenameUni = (id: string, name: string) =>
    setUniList((prev) => prev.map((u) => (u.id === id ? { ...u, name } : u)));

  const handleDeleteUni = (id: string) => {
    setUniList((prev) => prev.filter((u) => u.id !== id));
    if (activeUniId === id) {
      setActiveUniId(null);
      setActiveDeptId(null);
    }
  };

  const handleAddUni = (name: string) => {
    const id = `uni-${Date.now()}`;
    setUniList((prev) => [
      ...prev,
      { id, name, shortName: name, location: "", departments: [] },
    ]);
  };

  const handleRenameDept = (uniId: string, deptId: string, name: string) =>
    setUniList((prev) =>
      prev.map((u) =>
        u.id === uniId
          ? {
              ...u,
              departments: u.departments.map((d) =>
                d.id === deptId ? { ...d, name } : d,
              ),
            }
          : u,
      ),
    );

  const handleDeleteDept = (uniId: string, deptId: string) => {
    setUniList((prev) =>
      prev.map((u) =>
        u.id === uniId
          ? { ...u, departments: u.departments.filter((d) => d.id !== deptId) }
          : u,
      ),
    );
    if (activeDeptId === deptId) setActiveDeptId(null);
  };

  const handleAddDept = (uniId: string, name: string) => {
    const id = `dept-${Date.now()}`;
    setUniList((prev) =>
      prev.map((u) =>
        u.id === uniId
          ? {
              ...u,
              departments: [
                ...u.departments,
                { id, universityId: uniId, name, scholarCount: 0 },
              ],
            }
          : u,
      ),
    );
  };

  /* toolbar */
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  /* filter popover outside-click handling */
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  /* selection */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

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

  const allPageSelected = paged.length > 0 && paged.every((s) => selectedIds.has(s.id));
  const somePageSelected = paged.some((s) => selectedIds.has(s.id)) && !allPageSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = somePageSelected;
    }
  }, [somePageSelected]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, filterTitles, filterResearchField, filterAcademician]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [query, filterTitles, filterResearchField, filterAcademician, activeUniId, activeDeptId]);

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
              uniList.find((u) => u.id === activeUniId)?.shortName ?? "",
            onRemove: () => handleSelectUni(null),
          },
        ]
      : []),
    ...(activeDeptId
      ? [
          {
            label: (() => {
              const uni = uniList.find((u) => u.id === activeUniId);
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
              uniList={uniList}
              onRenameUni={handleRenameUni}
              onDeleteUni={handleDeleteUni}
              onAddUni={handleAddUni}
              onRenameDept={handleRenameDept}
              onDeleteDept={handleDeleteDept}
              onAddDept={handleAddDept}
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
                        ? uniList
                            .find((u) => u.id === activeUniId)
                            ?.departments.find((d) => d.id === activeDeptId)
                            ?.name
                        : uniList.find((u) => u.id === activeUniId)?.name}
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

                {/* Filter button + popover */}
                <div ref={filterRef} className="relative">
                  <button
                    onClick={() => setFilterOpen((v) => !v)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                      filterOpen || activeFilterCount > 0
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
                  <FilterPopover
                    open={filterOpen}
                    filterTitles={filterTitles}
                    setFilterTitles={setFilterTitles}
                    filterResearchField={filterResearchField}
                    setFilterResearchField={setFilterResearchField}
                    filterAcademician={filterAcademician}
                    setFilterAcademician={setFilterAcademician}
                    onReset={resetFilters}
                  />
                </div>

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
                <Link
                  to="/scholars/add"
                  className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  添加学者
                </Link>
              </div>
            </div>

            {/* Selection Banner */}
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-primary-50 border border-primary-200 rounded-xl flex-wrap"
                >
                  <span className="text-sm text-primary-700 font-medium">
                    已选 {selectedIds.size} 条
                  </span>
                  <button
                    onClick={() => setSelectedIds(new Set(filtered.map((s) => s.id)))}
                    className="text-xs text-primary-600 hover:text-primary-800 underline"
                  >
                    选择全部 {filtered.length} 条筛选结果
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    清除选择
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => {
                        const selected = filtered.filter((s) => selectedIds.has(s.id));
                        const uni_map = Object.fromEntries(defaultUniversities.map((u) => [u.id, u.name]));
                        const dept_map: Record<string, string> = {};
                        defaultUniversities.forEach((u) => u.departments.forEach((d) => { dept_map[d.id] = d.name; }));
                        const rows = selected.map((s) => [
                          s.name, s.nameEn ?? '', s.title,
                          uni_map[s.universityId] ?? '', dept_map[s.departmentId] ?? '',
                          s.email ?? '', s.phone ?? '',
                          s.hIndex ?? '', s.citationCount ?? '', s.paperCount ?? '',
                          s.honors.join('|'), s.researchFields.join('|'),
                        ]);
                        const header = ['姓名','英文名','职称','院校','院系','邮箱','电话','H指数','引用数','论文数','荣誉','研究方向'];
                        const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `scholars-export-${new Date().toISOString().slice(0,10)}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-primary-300 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-50 transition-colors"
                    >
                      导出所选
                    </button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                    >
                      批量删除
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                                ref={headerCheckboxRef}
                                type="checkbox"
                                checked={allPageSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedIds((prev) => {
                                      const next = new Set(prev);
                                      paged.forEach((s) => next.add(s.id));
                                      return next;
                                    });
                                  } else {
                                    setSelectedIds((prev) => {
                                      const next = new Set(prev);
                                      paged.forEach((s) => next.delete(s.id));
                                      return next;
                                    });
                                  }
                                }}
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
                            const uni = uniList.find(
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
                                    checked={selectedIds.has(s.id)}
                                    onChange={() => {
                                      setSelectedIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(s.id)) next.delete(s.id);
                                        else next.add(s.id);
                                        return next;
                                      });
                                    }}
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
                      const uni = uniList.find(
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

    </div>
  );
}
