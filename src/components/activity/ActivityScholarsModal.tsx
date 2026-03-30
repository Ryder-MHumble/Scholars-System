import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Users, Mail, ExternalLink } from "lucide-react";
import {
  fetchActivityScholars,
  addActivityScholar,
  removeActivityScholar,
  type ActivityScholarDetail,
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

export function ActivityScholarsModal({
  isOpen,
  onClose,
  activityId,
  activityTitle,
}: ActivityScholarsModalProps) {
  const [scholars, setScholars] = useState<ActivityScholarDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const loadScholars = useCallback(async () => {
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
  }, [activityId]);

  useEffect(() => {
    if (isOpen) {
      loadScholars();
    }
  }, [isOpen, loadScholars]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

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
      setScholars((prev) => prev.filter((s) => s.scholar_id !== scholarId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "移除失败");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  管理参与学者
                </h2>
                <p className="text-sm text-gray-600 mt-1">{activityTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/80 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Scholar Search Picker */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary-600" />
                  <p className="text-sm font-semibold text-gray-900">
                    搜索并添加学者
                  </p>
                </div>
                <ScholarSearchPicker
                  onSelect={handleAddScholar}
                  placeholder="输入学者姓名、院校或研究方向搜索..."
                  excludeIds={scholars.map((s) => s.scholar_id)}
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 从学者库中搜索添加，搜索不到可点击「新增学者到学者库」
                </p>
              </div>

              {/* Current Scholars */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    已添加学者
                    <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                      {scholars.length}
                    </span>
                  </h3>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-sm text-gray-500">加载中...</p>
                  </div>
                ) : scholars.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {scholars.map((scholar, index) => (
                      <motion.div
                        key={scholar.scholar_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all group"
                      >
                        <ScholarAvatar name={scholar.name} size={48} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-semibold text-gray-900 mb-1">
                                {scholar.name}
                              </h4>

                              {(scholar.position || scholar.university) && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                  {scholar.position && (
                                    <span className="font-medium">
                                      {scholar.position}
                                    </span>
                                  )}
                                  {scholar.position && scholar.university && (
                                    <span className="text-gray-300">•</span>
                                  )}
                                  {scholar.university && (
                                    <span>{scholar.university}</span>
                                  )}
                                  {scholar.department && (
                                    <>
                                      <span className="text-gray-300">•</span>
                                      <span>{scholar.department}</span>
                                    </>
                                  )}
                                </div>
                              )}

                              {scholar.research_areas &&
                                scholar.research_areas.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {scholar.research_areas
                                      .slice(0, 3)
                                      .map((area, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md"
                                        >
                                          {area}
                                        </span>
                                      ))}
                                    {scholar.research_areas.length > 3 && (
                                      <span className="px-2 py-0.5 text-gray-500 text-xs">
                                        +{scholar.research_areas.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}

                              {scholar.email && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Mail className="w-3.5 h-3.5" />
                                  <a
                                    href={`mailto:${scholar.email}`}
                                    className="hover:text-primary-600 transition-colors"
                                  >
                                    {scholar.email}
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={`/scholars/${scholar.scholar_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                title="查看详情"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() =>
                                  handleRemoveScholar(scholar.scholar_id)
                                }
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="移除学者"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      暂无参与学者
                    </p>
                    <p className="text-xs text-gray-400">
                      使用上方搜索框添加学者
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">点击弹窗外部区域可关闭</p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                完成
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
