import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Plus,
  List,
  LayoutGrid,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { ScholarCard } from "@/components/common/ScholarCard";
import { ScholarTable } from "@/components/common/ScholarTable";
import {
  UniversitySidebarTree,
} from "@/components/common/UniversitySidebarTree";
import { UniversitySidebarSkeleton } from "@/components/common/UniversitySidebarSkeleton";
import { useScholarList } from "@/hooks/useScholarList";

type ViewMode = "list" | "grid";

export default function ScholarListPage() {
  const location = useLocation();
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const {
    uniNodes,
    totalCount,
    uniLoading,
    uniError,
    activeUni,
    activeDept,
    handleSelectUni,
    handleSelectDept,
    query,
    setQuery,
    filterChips,
    hasAnyFilter,
    clearAll,
    items,
    page,
    setPage,
    totalPages,
    total,
    isLoading,
    error,
    deletingHash,
    handleDeleteFaculty,
  } = useScholarList();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0 hidden md:flex overflow-hidden">
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

          <div className="flex-1 overflow-y-auto custom-scrollbar py-1 pb-4">
            {uniLoading ? (
              <UniversitySidebarSkeleton />
            ) : uniError ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
                <p className="text-xs text-red-600 text-center">加载失败</p>
                <p className="text-[10px] text-gray-400 mt-1 text-center">
                  {uniError}
                </p>
              </div>
            ) : uniNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">暂无高校数据</p>
              </div>
            ) : (
              <UniversitySidebarTree
                sidebarSearch={sidebarSearch}
                activeUni={activeUni}
                activeDept={activeDept}
                onSelectUni={handleSelectUni}
                onSelectDept={handleSelectDept}
                uniNodes={uniNodes}
                totalCount={totalCount}
                onSearchChange={setSidebarSearch}
              />
            )}
          </div>

          <div className="p-3 border-t border-gray-100 shrink-0">
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-2.5">
              <p className="text-[10px] font-semibold text-primary-600 mb-1">
                数据库状态
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    totalCount > 0
                      ? "bg-emerald-500"
                      : "bg-amber-500 animate-pulse",
                  )}
                />
                {totalCount > 0
                  ? `已收录 ${totalCount} 位师资`
                  : "数据加载中..."}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
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
                  <span className="font-medium text-gray-700">{total}</span>{" "}
                  位学者
                  {(activeUni || activeDept) && (
                    <span className="text-gray-400">
                      {" "}
                      · {activeDept ?? activeUni}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
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

                <Link
                  to="/scholars/add"
                  className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  添加学者
                </Link>
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
                </motion.div>
              )}
            </AnimatePresence>

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
                {items.length === 0 ? (
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
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ScholarTable
                      items={items}
                      locationState={{ from: location }}
                      deletingHash={deletingHash}
                      onDelete={handleDeleteFaculty}
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
                      {items.map((s, i) => (
                        <ScholarCard
                          key={s.url_hash}
                          scholar={s}
                          index={i}
                          state={{ from: location }}
                          onDelete={handleDeleteFaculty}
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
                          compact={true}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
