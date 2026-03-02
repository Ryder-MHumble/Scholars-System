/**
 * 高校-院系树形侧边栏组件
 * 从 ScholarListPage 的 SidebarTree 提取（第 72-196 行）
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  GraduationCap,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Building2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface UniNode {
  name: string;
  departments: string[];
  count: number;
}

interface UniversitySidebarTreeProps {
  sidebarSearch: string;
  activeUni: string | null;
  activeDept: string | null;
  onSelectUni: (name: string | null) => void;
  onSelectDept: (uniName: string, deptName: string) => void;
  uniNodes: UniNode[];
  totalCount: number;
  onSearchChange: (search: string) => void;
}

export function UniversitySidebarTree({
  sidebarSearch,
  activeUni,
  activeDept,
  onSelectUni,
  onSelectDept,
  uniNodes,
  totalCount,
  onSearchChange,
}: UniversitySidebarTreeProps) {
  const [expandedUnis, setExpandedUnis] = useState<Set<string>>(new Set());

  const toggleUni = (name: string) =>
    setExpandedUnis((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const q = sidebarSearch.toLowerCase().trim();

  const visibleUnis = useMemo(() => {
    if (!q) return uniNodes;
    return uniNodes.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.departments.some((d) => d.toLowerCase().includes(q)),
    );
  }, [q, uniNodes]);

  return (
    <>
      {/* Search box */}
      <div className="px-3 pt-4 pb-2 shrink-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
          机构层级
        </p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索高校或院系..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-transparent placeholder-gray-400"
          />
          {sidebarSearch && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tree items */}
      <nav className="space-y-0.5 px-3">
        <button
          onClick={() => onSelectUni(null)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
            !activeUni && !activeDept
              ? "bg-primary-50 text-primary-700 font-medium"
              : "text-gray-600 hover:bg-gray-50",
          )}
        >
          <Building2 className="w-4 h-4 shrink-0 text-gray-400" />
          <span>全部院校</span>
          <span className="ml-auto text-[10px] text-gray-400">{totalCount}</span>
        </button>

        {visibleUnis.map((uni) => {
          const expanded = q ? true : expandedUnis.has(uni.name);
          const isUniActive = activeUni === uni.name && !activeDept;
          const visibleDepts = q
            ? uni.departments.filter((d) => d.toLowerCase().includes(q))
            : uni.departments;

          return (
            <div key={uni.name}>
              <div className="flex items-center">
                <button
                  onClick={() => toggleUni(uni.name)}
                  className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
                >
                  {expanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => onSelectUni(uni.name)}
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
                    {uni.count}
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
                    {visibleDepts.map((dept) => (
                      <div key={dept} className="flex items-center my-0.5">
                        <button
                          onClick={() => onSelectDept(uni.name, dept)}
                          className={cn(
                            "flex-1 flex items-center gap-2 px-2 py-1 rounded-md transition-colors min-w-0",
                            activeDept === dept && activeUni === uni.name
                              ? "bg-primary-50 text-primary-700 font-medium"
                              : "text-gray-600 hover:bg-gray-50",
                          )}
                        >
                          <BookOpen className="w-3 h-3 shrink-0 text-gray-300" />
                          <span className="truncate text-xs">{dept}</span>
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </>
  );
}
