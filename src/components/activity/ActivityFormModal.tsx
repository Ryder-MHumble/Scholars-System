import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  MapPin,
  User,
  Building2,
  Hash,
  FileText,
  Clock,
  Megaphone,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { fetchActivityDetail } from "@/services/activityApi";
import type {
  ActivityEvent,
  ActivityEventDetail,
  ActivityCreateRequest,
  ActivityUpdateRequest,
} from "@/services/activityApi";

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: ActivityCreateRequest | ActivityUpdateRequest,
  ) => Promise<void>;
  activity?: ActivityEvent | null;
  mode: "create" | "edit";
}

const EVENT_TYPES = [
  "学科前沿讲座",
  "前沿沙龙",
  "学术带头人论坛",
  "讲座",
  "其他",
];

const AUDIT_STATUSES = [
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
];

type FormData = Omit<ActivityCreateRequest, "scholar_ids">;

const defaultForm: FormData = {
  event_type: "",
  series_number: "",
  title: "",
  abstract: "",
  speaker_name: "",
  speaker_organization: "",
  speaker_position: "",
  speaker_bio: "",
  speaker_photo_url: "",
  event_date: "",
  duration: 1,
  location: "",
  publicity: "",
  needs_email_invitation: false,
  certificate_number: "",
  created_by: "",
  audit_status: "pending",
};

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
  const [speakerExpanded, setSpeakerExpanded] = useState(true);
  const [adminExpanded, setAdminExpanded] = useState(false);

  // When editing, load full detail to get all fields
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && activity) {
      fetchActivityDetail(activity.id)
        .then((detail: ActivityEventDetail) => {
          // Convert ISO datetime to datetime-local format
          const dateStr = detail.event_date
            ? detail.event_date.slice(0, 16)
            : "";
          setFormData({
            event_type: detail.event_type ?? "",
            series_number: detail.series_number ?? "",
            title: detail.title ?? "",
            abstract: detail.abstract ?? "",
            speaker_name: detail.speaker_name ?? "",
            speaker_organization: detail.speaker_organization ?? "",
            speaker_position: detail.speaker_position ?? "",
            speaker_bio: detail.speaker_bio ?? "",
            speaker_photo_url: detail.speaker_photo_url ?? "",
            event_date: dateStr,
            duration: detail.duration ?? 1,
            location: detail.location ?? "",
            publicity: detail.publicity ?? "",
            needs_email_invitation: detail.needs_email_invitation ?? false,
            certificate_number: detail.certificate_number ?? "",
            created_by: detail.created_by ?? "",
            audit_status: detail.audit_status ?? "pending",
          });
        })
        .catch(() => {
          // Fallback to list fields
          setFormData({
            ...defaultForm,
            event_type: activity.event_type,
            title: activity.title,
            speaker_name: activity.speaker_name,
            speaker_organization: activity.speaker_organization,
            event_date: activity.event_date.slice(0, 16),
            location: activity.location,
            series_number: activity.series_number ?? "",
          });
        });
    } else {
      setFormData(defaultForm);
    }
    setErrors({});
    setSpeakerExpanded(true);
    setAdminExpanded(false);
  }, [activity, mode, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.event_type.trim()) e.event_type = "活动类型不能为空";
    if (!formData.title.trim()) e.title = "活动标题不能为空";
    if (!formData.speaker_name.trim()) e.speaker_name = "主讲人不能为空";
    if (!formData.speaker_organization.trim())
      e.speaker_organization = "主讲人单位不能为空";
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
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : "提交失败",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = (field: keyof FormData, value: string | number | boolean) => {
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
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

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {/* === 基本信息 === */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                基本信息
              </h3>
              <div className="space-y-4">
                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    活动类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => set("event_type", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${
                      errors.event_type ? "border-red-300" : "border-gray-200"
                    }`}
                  >
                    <option value="">请选择活动类型</option>
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.event_type && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.event_type}
                    </p>
                  )}
                </div>

                {/* Title */}
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

                {/* Abstract */}
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

                {/* Series Number */}
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
                        <Award className="w-3.5 h-3.5" />
                        证书编号
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.certificate_number ?? ""}
                      onChange={(e) =>
                        set("certificate_number", e.target.value)
                      }
                      placeholder="例如：XAI-D2642-001"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* === 时间地点 === */}
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
                        errors.event_date
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                    />
                    {errors.event_date && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.event_date}
                      </p>
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
                      value={formData.duration ?? 1}
                      onChange={(e) =>
                        set("duration", parseFloat(e.target.value) || 1)
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
                    <p className="mt-1 text-xs text-red-600">
                      {errors.location}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* === 主讲人信息（可折叠） === */}
            <section>
              <button
                type="button"
                onClick={() => setSpeakerExpanded((v) => !v)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2"
              >
                <span className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  主讲人信息
                </span>
                {speakerExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {speakerExpanded && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        主讲人姓名 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.speaker_name}
                          onChange={(e) =>
                            set("speaker_name", e.target.value)
                          }
                          placeholder="请输入姓名"
                          className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            errors.speaker_name
                              ? "border-red-300"
                              : "border-gray-200"
                          }`}
                        />
                      </div>
                      {errors.speaker_name && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.speaker_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        职务/职称
                      </label>
                      <input
                        type="text"
                        value={formData.speaker_position ?? ""}
                        onChange={(e) =>
                          set("speaker_position", e.target.value)
                        }
                        placeholder="例如：教授、创始人"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      所在单位 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.speaker_organization}
                        onChange={(e) =>
                          set("speaker_organization", e.target.value)
                        }
                        placeholder="请输入所在单位"
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.speaker_organization
                            ? "border-red-300"
                            : "border-gray-200"
                        }`}
                      />
                    </div>
                    {errors.speaker_organization && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.speaker_organization}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      主讲人简介
                    </label>
                    <textarea
                      value={formData.speaker_bio ?? ""}
                      onChange={(e) => set("speaker_bio", e.target.value)}
                      placeholder="请输入主讲人简介"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      照片文件名
                    </label>
                    <input
                      type="text"
                      value={formData.speaker_photo_url ?? ""}
                      onChange={(e) =>
                        set("speaker_photo_url", e.target.value)
                      }
                      placeholder="例如：zhou-ming-photo.png"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* === 管理信息（可折叠） === */}
            <section>
              <button
                type="button"
                onClick={() => setAdminExpanded((v) => !v)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2"
              >
                <span className="flex items-center gap-2">
                  <Megaphone className="w-3.5 h-3.5" />
                  管理信息
                </span>
                {adminExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {adminExpanded && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      宣传方式
                    </label>
                    <input
                      type="text"
                      value={formData.publicity ?? ""}
                      onChange={(e) => set("publicity", e.target.value)}
                      placeholder="例如：可摄影摄像，仅图文发布"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="needs_email"
                      type="checkbox"
                      checked={formData.needs_email_invitation ?? false}
                      onChange={(e) =>
                        set("needs_email_invitation", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="needs_email"
                      className="text-sm font-medium text-gray-700"
                    >
                      需要发送邮件邀请
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        录入人
                      </label>
                      <input
                        type="text"
                        value={formData.created_by ?? ""}
                        onChange={(e) => set("created_by", e.target.value)}
                        placeholder="请输入录入人姓名"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        审核状态
                      </label>
                      <select
                        value={formData.audit_status ?? "pending"}
                        onChange={(e) => set("audit_status", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        {AUDIT_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}
          </form>

          {/* Footer */}
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
