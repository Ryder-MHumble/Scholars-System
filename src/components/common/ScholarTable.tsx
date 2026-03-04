import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Trash2 } from "lucide-react";
import type { FacultyListItem } from "@/services/facultyApi";
import { getAvatarColor, getInitial } from "@/utils/avatar";
import { AcademicianBadge } from "@/components/common/AcademicianBadge";

interface ScholarTableProps {
  items: FacultyListItem[];
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
            {items.map((s, i) => (
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
                    state={locationState}
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
                          backgroundColor: getAvatarColor(s.name),
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
                        {s.position || "\u2014"}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">
                      {s.university || "\u2014"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {s.department || "\u2014"}
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
                      <span className="text-xs text-gray-400">{"\u2014"}</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/scholars/${s.url_hash}`}
                      state={locationState}
                      className="inline-flex text-gray-400 hover:text-primary-600 transition-colors p-1"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onDelete(s.url_hash, s.name)}
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
    </div>
  );
}
