import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Users } from "lucide-react";
import {
  fetchActivityScholars,
  addActivityScholar,
  removeActivityScholar,
} from "@/services/activityApi";
import {
  ScholarSearchPicker,
  ScholarAvatar,
  type ScholarPickResult,
} from "@/components/common/ScholarSearchPicker";

interface ActivityScholarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  activityTitle: string;
}

interface ActivityScholar {
  scholar_id: string;
  name: string;
}

export function ActivityScholarsModal({
  isOpen,
  onClose,
  activityId,
  activityTitle,
}: ActivityScholarsModalProps) {
  const [scholars, setScholars] = useState<ActivityScholar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadScholars();
    }
  }, [isOpen, activityId]);

  const loadScholars = async () => {
    try {
      setLoading(true);
      setError(null);
      const activityScholars = await fetchActivityScholars(activityId);
      setScholars(activityScholars);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAddScholar = async (result: ScholarPickResult) => {
    try {
      setError(null);
      await addActivityScholar(activityId, result.scholar_id);
      // Reload to get updated list
      const updated = await fetchActivityScholars(activityId);
      setScholars(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加失败");
    }
  };

  const handleRemoveScholar = async (scholarId: string) => {
    try {
      setError(null);
      await removeActivityScholar(activityId, scholarId);
      setScholars(scholars.filter((s) => s.scholar_id !== scholarId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "移除失败");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">管理参与学者</h2>
              <p className="text-sm text-gray-500 mt-0.5">{activityTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Scholar Search Picker */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                搜索并添加学者
              </p>
              <ScholarSearchPicker
                onSelect={handleAddScholar}
                placeholder="搜索学者姓名添加..."
                excludeIds={scholars.map((s) => s.scholar_id)}
              />
              <p className="mt-1.5 text-xs text-gray-400">
                从学者库中搜索，搜索不到可点击「新增学者到学者库」
              </p>
            </div>

            {/* Current Scholars */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-500">
                  已添加学者 ({scholars.length})
                </h3>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">加载中...</p>
                </div>
              ) : scholars.length > 0 ? (
                <div className="space-y-2">
                  {scholars.map((scholar) => (
                    <motion.div
                      key={scholar.scholar_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <ScholarAvatar name={scholar.name} size={32} />
                        <span className="text-sm font-medium text-gray-900">
                          {scholar.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveScholar(scholar.scholar_id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="移除学者"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    暂无学者，使用上方搜索框添加
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              关闭
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
