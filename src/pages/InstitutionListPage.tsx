import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useInstitutions } from "@/hooks/useInstitutions";
import { InstitutionCard } from "@/components/institution/InstitutionCard";

export default function InstitutionListPage() {
  const { institutions, pagination, loading, error, loadPage } =
    useInstitutions(20);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = institutions.filter(
    (inst) =>
      inst.name.includes(searchQuery) ||
      inst.org_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    setSearchQuery("");
  }, [pagination.page]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      {/* ── Hero header ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 md:px-10 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Title row */}
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-blue-400 text-xs font-semibold tracking-widest uppercase">
                  Institution Database
                </span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                机构库
              </h1>
              <p className="text-slate-400 text-sm mt-1.5">
                收录{" "}
                <span className="font-bold text-white text-base">
                  {pagination.total}
                </span>{" "}
                所高校及科研机构
                {error && (
                  <span className="text-red-400 ml-2 text-xs">({error})</span>
                )}
              </p>
            </div>

            {pagination.total_pages > 1 && (
              <div className="shrink-0 pb-1">
                <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                  第 {pagination.page} / {pagination.total_pages} 页
                </span>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索机构名称或英文名..."
              className="w-full pl-11 pr-10 py-3 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-3 h-3 text-slate-300" />
              </button>
            )}
          </div>

          {searchQuery && (
            <p className="text-xs text-slate-400 mt-2.5">
              找到{" "}
              <span className="font-semibold text-white">{filtered.length}</span>{" "}
              条结果
            </p>
          )}
        </motion.div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 md:px-10 py-7">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((institution, index) => (
              <InstitutionCard
                key={institution.id}
                institution={institution}
                index={index}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold">未找到匹配的机构</p>
            <p className="text-slate-400 text-sm mt-1">尝试修改搜索关键词</p>
          </motion.div>
        )}

        {/* ── Pagination ── */}
        {pagination.total_pages > 1 && !searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-10"
          >
            <button
              onClick={() => loadPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pagination.total_pages ||
                    Math.abs(p - pagination.page) <= 1,
                )
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "…" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-1 text-slate-400 text-sm"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => loadPage(item as number)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                        item === pagination.page
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
            </div>

            <button
              onClick={() => loadPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              下一页
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
