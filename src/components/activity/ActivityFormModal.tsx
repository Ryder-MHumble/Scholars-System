import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MapPin, FileText, Clock, Hash, Image as ImageIcon, Users, Trash2 } from "lucide-react";
import {
  fetchActivityDetail,
  fetchActivityScholars,
  type ActivityCreateRequest,
  type ActivityEvent,
  type ActivityEventDetail,
  type ActivityUpdateRequest,
} from "@/services/activityApi";
import {
  getAllCategories,
  getCategoryByType,
  getTypesByCategory,
} from "@/constants/activityCategories";
import { ComboboxInput } from "@/components/ui/ComboboxInput";
import {
  ScholarSearchPicker,
  type ScholarPickResult,
} from "@/components/common/ScholarSearchPicker";

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: ActivityCreateRequest | ActivityUpdateRequest,
  ) => Promise<void>;
  activity?: ActivityEvent | null;
  mode: "create" | "edit";
}

const SERIES_OPTIONS = [
  "XAI智汇讲坛",
  "国际AI科学家大会",
  "学术年会",
  "青年论坛",
  "国际暑校",
  "开学典礼",
  "共建高校座谈会",
  "委员会会议",
];

type FormData = ActivityCreateRequest;

const defaultForm: FormData = {
  category: "",
  event_type: "",
  series: "",
  series_number: "",
  title: "",
  abstract: "",
  event_date: "",
  duration: 1,
  location: "",
  photo_url: "",
  scholar_ids: [],
};

interface SelectedScholar {
  scholar_id: string;
  name: string;
  institution?: string;
}

function toDateTimeInput(value: string): string {
  if (!value) return "";
  if (value.includes("T")) return value.slice(0, 16);
  return `${value}T00:00`;
}

export function ActivityFormModal({
  isOpen,
  onClose,
  onSubmit,
  activity,
  mode,
}: ActivityFormModalProps) {
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const availableTypes = useMemo(
    () => getTypesByCategory(selectedCategory),
    [selectedCategory],
  );

  const [selectedScholars, setSelectedScholars] = useState<SelectedScholar[]>([]);

  const categoryOptions = useMemo(() => getAllCategories(), []);
  const categoryNameToId = useMemo(
    () => new Map(categoryOptions.map((cat) => [cat.name, cat.id])),
    [categoryOptions],
  );
  const categoryIdToName = useMemo(
    () => new Map(categoryOptions.map((cat) => [cat.id, cat.name])),
    [categoryOptions],
  );
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      if (mode === "edit" && activity) {
        try {
          const detail: ActivityEventDetail = await fetchActivityDetail(activity.id);
          setFormData({
            category: detail.category ?? "",
            event_type: detail.event_type ?? "",
            series: detail.series ?? "",
            series_number: detail.series_number ?? "",
            title: detail.title ?? "",
            abstract: detail.abstract ?? "",
            event_date: toDateTimeInput(detail.event_date ?? ""),
            duration: detail.duration ?? 1,
            location: detail.location ?? "",
            photo_url: detail.photo_url ?? "",
            scholar_ids: detail.scholar_ids ?? [],
          });

          if (detail.event_type) {
            const categoryInfo = getCategoryByType(detail.event_type);
            if (categoryInfo) {
              setSelectedCategory(categoryInfo.categoryId);
            } else {
              setSelectedCategory(categoryNameToId.get(detail.category ?? "") ?? "");
            }
          } else {
            setSelectedCategory(categoryNameToId.get(detail.category ?? "") ?? "");
          }

          const scholars = await fetchActivityScholars(activity.id).catch(() => []);
          setSelectedScholars(
            scholars.map((s) => ({
              scholar_id: s.scholar_id,
              name: s.name,
              institution: s.university,
            })),
          );
        } catch {
          setFormData({
            ...defaultForm,
            category: activity.category ?? "",
            event_type: activity.event_type ?? "",
            series: activity.series ?? "",
            series_number: activity.series_number ?? "",
            title: activity.title ?? "",
            abstract: activity.abstract ?? "",
            event_date: toDateTimeInput(activity.event_date ?? ""),
            duration: activity.duration ?? 1,
            location: activity.location ?? "",
            photo_url: activity.photo_url ?? "",
            scholar_ids: [],
          });
          setSelectedScholars([]);
        }
      } else {
        setFormData(defaultForm);
        setSelectedCategory("");
        setSelectedScholars([]);
      }
      setErrors({});
    };

    load();
  }, [activity, mode, isOpen, categoryNameToId]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const categoryName = categoryIdToName.get(categoryId) ?? categoryId;
    setFormData((prev) => ({
      ...prev,
      category: categoryName,
      event_type: "",
    }));

    if (errors.category) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.category;
        return next;
      });
    }
  };

  const handleEventTypeChange = (eventType: string) => {
    setFormData((prev) => ({ ...prev, event_type: eventType }));

    if (errors.event_type) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.event_type;
        return next;
      });
    }
  };

  const handleAddScholar = (result: ScholarPickResult) => {
    setSelectedScholars((prev) => {
      if (prev.some((s) => s.scholar_id === result.scholar_id)) return prev;
      return [
        ...prev,
        {
          scholar_id: result.scholar_id,
          name: result.name,
          institution: result.institution,
        },
      ];
    });
  };

  const handleRemoveScholar = (scholarId: string) => {
    setSelectedScholars((prev) => prev.filter((s) => s.scholar_id !== scholarId));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.category.trim()) e.category = "活动分类不能为空";
    if (!formData.event_type.trim()) e.event_type = "活动类型不能为空";
    if (!formData.title.trim()) e.title = "活动标题不能为空";
    if (!formData.event_date.trim()) e.event_date = "活动日期不能为空";
    if (!formData.location.trim()) e.location = "活动地点不能为空";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload: ActivityCreateRequest = {
        category: formData.category.trim(),
        event_type: formData.event_type.trim(),
        series: formData.series?.trim() || undefined,
        series_number: formData.series_number?.trim() || undefined,
        title: formData.title.trim(),
        abstract: formData.abstract?.trim() || undefined,
        event_date: formData.event_date.trim(),
        duration: formData.duration,
        location: formData.location.trim(),
        photo_url: formData.photo_url?.trim() || undefined,
        scholar_ids: selectedScholars.map((s) => s.scholar_id),
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : "提交失败",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = (field: keyof FormData, value: string | number | string[] | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-gray-900">
              {mode === "create" ? "添加活动" : "编辑活动"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                基本信息
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      一级分类 <span className="text-red-500">*</span>
                    </label>
                    <ComboboxInput
                      value={categoryIdToName.get(selectedCategory) ?? ""}
                      onChange={(nextLabel) =>
                        handleCategoryChange(categoryNameToId.get(nextLabel) ?? "")
                      }
                      options={categoryOptions.map((cat) => cat.name)}
                      placeholder="请选择分类"
                      error={Boolean(errors.category)}
                      clearable
                      maxHeight="260px"
                    />
                    {errors.category && (
                      <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      活动类型 <span className="text-red-500">*</span>
                    </label>
                    <ComboboxInput
                      value={formData.event_type}
                      onChange={handleEventTypeChange}
                      options={availableTypes}
                      disabled={!selectedCategory}
                      placeholder="请选择活动类型"
                      error={Boolean(errors.event_type)}
                      clearable
                      maxHeight="260px"
                    />
                    {errors.event_type && (
                      <p className="mt-1 text-xs text-red-600">{errors.event_type}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    活动系列
                  </label>
                  <ComboboxInput
                    value={formData.series ?? ""}
                    onChange={(v) => set("series", v)}
                    options={SERIES_OPTIONS}
                    placeholder="无（独立活动）"
                    clearable
                    maxHeight="260px"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5" />
                        系列编号
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.series_number ?? ""}
                      onChange={(e) => set("series_number", e.target.value)}
                      placeholder="例如：42"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        活动照片 URL
                      </span>
                    </label>
                    <input
                      type="url"
                      value={formData.photo_url ?? ""}
                      onChange={(e) => set("photo_url", e.target.value)}
                      placeholder="https://example.com/activity.jpg"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    活动标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="请输入活动标题"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.title ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      摘要
                    </span>
                  </label>
                  <textarea
                    value={formData.abstract ?? ""}
                    onChange={(e) => set("abstract", e.target.value)}
                    placeholder="请输入活动摘要"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                时间与地点
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        活动日期 <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => set("event_date", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.event_date ? "border-red-300" : "border-gray-200"
                      }`}
                    />
                    {errors.event_date && (
                      <p className="mt-1 text-xs text-red-600">{errors.event_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        时长（小时）
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={formData.duration ?? ""}
                      onChange={(e) =>
                        set(
                          "duration",
                          e.target.value === "" ? undefined : parseFloat(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      活动地点 <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="请输入活动地点"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.location ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {errors.location && (
                    <p className="mt-1 text-xs text-red-600">{errors.location}</p>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                关联学者（可选）
              </h3>

              <div className="space-y-3">
                <ScholarSearchPicker
                  onSelect={handleAddScholar}
                  placeholder="输入学者姓名、院校或研究方向搜索..."
                  excludeIds={selectedScholars.map((s) => s.scholar_id)}
                />

                {selectedScholars.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    当前未关联学者。创建后也可以在活动详情页继续添加。
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedScholars.map((s) => (
                      <div
                        key={s.scholar_id}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                          {s.institution && (
                            <p className="text-xs text-gray-500 truncate">{s.institution}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveScholar(s.scholar_id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="移除学者"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}
          </form>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? "提交中..."
                : mode === "create"
                  ? "创建活动"
                  : "保存修改"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
