/**
 * 机构浏览组件 - 在主内容区展示某分类下的所有高校及院系
 * 点击高校/院系后跳转到学者列表
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Search,
  GraduationCap,
  Briefcase,
  Microscope,
  Building2,
  BookOpen,
  Users,
} from "lucide-react";
import {
  classifyInstitutionType,
  classifyInstitutionRegion,
  INSTITUTION_TYPES,
} from "@/utils/institutionClassifier";
import {
  INSTITUTION_BROWSER_SUBTAB_FILTER,
  INSTITUTION_BROWSER_SUBTAB_LABELS,
} from "@/constants/institutionBrowserSubtabs";
interface BrowserInstitution {
  name: string;
  scholarCount: number;
  departments: { name: string; scholar_count: number }[];
}

function getTypeIcon(type: string) {
  switch (type) {
    case INSTITUTION_TYPES.UNIVERSITY:
      return GraduationCap;
    case INSTITUTION_TYPES.COMPANY:
      return Briefcase;
    case INSTITUTION_TYPES.RESEARCH_INSTITUTE:
      return Microscope;
    default:
      return Building2;
  }
}

interface InstitutionBrowserProps {
  subtab: string;
  universities: BrowserInstitution[];
  loading: boolean;
  onSelectUni: (name: string) => void;
  onSelectDept: (uniName: string, deptName: string) => void;
}

export function InstitutionBrowser({
  subtab,
  universities,
  loading,
  onSelectUni,
  onSelectDept,
}: InstitutionBrowserProps) {
  const [search, setSearch] = useState("");
  const [expandedUnis, setExpandedUnis] = useState<Set<string>>(new Set());

  const filter = INSTITUTION_BROWSER_SUBTAB_FILTER[subtab];
  const label = INSTITUTION_BROWSER_SUBTAB_LABELS[subtab] ?? subtab;

  const filtered = useMemo(() => {
    if (!filter) return [];
    const q = search.toLowerCase().trim();

    return universities
      .filter((uni) => {
        const region = classifyInstitutionRegion(uni.name);
        const type = classifyInstitutionType(uni.name);
        if (filter.region && region !== filter.region) return false;
        if (filter.type && type !== filter.type) return false;
        if (q) {
          return (
            uni.name.toLowerCase().includes(q) ||
            uni.departments.some((d) => d.name.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => b.scholarCount - a.scholarCount);
  }, [universities, filter, search]);

  const totalScholars = useMemo(
    () => filtered.reduce((sum, u) => sum + u.scholarCount, 0),
    [filtered],
  );

  const toggleUni = (name: string) =>
    setExpandedUnis((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{label}</h2>
          <p className="text-sm text-gray-500 mt-1">
            共{" "}
            <span className="font-semibold text-gray-700">
              {filtered.length}
            </span>{" "}
            个机构,{" "}
            <span className="font-semibold text-gray-700">
              {totalScholars}
            </span>{" "}
            位学者
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索机构名称..."
            className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all duration-150 placeholder-gray-400 shadow-sm"
          />
        </div>
      </div>

      {/* Institution list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-24 text-gray-400">
          <Building2 className="w-12 h-12 mb-3 opacity-25" />
          <p className="text-sm">未找到匹配的机构</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((uni, i) => {
            const type = classifyInstitutionType(uni.name);
            const TypeIcon = getTypeIcon(type);
            const isExpanded = expandedUnis.has(uni.name);

            return (
              <motion.div
                key={uni.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow transition-shadow duration-150"
              >
                {/* University row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleUni(uni.name)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150 shrink-0"
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  </button>

                  <TypeIcon className="w-5 h-5 text-gray-400 shrink-0" />

                  <button
                    onClick={() => onSelectUni(uni.name)}
                    className="flex-1 text-left text-sm font-medium text-gray-800 hover:text-primary-600 transition-colors duration-150 truncate"
                  >
                    {uni.name}
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400">
                      {uni.departments.length} 个院系
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      <Users className="w-3 h-3" />
                      {uni.scholarCount}
                    </span>
                  </div>
                </div>

                {/* Departments */}
                <AnimatePresence initial={false}>
                  {isExpanded && uni.departments.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="overflow-hidden border-t border-gray-50"
                    >
                      <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                        {uni.departments
                          .sort((a, b) => b.scholar_count - a.scholar_count)
                          .map((dept) => (
                            <button
                              key={dept.name}
                              onClick={() => onSelectDept(uni.name, dept.name)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors duration-150 group"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 transition-colors shrink-0" />
                              <span className="text-xs text-gray-600 group-hover:text-gray-800 truncate flex-1">
                                {dept.name}
                              </span>
                              {dept.scholar_count > 0 && (
                                <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
                                  {dept.scholar_count}
                                </span>
                              )}
                            </button>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
