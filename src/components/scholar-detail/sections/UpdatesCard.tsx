import { motion } from "framer-motion";
import {
  ClipboardList,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import type { FacultyDetail } from "@/services/facultyApi";
import { slideInUp, listItem } from "@/utils/animations";
import { getUpdateTypeLabel } from "@/constants/updateTypes";

interface UpdatesCardProps {
  faculty: FacultyDetail;
  onShowAddUpdate: () => void;
  onDeleteUpdate: (index: number) => Promise<void>;
}

export function UpdatesCard({
  faculty,
  onShowAddUpdate,
  onDeleteUpdate,
}: UpdatesCardProps) {
  return (
    <motion.div
      variants={slideInUp}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-5 h-5 text-primary-600" />
        <h3 className="text-base font-semibold text-gray-900">动态更新</h3>
        <span className="ml-auto text-xs text-gray-400">
          {faculty.recent_updates.length} 条
        </span>
        <button
          onClick={onShowAddUpdate}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors px-2 py-1 rounded border border-primary-200 hover:bg-primary-50"
        >
          <Plus className="w-3 h-3" />
          添加备注
        </button>
      </div>
      {faculty.recent_updates.length > 0 ? (
        <div className="space-y-3">
          {faculty.recent_updates.map((update, i) => (
            <motion.div
              key={i}
              variants={listItem}
              className="p-4 border border-gray-100 hover:border-primary-200 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {update.title ||
                    getUpdateTypeLabel(update.update_type ?? "general")}
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {update.update_type && (
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                      {getUpdateTypeLabel(update.update_type)}
                    </span>
                  )}
                  {update.published_at && (
                    <span>{update.published_at.slice(0, 10)}</span>
                  )}
                  {update.added_by?.startsWith("user:") && (
                    <button
                      onClick={() => onDeleteUpdate(i)}
                      className="ml-1 px-1.5 py-0.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              {update.content && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {update.content}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {update.source_url && (
                  <a
                    href={update.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    查看来源
                  </a>
                )}
                {update.added_by && (
                  <span className="text-xs text-gray-400">
                    由 {update.added_by} 添加
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">暂无动态更新</p>
      )}
    </motion.div>
  );
}
