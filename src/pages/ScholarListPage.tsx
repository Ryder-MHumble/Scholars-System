import { useState, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Plus,
  List,
  LayoutGrid,
  FileSpreadsheet,
  Handshake,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { ScholarCard } from "@/components/common/ScholarCard";
import { ScholarTable } from "@/components/common/ScholarTable";
import { BatchScholarImportModal } from "@/components/scholar/BatchScholarImportModal";
import { isInstitutionBrowserSubtab } from "@/components/common/InstitutionBrowser";
import { UniversitySidebarTree } from "@/components/common/UniversitySidebarTree";
import { useScholarList } from "@/hooks/useScholarList";
import {
  classifyInstitutionType,
  classifyInstitutionRegion,
  INSTITUTION_TYPES,
  INSTITUTION_REGIONS,
} from "@/utils/institutionClassifier";

type ViewMode = "list" | "grid";

export default function ScholarListPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showBatchImportModal, setShowBatchImportModal] = useState(false);

  const {
    activeUni,
    activeDept,
    uniNodes,
    uniLoading,
    handleSelectUni,
    handleSelectDept,
    query,
    setQuery,
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
  } = useScholarList();

  const subtab = searchParams.get("subtab");
  const showSidebar = isInstitutionBrowserSubtab(subtab);

  // Subtab filter mapping
  const SUBTAB_FILTER: Record<string, { region?: string; type?: string }> = {
    domestic: { region: INSTITUTION_REGIONS.DOMESTIC },
    domestic_university: { region: INSTITUTION_REGIONS.DOMESTIC, type: INSTITUTION_TYPES.UNIVERSITY },
    domestic_company: { region: INSTITUTION_REGIONS.DOMESTIC, type: INSTITUTION_TYPES.COMPANY },
    domestic_research: { region: INSTITUTION_REGIONS.DOMESTIC, type: INSTITUTION_TYPES.RESEARCH_INSTITUTE },
    domestic_other: { region: INSTITUTION_REGIONS.DOMESTIC, type: INSTITUTION_TYPES.OTHER },
    international: { region: INSTITUTION_REGIONS.INTERNATIONAL },
    intl_university: { region: INSTITUTION_REGIONS.INTERNATIONAL, type: INSTITUTION_TYPES.UNIVERSITY },
    intl_company: { region: INSTITUTION_REGIONS.INTERNATIONAL, type: INSTITUTION_TYPES.COMPANY },
    intl_research: { region: INSTITUTION_REGIONS.INTERNATIONAL, type: INSTITUTION_TYPES.RESEARCH_INSTITUTE },
    intl_other: { region: INSTITUTION_REGIONS.INTERNATIONAL, type: INSTITUTION_TYPES.OTHER },
  };

  // Filter uniNodes by subtab's region/type
  const filteredUniNodes = useMemo(() => {
    if (!subtab || !SUBTAB_FILTER[subtab]) return uniNodes;
    const filter = SUBTAB_FILTER[subtab];
    return uniNodes.filter((uni) => {
      const region = classifyInstitutionRegion(uni.name);
      const type = classifyInstitutionType(uni.name);
      if (filter.region && region !== filter.region) return false;
      if (filter.type && type !== filter.type) return false;
      return true;
    });
  }, [uniNodes, subtab]);

  const filteredTotalCount = useMemo(
    () => filteredUniNodes.reduce((sum, u) => sum + u.count, 0),
    [filteredUniNodes],
  );

  const [sidebarSearch, setSidebarSearch] = useState("");

  return (
    <div className="h-full flex overflow-hidden bg-gray-50">
      {/* Institution sidebar */}
      {showSidebar && (
        <aside className="w-72 bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden">
          <div className="px-3 pt-4 pb-3 shrink-0 border-b border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-2">
              机构筛选
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="搜索高校/院系..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all duration-150 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
            {uniLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : (
              <UniversitySidebarTree
                sidebarSearch={sidebarSearch}
                activeUni={activeUni}
                activeDept={activeDept}
                onSelectUni={handleSelectUni}
                onSelectDept={handleSelectDept}
                uniNodes={filteredUniNodes}
                totalCount={filteredTotalCount}
                onSearchChange={setSidebarSearch}
              />
            )}
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="p-6 md:p-8"
      >
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">学者信息管理</h2>
            <p className="text-sm text-gray-500 mt-1">
              共 <span className="font-semibold text-gray-700">{total}</span>{" "}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索学者、研究方向..."
                className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all duration-150 placeholder-gray-400 shadow-sm"
              />
            </div>

            {/* Joint mentor quick filter */}
            <button
              onClick={handleToggleJointMentor}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 shadow-sm border",
                isJointMentor
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                  : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700",
              )}
              title="筛选共建导师"
            >
              <Handshake className="w-4 h-4" />
              共建导师
            </button>

            {/* Segmented view toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
                  viewMode === "list"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
                title="列表视图"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
                  viewMode === "grid"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
                title="卡片视图"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <div className="h-8 w-px bg-gray-200" />

            <button
              onClick={() => setShowBatchImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all duration-150 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              批量添加
            </button>

            <Link
              to="/scholars/add"
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg text-sm font-medium transition-all duration-150 shadow-sm hover:shadow"
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
              className="flex items-center gap-2 flex-wrap mb-5"
            >
              <span className="text-xs font-medium text-gray-500">
                筛选条件:
              </span>
              {filterChips.map((chip) => (
                <motion.span
                  key={chip.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-medium"
                >
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    className="hover:text-primary-900 hover:bg-primary-100 rounded-full p-0.5 transition-colors duration-150"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
              {filterChips.length > 1 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 hover:text-gray-700 underline ml-1"
                >
                  清除全部
                </button>
              )}
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
                      compact={true}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Batch Import Modal */}
      <BatchScholarImportModal
        isOpen={showBatchImportModal}
        onClose={() => setShowBatchImportModal(false)}
        onSuccess={() => {
          refreshList();
          setPage(1);
        }}
      />
      </div>
    </div>
  );
}
