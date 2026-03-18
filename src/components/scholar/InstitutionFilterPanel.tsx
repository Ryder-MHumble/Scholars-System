import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Building2, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/utils/cn";
import type { UniNode } from "@/components/common/UniversitySidebarTree";

interface InstitutionFilterPanelProps {
  uniNodes: UniNode[];
  totalCount: number;
  activeUni: string | null;
  activeDept: string | null;
  onSelectUni: (name: string | null) => void;
  onSelectDept: (uniName: string, deptName: string) => void;
  loading: boolean;
}

export function InstitutionFilterPanel({
  uniNodes,
  totalCount,
  activeUni,
  activeDept,
  onSelectUni,
  onSelectDept,
  loading,
}: InstitutionFilterPanelProps) {
  const [panelSearch, setPanelSearch] = useState("");
  const [expandedUnis, setExpandedUnis] = useState<Set<string>>(new Set());

  const toggleUni = (name: string) =>
    setExpandedUnis((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const q = panelSearch.toLowerCase().trim();

  const filteredNodes = useMemo(() => {
    let nodes = uniNodes;

    // Apply search filter
    if (q) {
      nodes = nodes.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.departments.some((d) => d.name.toLowerCase().includes(q)),
      );
    }

    // Sort alphabetically by Chinese name
    return nodes.slice().sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  }, [uniNodes, q]);

  const isAllActive = !activeUni && !activeDept;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={panelSearch}
            onChange={(e) => setPanelSearch(e.target.value)}
            placeholder="搜索高校/院系..."
            className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
          />
          {panelSearch && (
            <button
              onClick={() => setPanelSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Institution list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-1 px-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* 全部 */}
            <button
              onClick={() => onSelectUni(null)}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm transition-all duration-150 mb-0.5",
                isAllActive
                  ? "bg-primary-600 text-white shadow-sm font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800 font-medium",
              )}
            >
              <Building2
                className={cn(
                  "w-3.5 h-3.5 shrink-0",
                  isAllActive ? "text-white/80" : "text-gray-400",
                )}
              />
              <span className="flex-1 text-left truncate text-sm">全部</span>
              <span
                className={cn(
                  "text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded-md tabular-nums",
                  isAllActive
                    ? "bg-white/20 text-white"
                    : "text-gray-400 bg-gray-100",
                )}
              >
                {totalCount}
              </span>
            </button>

            {filteredNodes.map((uni) => {
              const expanded = q ? true : expandedUnis.has(uni.name);
              const isUniActive = activeUni === uni.name && !activeDept;

              // Filter and sort departments alphabetically
              const visibleDepts = (
                q
                  ? uni.departments.filter((d) =>
                      d.name.toLowerCase().includes(q),
                    )
                  : uni.departments
              )
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

              return (
                <div key={uni.name}>
                  <div className="flex items-center gap-0.5">
                    {uni.departments.length > 0 ? (
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
                          <ChevronRight className="w-3 h-3" />
                        </motion.div>
                      </button>
                    ) : (
                      <span className="w-5 shrink-0" />
                    )}
                    <button
                      onClick={() => {
                        onSelectUni(uni.name);
                        if (
                          uni.departments.length > 0 &&
                          !expandedUnis.has(uni.name)
                        ) {
                          toggleUni(uni.name);
                        }
                      }}
                      className={cn(
                        "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm transition-all duration-150 min-w-0",
                        isUniActive
                          ? "bg-primary-600 text-white shadow-sm font-medium"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
                      )}
                    >
                      <span className="truncate text-sm flex-1 text-left">
                        {uni.name}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded-md tabular-nums",
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
                    {expanded && visibleDepts.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="overflow-hidden ml-8 space-y-px mt-0.5 mb-0.5"
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
                                  "w-3 h-3 shrink-0",
                                  isDeptActive
                                    ? "text-primary-500"
                                    : "text-gray-300",
                                )}
                              />
                              <span className="truncate text-xs flex-1 text-left">
                                {dept.name}
                              </span>
                              {dept.count > 0 && (
                                <span
                                  className={cn(
                                    "text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded-md tabular-nums",
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

            {filteredNodes.length === 0 && panelSearch && (
              <p className="text-xs text-gray-400 text-center py-6">
                未找到匹配的机构
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
