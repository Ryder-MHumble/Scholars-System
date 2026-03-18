import { useState, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, List, LayoutGrid } from "lucide-react";
import { cn } from "@/utils/cn";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { ScholarCard } from "@/components/common/ScholarCard";
import { ScholarTable } from "@/components/common/ScholarTable";
import { ProjectCategoryTree } from "@/components/project/ProjectCategoryTree";
import { useScholarList } from "@/hooks/useScholarList";
import type {
  ProjectCategory,
  ProjectSubcategory,
} from "@/constants/projectCategories";

type ViewMode = "list" | "grid";

export default function ProjectListPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const activeCategory = searchParams.get("category") as ProjectCategory | null;
  const activeSubcategory = searchParams.get(
    "subcategory",
  ) as ProjectSubcategory | null;

  const {
    setQuery,
    searchInput,
    setSearchInput,
    items,
    page,
    setPage,
    totalPages,
    total,
    isLoading,
    error,
    deletingHash,
    handleDeleteScholar,
  } = useScholarList();

  // Filter scholars by selected category/subcategory
  const filteredScholars = useMemo(() => {
    if (!activeCategory && !activeSubcategory) {
      // Show all scholars with any project category
      return items.filter(
        (scholar) =>
          scholar.project_category ||
          scholar.project_subcategory ||
          scholar.adjunct_supervisor?.status,
      );
    }

    if (activeSubcategory) {
      // Filter by specific subcategory
      return items.filter((scholar) => {
        // Special handling for "兼职导师" - include scholars with adjunct_supervisor
        if (activeCategory === "教育培养" && activeSubcategory === "兼职导师") {
          return (
            scholar.project_subcategory === activeSubcategory ||
            scholar.adjunct_supervisor?.status
          );
        }
        return scholar.project_subcategory === activeSubcategory;
      });
    }

    if (activeCategory) {
      // Filter by primary category
      return items.filter(
        (scholar) => scholar.project_category === activeCategory,
      );
    }

    return items;
  }, [items, activeCategory, activeSubcategory]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    items.forEach((scholar) => {
      // Count scholars with adjunct_supervisor as "教育培养-兼职导师"
      if (scholar.adjunct_supervisor?.status) {
        const key = "教育培养-兼职导师";
        counts[key] = (counts[key] || 0) + 1;
      }

      // Count scholars by their project category/subcategory
      if (scholar.project_category && scholar.project_subcategory) {
        const key = `${scholar.project_category}-${scholar.project_subcategory}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return counts;
  }, [items]);

  const handleSelectCategory = (category: ProjectCategory | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (category) {
      newParams.set("category", category);
      newParams.delete("subcategory");
    } else {
      newParams.delete("category");
      newParams.delete("subcategory");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleSelectSubcategory = (
    category: ProjectCategory,
    subcategory: ProjectSubcategory,
  ) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("category", category);
    newParams.set("subcategory", subcategory);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  return (
    <div className="h-full overflow-hidden flex bg-gray-50">
      {/* Category tree sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col overflow-hidden">
        <ProjectCategoryTree
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          onSelectCategory={handleSelectCategory}
          onSelectSubcategory={handleSelectSubcategory}
          categoryCounts={categoryCounts}
          loading={isLoading}
        />
      </div>

      {/* Scholar list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-6 md:p-8"
        >
          {/* Header */}
          <div className="mb-6">
            {/* Title Row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">项目分类</h2>
                <p className="text-sm text-gray-500 mt-1">
                  共{" "}
                  <span className="font-semibold text-gray-700">
                    {filteredScholars.length}
                  </span>{" "}
                  位学者
                </p>
              </div>
            </div>

            {/* Search and Actions Bar */}
            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setQuery(searchInput);
                    }
                  }}
                  placeholder="搜索学者、研究方向（按回车搜索）"
                  className="w-full h-10 pl-10 pr-4 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center h-10 bg-white border border-gray-200 rounded-lg p-0.5">
                {(["list", "grid"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "flex items-center justify-center w-9 h-full rounded-md transition-all",
                      viewMode === mode
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50",
                    )}
                    title={mode === "list" ? "列表视图" : "卡片视图"}
                  >
                    {mode === "list" ? (
                      <List className="w-[18px] h-[18px]" />
                    ) : (
                      <LayoutGrid className="w-[18px] h-[18px]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="bg-white rounded-xl border border-red-100 flex flex-col items-center justify-center py-16 text-red-400">
              <p className="text-sm">{error}</p>
              <button
                onClick={() => setPage(1)}
                className="mt-3 text-xs text-primary-600 hover:underline"
              >
                重试
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {filteredScholars.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-24 text-gray-400"
                >
                  <Search className="w-12 h-12 mb-3 opacity-25" />
                  <p className="text-sm">未找到匹配的学者</p>
                </motion.div>
              ) : viewMode === "list" ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <ScholarTable
                    items={filteredScholars}
                    locationState={{ from: location }}
                    deletingHash={deletingHash}
                    onDelete={handleDeleteScholar}
                  />
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={total}
                    onPageChange={setPage}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredScholars.map((s, i) => (
                      <ScholarCard
                        key={s.url_hash}
                        scholar={s}
                        index={i}
                        state={{ from: location }}
                        onDelete={handleDeleteScholar}
                        isDeleting={deletingHash === s.url_hash}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        totalItems={total}
                        onPageChange={setPage}
                        compact
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}
