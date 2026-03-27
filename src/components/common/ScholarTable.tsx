import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Trash2 } from "lucide-react";
import type { ScholarListItem } from "@/services/scholarApi";
import { getAvatarColor, getInitial } from "@/utils/avatar";

interface ScholarTableProps {
  items: ScholarListItem[];
  locationState: unknown;
  deletingHash: string | null;
  onDelete: (urlHash: string, name: string) => void;
}

export function ScholarTable({
  items,
  locationState,
  deletingHash,
  onDelete,
}: ScholarTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/70">
                学者
              </th>
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/70">
                所属机构
              </th>
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/70">
                研究方向
              </th>
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/70">
                职称
              </th>
              <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/70 text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((s, i) => (
              <motion.tr
                key={s.url_hash}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.018,
                  duration: 0.22,
                  ease: "easeOut",
                }}
                className="group relative border-b border-gray-50 last:border-b-0 hover:bg-primary-50/40 transition-colors duration-150"
              >
                {/* 头像 + 姓名 — 左边 accent 线 */}
                <td className="px-6 py-3.5 border-l-2 border-transparent group-hover:border-primary-400 transition-colors duration-150">
                  <Link
                    to={`/scholars/${s.url_hash}`}
                    state={locationState}
                    className="flex items-center gap-3"
                  >
                    {s.photo_url ? (
                      <img
                        src={s.photo_url}
                        alt={s.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-transparent group-hover:ring-primary-200 transition-all duration-150"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-transparent group-hover:ring-primary-200 transition-all duration-150"
                        style={{ backgroundColor: getAvatarColor(s.name) }}
                      >
                        {getInitial(s.name)}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors duration-150 whitespace-nowrap">
                      {s.name}
                    </span>
                  </Link>
                </td>

                {/* 所属机构 */}
                <td className="px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 font-medium truncate max-w-[160px]">
                      {s.university || "—"}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[160px] mt-0.5">
                      {s.department || ""}
                    </p>
                  </div>
                </td>

                {/* 研究方向 */}
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {(s.research_areas ?? []).slice(0, 2).map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100 group-hover:bg-primary-100/70 transition-colors duration-150"
                      >
                        {f}
                      </span>
                    ))}
                    {(s.research_areas?.length ?? 0) > 2 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200">
                        +{s.research_areas!.length - 2}
                      </span>
                    )}
                    {!s.research_areas?.length && (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                </td>

                {/* 职称 */}
                <td className="px-5 py-3.5">
                  <span className="text-sm text-gray-600">
                    {s.position ? s.position.replace(/^职称[：:]\s*/, "") : "—"}
                  </span>
                </td>

                {/* 操作 */}
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <Link
                      to={`/scholars/${s.url_hash}`}
                      state={locationState}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-100 transition-all duration-150"
                      title="查看详情"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => onDelete(s.url_hash, s.name)}
                      disabled={deletingHash === s.url_hash}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="删除学者"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
