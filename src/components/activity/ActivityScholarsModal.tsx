import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Search } from "lucide-react";
import {
  fetchActivityScholars,
  addActivityScholar,
  removeActivityScholar,
} from "@/services/activityApi";
import { fetchScholarList } from "@/services/scholarApi";
import type { ScholarListItem } from "@/services/scholarApi";

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
  const [availableScholars, setAvailableScholars] = useState<ScholarListItem[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScholarId, setSelectedScholarId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activityId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load activity scholars
      const activityScholars = await fetchActivityScholars(activityId);
      setScholars(activityScholars);

      // Load all available scholars
      const response = await fetchScholarList(1, 1000);
      setAvailableScholars(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAddScholar = async () => {
    if (!selectedScholarId) return;

    try {
      setIsAdding(true);
      await addActivityScholar(activityId, selectedScholarId);

      // Reload scholars
      const updated = await fetchActivityScholars(activityId);
      setScholars(updated);
      setSelectedScholarId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加失败");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveScholar = async (scholarId: string) => {
    if (!confirm("确定要移除该学者吗？")) return;

    try {
      await removeActivityScholar(activityId, scholarId);
      setScholars(scholars.filter((s) => s.scholar_id !== scholarId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "移除失败");
    }
  };

  const filteredAvailableScholars = availableScholars.filter(
    (scholar) =>
      !scholars.some((s) => s.scholar_id === scholar.url_hash) &&
      scholar.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">管理参与学者</h2>
              <p className="text-sm text-gray-500 mt-1">{activityTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Add Scholar Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">添加学者</h3>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索学者..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <select
                  value={selectedScholarId}
                  onChange={(e) => setSelectedScholarId(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">选择学者</option>
                  {filteredAvailableScholars.map((scholar) => (
                    <option key={scholar.url_hash} value={scholar.url_hash}>
                      {scholar.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddScholar}
                  disabled={!selectedScholarId || isAdding}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>
            </div>

            {/* Current Scholars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
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
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {scholar.name}
                      </span>
                      <button
                        onClick={() => handleRemoveScholar(scholar.scholar_id)}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">暂无学者</p>
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
