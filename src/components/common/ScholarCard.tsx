/**
 * 学者卡片组件（网格视图）
 * 从 ScholarListPage 的网格视图代码提取（第 747-834 行）
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Award, Trash2 } from "lucide-react";
import { type ScholarListItem } from "@/services/scholarApi";
import { getAvatarColor, getInitial } from "@/utils/avatar";

interface ScholarCardProps {
  scholar: ScholarListItem;
  index?: number;
  state?: unknown;
  onDelete?: (urlHash: string, name: string) => void;
  isDeleting?: boolean;
}

export function ScholarCard({
  scholar: s,
  index = 0,
  state,
  onDelete,
  isDeleting = false,
}: ScholarCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
    >
      <div className="relative group">
        <Link
          to={`/scholars/${s.url_hash}`}
          state={state}
          className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-primary-100 transition-all"
        >
          <div className="flex items-start gap-3 mb-3">
            {s.photo_url ? (
              <img
                src={s.photo_url}
                alt={s.name}
                className="w-11 h-11 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{
                  backgroundColor: getAvatarColor(s.name),
                }}
              >
                {getInitial(s.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                {s.name}
              </p>
              {s.name_en && (
                <p className="text-[10px] text-gray-400 truncate">
                  {s.name_en}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">
                {s.position || "—"}
              </p>
            </div>
          </div>

          {(s.is_academician || s.academic_titles.length > 0) && (
            <div className="mb-2 flex flex-wrap gap-1">
              {s.academic_titles.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
                >
                  <Award className="w-2.5 h-2.5" />
                  {t.length > 10 ? t.slice(0, 10) + "..." : t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
            <Building2 className="w-3 h-3 shrink-0 text-gray-400" />
            <span className="truncate">
              {s.university}
              {s.department && (
                <span className="text-gray-400"> · {s.department}</span>
              )}
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {s.research_areas.slice(0, 3).map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-50 text-primary-700 border border-primary-100"
              >
                {f}
              </span>
            ))}
            {s.research_areas.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                +{s.research_areas.length - 3}
              </span>
            )}
          </div>
        </Link>

        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(s.url_hash, s.name);
            }}
            disabled={isDeleting}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="删除学者"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
