import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, LayoutGrid, List, Filter, X, FileText } from "lucide-react";
import PageTransition from "@/layouts/PageTransition";
import { scholars } from "@/data/scholars";
import { universities } from "@/data/universities";
import { cn } from "@/utils/cn";
import { getAvatarColor, getInitial } from "@/utils/avatar";

const PAGE_SIZE = 12;

export default function ScholarListPage() {
  const [query, setQuery] = useState("");
  const [uniFilter, setUniFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = scholars;
    if (uniFilter) result = result.filter((s) => s.universityId === uniFilter);
    if (titleFilter) result = result.filter((s) => s.title === titleFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
          s.researchFields.some((f) => f.includes(q)),
      );
    }
    return result;
  }, [query, uniFilter, titleFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setQuery("");
    setUniFilter("");
    setTitleFilter("");
    setPage(1);
  };
  const hasFilters = query || uniFilter || titleFilter;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">学者目录</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              共 {filtered.length} 位学者
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="搜索学者姓名、研究方向..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2",
                  viewMode === "grid"
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-400 hover:bg-gray-50",
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2",
                  viewMode === "list"
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-400 hover:bg-gray-50",
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={uniFilter}
            onChange={(e) => {
              setUniFilter(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:border-primary-300"
          >
            <option value="">全部院校</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <select
            value={titleFilter}
            onChange={(e) => {
              setTitleFilter(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:border-primary-300"
          >
            <option value="">全部职称</option>
            {[
              "教授",
              "副教授",
              "助理教授",
              "研究员",
              "副研究员",
              "助理研究员",
              "讲师",
              "博士后",
            ].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> 清除筛选
            </button>
          )}
        </div>

        {/* Grid */}
        {paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Search className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">未找到匹配的学者</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paged.map((s, i) => {
              const uni = universities.find((u) => u.id === s.universityId);
              const dept = uni?.departments.find(
                (d) => d.id === s.departmentId,
              );
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                  <Link
                    to={`/scholars/${s.id}`}
                    className="block bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-primary-200 hover:scale-[1.02] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                        style={{ backgroundColor: getAvatarColor(s.name) }}
                      >
                        {getInitial(s.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900">
                          {s.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {uni?.shortName}
                          {dept ? ` · ${dept.name}` : ""} · {s.title}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {s.researchFields.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    {(s.hIndex || s.paperCount) && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50 text-xs text-gray-400">
                        {s.hIndex && (
                          <span>
                            h-index:{" "}
                            <span className="text-gray-600 font-medium">
                              {s.hIndex}
                            </span>
                          </span>
                        )}
                        {s.paperCount && (
                          <span>
                            <FileText className="w-3 h-3 inline mr-0.5" />
                            {s.paperCount}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="text-left py-3 px-4 font-medium">姓名</th>
                  <th className="text-left py-3 px-4 font-medium">院校/院系</th>
                  <th className="text-left py-3 px-4 font-medium">职称</th>
                  <th className="text-left py-3 px-4 font-medium">研究方向</th>
                  <th className="text-right py-3 px-4 font-medium">h-index</th>
                  <th className="text-right py-3 px-4 font-medium">论文数</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((s) => {
                  const uni = universities.find((u) => u.id === s.universityId);
                  const dept = uni?.departments.find(
                    (d) => d.id === s.departmentId,
                  );
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <Link
                          to={`/scholars/${s.id}`}
                          className="flex items-center gap-2 group"
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: getAvatarColor(s.name) }}
                          >
                            {getInitial(s.name)}
                          </div>
                          <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                            {s.name}
                          </span>
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-500">
                        {uni?.shortName} · {dept?.name}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-500">
                        {s.title}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {s.researchFields.slice(0, 2).map((f) => (
                            <span
                              key={f}
                              className="text-xs bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-600 text-right font-medium">
                        {s.hIndex ?? "-"}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-600 text-right">
                        {s.paperCount ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "w-8 h-8 text-sm rounded-lg",
                  p === page
                    ? "bg-primary-500 text-white"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
