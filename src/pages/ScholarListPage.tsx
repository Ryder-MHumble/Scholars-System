import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  List,
  LayoutGrid,
  FileSpreadsheet,
  Handshake,
  Download,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { FilterChips } from "@/components/common/FilterChips";
import { Pagination } from "@/components/common/Pagination";
import { ScholarCard } from "@/components/common/ScholarCard";
import { ScholarTable } from "@/components/common/ScholarTable";
import { BatchScholarImportModal } from "@/components/scholar/BatchScholarImportModal";
import { InstitutionFilterPanel } from "@/components/scholar/InstitutionFilterPanel";
import { useScholarList } from "@/hooks/useScholarList";

type ViewMode = "list" | "grid";

export default function ScholarListPage() {
  const location = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showBatchImportModal, setShowBatchImportModal] = useState(false);

  const {
    filteredUniNodes,
    uniLoading,
    activeUni,
    activeDept,
    handleSelectUni,
    handleSelectDept,
    setQuery,
    searchInput,
    setSearchInput,
    filterChips,
    hasAnyFilter,
    clearAll,
    isJointMentor,
    handleToggleJointMentor,
    items,
    page,
    setPage,
    totalPages,
    total,
    isLoading,
    error,
    refreshList,
    deletingHash,
    handleDeleteScholar,
    handleExportToExcel,
    isExporting,
  } = useScholarList();

  const filteredTotalCount = useMemo(
    () => filteredUniNodes.reduce((sum, u) => sum + u.count, 0),
    [filteredUniNodes],
  );

  useEffect(() => {
    const returnTo = `${location.pathname}${location.search || "?tab=scholars"}`;
    window.sessionStorage.setItem("scholar_list_return_to", returnTo);
  }, [location.pathname, location.search]);

  return (
    <div className="h-full overflow-hidden flex bg-gray-50">
      {/* Institution filter sidebar */}
      <div className="w-56 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col overflow-hidden">
        <InstitutionFilterPanel
          uniNodes={filteredUniNodes}
          totalCount={filteredTotalCount}
          activeUni={activeUni}
          activeDept={activeDept}
          onSelectUni={handleSelectUni}
          onSelectDept={handleSelectDept}
          loading={uniLoading}
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
                <h2 className="text-2xl font-bold text-gray-900">
                  学者信息管理
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  共{" "}
                  <span className="font-semibold text-gray-700">{total}</span>{" "}
                  位学者
                </p>
              </div>

              <Link
                to="/scholars/add"
                state={{ from: location }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                添加学者
              </Link>
            </div>

            {/* Search and Actions Bar */}
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                  className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Action Buttons Group */}
              <div className="flex items-center gap-2">
                {/* Joint Mentor Filter */}
                <button
                  onClick={handleToggleJointMentor}
                  className={cn(
                    "flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    isJointMentor
                      ? "bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                      : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
                  )}
                >
                  <Handshake className="w-4 h-4" />
                  <span>共建导师</span>
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200" />

                {/* View Mode Toggle */}
                <div className="flex items-center h-10 bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {(["list", "grid"] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        "flex items-center justify-center w-10 h-full transition-all border-r border-gray-200 last:border-r-0",
                        viewMode === mode
                          ? "bg-gray-50 text-gray-900"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50",
                      )}
                      title={mode === "list" ? "列表视图" : "卡片视图"}
                    >
                      {mode === "list" ? (
                        <List className="w-4 h-4" />
                      ) : (
                        <LayoutGrid className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200" />

                {/* Batch Import */}
                <button
                  onClick={() => setShowBatchImportModal(true)}
                  className="flex items-center gap-1.5 h-10 px-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                  title="批量导入学者数据"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>批量添加</span>
                </button>

                {/* Export to Excel */}
                <button
                  onClick={handleExportToExcel}
                  disabled={total === 0 || isExporting}
                  className={cn(
                    "flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    total === 0 || isExporting
                      ? "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                      : "bg-white hover:bg-gray-50 border border-gray-200 text-gray-700",
                  )}
                  title={
                    total === 0
                      ? "暂无数据可导出"
                      : isExporting
                        ? "正在导出..."
                        : "导出当前筛选条件下的所有学者数据"
                  }
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      <span>导出中...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>导出Excel</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Chips */}
            {filterChips.length > 0 && (
              <div className="mt-3">
                <FilterChips chips={filterChips} onClearAll={clearAll} />
              </div>
            )}
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
                    {items.map((s, i) => (
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

      <BatchScholarImportModal
        isOpen={showBatchImportModal}
        onClose={() => setShowBatchImportModal(false)}
        onSuccess={() => {
          refreshList();
          setPage(1);
        }}
      />
    </div>
  );
}
