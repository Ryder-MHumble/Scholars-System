/**
 * 高校-院系树形侧边栏组件
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  ChevronRight as ChevronRightIcon,
  Building2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface DeptNode {
  name: string;
  count: number;
}

export interface UniNode {
  name: string;
  departments: DeptNode[];
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
  onSearchChange: _onSearchChange,
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
        u.departments.some((d) => d.name.toLowerCase().includes(q)),
    );
  }, [q, uniNodes]);

  const isAllActive = !activeUni && !activeDept;

  return (
    <nav className="space-y-px px-2 pt-1">
      {/* 全部院校 */}
      <button
        onClick={() => onSelectUni(null)}
        className={cn(
          "w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm transition-all duration-150",
          isAllActive
            ? "bg-primary-600 text-white shadow-sm font-medium"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-800 font-medium",
        )}
      >
        <Building2
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-colors duration-150",
            isAllActive ? "text-white/80" : "text-gray-400",
          )}
        />
        <span className="flex-1 text-left truncate text-sm">全部院校</span>
        <span
          className={cn(
            "text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded-md transition-colors duration-150 tabular-nums",
            isAllActive
              ? "bg-white/20 text-white"
              : "text-gray-400 bg-gray-100",
          )}
        >
          {totalCount}
        </span>
      </button>

      {visibleUnis.map((uni) => {
        const expanded = q ? true : expandedUnis.has(uni.name);
        const isUniActive = activeUni === uni.name && !activeDept;
        const visibleDepts = q
          ? uni.departments.filter((d) => d.name.toLowerCase().includes(q))
          : uni.departments;

        return (
          <div key={uni.name}>
            <div className="flex items-center gap-0.5">
              {/* expand toggle */}
              <button
                onClick={() => toggleUni(uni.name)}
                className={cn(
                  "p-1 rounded-lg transition-all duration-150 shrink-0",
                  isUniActive
                    ? "text-primary-400 hover:bg-primary-700"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                )}
              >
                <motion.div
                  animate={{ rotate: expanded ? 90 : 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <ChevronRightIcon className="w-3 h-3" />
                </motion.div>
              </button>

              {/* university button */}
              <button
                onClick={() => {
                  onSelectUni(uni.name);
                  if (!expandedUnis.has(uni.name)) toggleUni(uni.name);
                }}
                className={cn(
                  "flex-1 flex items-center gap-2 px-2 py-2 rounded-xl text-sm transition-all duration-150 min-w-0",
                  isUniActive
                    ? "bg-primary-600 text-white shadow-sm font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
                )}
              >
                <GraduationCap
                  className={cn(
                    "w-3.5 h-3.5 shrink-0 transition-colors duration-150",
                    isUniActive ? "text-white/80" : "text-gray-400",
                  )}
                />
                <span className="truncate text-sm flex-1 text-left">{uni.name}</span>
                <span
                  className={cn(
                    "text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded-md transition-colors duration-150 tabular-nums",
                    isUniActive
                      ? "bg-white/20 text-white"
                      : "text-gray-400 bg-gray-100",
                  )}
                >
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
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="overflow-hidden ml-6 space-y-px mt-0.5 mb-0.5"
                >
                  {visibleDepts.map((dept) => {
                    const isDeptActive =
                      activeDept === dept.name && activeUni === uni.name;
                    return (
                      <button
                        key={dept.name}
                        onClick={() => onSelectDept(uni.name, dept.name)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150 min-w-0",
                          isDeptActive
                            ? "bg-primary-50 text-primary-700 font-medium"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                        )}
                      >
                        <BookOpen
                          className={cn(
                            "w-3 h-3 shrink-0 transition-colors duration-150",
                            isDeptActive ? "text-primary-500" : "text-gray-300",
                          )}
                        />
                        <span className="truncate text-xs flex-1 text-left">
                          {dept.name}
                        </span>
                        {dept.count > 0 && (
                          <span
                            className={cn(
                              "text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded-md transition-colors duration-150 tabular-nums",
                              isDeptActive
                                ? "bg-primary-100 text-primary-600"
                                : "text-gray-400 bg-gray-100",
                            )}
                          >
                            {dept.count}
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
