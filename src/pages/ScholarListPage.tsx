import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Eye,
  Plus,
  List,
  LayoutGrid,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  fetchFacultyList,
  deleteFaculty,
  type FacultyListResponse,
} from "@/services/facultyApi";
import { cn } from "@/utils/cn";
import { getAvatarColor, getInitial } from "@/utils/avatar";
import { AcademicianBadge } from "@/components/common/AcademicianBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { ScholarCard } from "@/components/common/ScholarCard";
import {
  UniversitySidebarTree,
  type UniNode,
} from "@/components/common/UniversitySidebarTree";
import { UniversitySidebarSkeleton } from "@/components/common/UniversitySidebarSkeleton";
import { useUniversityCounts } from "@/hooks/useUniversityCounts";

const PAGE_SIZE = 20;

type ViewMode = "list" | "grid";

/* ── main component ── */
export default function ScholarListPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const activeUni = searchParams.get("university");
  const activeDept = searchParams.get("department");
  const pageParam = searchParams.get("page");

  const [sidebarSearch, setSidebarSearch] = useState("");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(pageParam ? parseInt(pageParam, 10) : 1);

  /* API state */
  const [apiData, setApiData] = useState<FacultyListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingHash, setDeletingHash] = useState<string | null>(null);

  /* Get dynamic universities and counts from API */
  const {
    universities,
    totalCount,
    loading: uniLoading,
    error: uniError,
  } = useUniversityCounts();

  /* Build sidebar nodes from real API data */
  const uniNodes = useMemo<UniNode[]>(() => {
    return universities.map((uni) => ({
      name: uni.name,
      departments: Object.entries(uni.departments).map(([name, count]) => ({
        name,
        count,
      })),
      count: uni.count,
    }));
  }, [universities]);

  /* Load paginated data based on filters */
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchFacultyList(page, PAGE_SIZE, {
      university: activeUni ?? undefined,
      department: activeDept ?? undefined,
      search: query.trim() || undefined,
    })
      .then((res) => {
        setApiData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "加载失败");
        setIsLoading(false);
      });
  }, [page, activeUni, activeDept, query]);

  const handleSelectUni = (name: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (name) {
      newParams.set("university", name);
      newParams.delete("department");
    } else {
      newParams.delete("university");
      newParams.delete("department");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleSelectDept = (uniName: string, deptName: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("university", uniName);
    newParams.set("department", deptName);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const clearAll = () => {
    setQuery("");
    const newParams = new URLSearchParams();
    setSearchParams(newParams);
  };

  const handleDeleteFaculty = async (urlHash: string, name: string) => {
    if (!window.confirm(`确定要删除 ${name} 吗？此操作不可撤销。`)) {
      return;
    }

    setDeletingHash(urlHash);
    try {
      await deleteFaculty(urlHash);
      // Refresh the list after deletion
      setIsLoading(true);
      fetchFacultyList(1, PAGE_SIZE, {
        university: activeUni ?? undefined,
        department: activeDept ?? undefined,
        search: query.trim() || undefined,
      })
        .then((res) => {
          setApiData(res);
          setPage(1);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message ?? "刷新失败");
          setIsLoading(false);
        });
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
      setDeletingHash(null);
    } finally {
      setDeletingHash(null);
    }
  };

  /* Use API results directly (server-side search) */
  const items = apiData?.items ?? [];
  const filtered = items;

  // Update page in URL when it changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", String(page));
    }
    setSearchParams(newParams, { replace: true });
  }, [page, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const filterChips: { label: string; onRemove: () => void }[] = [
    ...(activeUni
      ? [{ label: activeUni, onRemove: () => handleSelectUni(null) }]
      : []),
    ...(activeDept
      ? [
          {
            label: activeDept,
            onRemove: () => handleSelectUni(activeUni),
          },
        ]
      : []),
  ].filter((c) => c.label);

  const hasAnyFilter = filterChips.length > 0 || query;

  const serverTotalPages = apiData?.total_pages ?? 1;
  const serverTotal = apiData?.total ?? 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar ── */}
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
                    {serverTotal}
                  </span>{" "}
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
                                称号
                              </th>
                              <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                                操作
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filtered.map((s, i) => (
                              <motion.tr
                                key={s.url_hash}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.015 }}
                                className="group hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-5 py-3.5">
                                  <Link
                                    to={`/scholars/${s.url_hash}`}
                                    state={{ from: location }}
                                    className="flex items-center gap-3"
                                  >
                                    {s.photo_url ? (
                                      <img
                                        src={s.photo_url}
                                        alt={s.name}
                                        className="w-9 h-9 rounded-full object-cover shrink-0"
                                      />
                                    ) : (
                                      <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                                        style={{
                                          backgroundColor: getAvatarColor(
                                            s.name,
                                          ),
                                        }}
                                      >
                                        {getInitial(s.name)}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                          {s.name}
                                        </p>
                                        <AcademicianBadge
                                          isAcademician={s.is_academician}
                                          academicTitles={s.academic_titles}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {s.position || "—"}
                                      </p>
                                    </div>
                                  </Link>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="min-w-0">
                                    <p className="text-sm text-gray-800 font-medium truncate">
                                      {s.university || "—"}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {s.department || "—"}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {s.research_areas.slice(0, 2).map((f) => (
                                      <span
                                        key={f}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200"
                                      >
                                        {f}
                                      </span>
                                    ))}
                                    {s.research_areas.length > 2 && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                        +{s.research_areas.length - 2}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex flex-wrap gap-1 max-w-[160px]">
                                    {s.academic_titles.slice(0, 2).map((t) => (
                                      <span
                                        key={t}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                    {s.academic_titles.length === 0 && (
                                      <span className="text-xs text-gray-400">
                                        —
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Link
                                      to={`/scholars/${s.url_hash}`}
                                      state={{ from: location }}
                                      className="inline-flex text-gray-400 hover:text-primary-600 transition-colors p-1"
                                      title="查看详情"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Link>
                                    <button
                                      onClick={() =>
                                        handleDeleteFaculty(s.url_hash, s.name)
                                      }
                                      disabled={deletingHash === s.url_hash}
                                      className="inline-flex text-gray-400 hover:text-red-600 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="删除学者"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <Pagination
                        page={page}
                        totalPages={serverTotalPages}
                        totalItems={serverTotal}
                        onPageChange={setPage}
                      />
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
                      {filtered.map((s, i) => (
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

                    {serverTotalPages > 1 && (
                      <div className="mt-6">
                        <Pagination
                          page={page}
                          totalPages={serverTotalPages}
                          totalItems={serverTotal}
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
