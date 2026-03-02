import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Globe,
  ExternalLink,
  Award,
  Trophy,
  Building2,
  GraduationCap,
  Briefcase,
  User,
  Calendar,
  BookOpen,
  Handshake,
  ClipboardList,
  Phone,
  FileText,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Link2,
  Edit3,
  Check,
} from "lucide-react";
import {
  fetchFacultyDetail,
  patchFacultyRelation,
  patchFacultyDetail,
  postFacultyUpdate,
  deleteFacultyUpdate,
  patchFacultyAchievements,
  type FacultyDetail,
  type FacultyDetailPatch,
  type NewFacultyUpdate,
  type PublicationRecord,
  type PatentRecord,
  type AwardRecord,
  type SupervisedStudent,
  type ExchangeRecord,
} from "@/services/facultyApi";
import { StatsSidebar } from "@/components/scholar-detail/stats/StatsSidebar";
import { PageSkeleton } from "@/components/scholar-detail/shared/SkeletonLoader";
import { getInitial } from "@/utils/avatar";
import { cn } from "@/utils/cn";
import {
  slideInLeft,
  slideInUp,
  slideInRight,
  staggerContainer,
  listItem,
} from "@/utils/animations";

// ─── 点击编辑字段组件 ─────────────────────────────────────────────
interface ClickToEditFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  renderValue?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

function ClickToEditField({
  value,
  onSave,
  placeholder = "-",
  multiline = false,
  renderValue,
  className,
  inputClassName,
}: ClickToEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleStart = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch {
      // stay in edit mode on error
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-start gap-1 flex-1", className)}>
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            rows={3}
            className={cn(
              "flex-1 text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none",
              inputClassName,
            )}
          />
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            className={cn(
              "flex-1 text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500",
              inputClassName,
            )}
          />
        )}
        <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
            title="保存"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
            title="取消"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "cursor-pointer group inline-flex items-center gap-0.5 rounded px-0.5 -mx-0.5 transition-colors hover:bg-primary-50",
        className,
      )}
      onClick={handleStart}
      title="点击编辑"
    >
      {value ? (
        renderValue !== undefined ? renderValue : <span>{value}</span>
      ) : (
        <span className="text-gray-300 italic text-xs">{placeholder}</span>
      )}
      <Edit3 className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-50 text-primary-500" />
    </span>
  );
}

// ─── 左侧分区标题 ─────────────────────────────────────────────────
function SideLabel({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <Icon className="w-3.5 h-3.5 text-primary-500" />
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </span>
    </div>
  );
}

// ─── 新增动态弹窗 ────────────────────────────────────────────────
function AddUpdateModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: NewFacultyUpdate) => Promise<void>;
}) {
  const [form, setForm] = useState<NewFacultyUpdate>({
    update_type: "general",
    title: "",
    content: "",
    source_url: "",
    published_at: "",
    added_by: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [useCustomType, setUseCustomType] = useState(false);
  const [customType, setCustomType] = useState("");

  const presetTypes = [
    { value: "general", label: "一般动态" },
    { value: "major_project", label: "重大项目" },
    { value: "talent_title", label: "人才称号" },
    { value: "appointment", label: "任职履新" },
    { value: "award", label: "获奖信息" },
    { value: "advisor_committee", label: "顾问委员" },
    { value: "adjunct_supervisor", label: "兼职导师" },
    { value: "supervised_student", label: "指导学生" },
    { value: "research_project", label: "科研立项" },
    { value: "joint_management", label: "联合管理" },
    { value: "academic_exchange", label: "学术交流" },
    { value: "potential_recruit", label: "潜在引进对象" },
  ];

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;

    const finalForm = {
      ...form,
      update_type: useCustomType && customType.trim() ? customType.trim() : form.update_type,
    };

    setSubmitting(true);
    try {
      await onSubmit(finalForm);
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">新增动态备注</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">类型</label>
            <div className="space-y-2">
              {!useCustomType ? (
                <>
                  <select
                    value={form.update_type}
                    onChange={(e) => setForm((f) => ({ ...f, update_type: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  >
                    {presetTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setUseCustomType(true)}
                    className="w-full text-xs text-primary-600 hover:text-primary-700 transition-colors py-1 rounded border border-primary-200 hover:bg-primary-50"
                  >
                    或输入自定义分类
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="例：顾问委员、兼职导师、学术交流等"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomType(false);
                      setCustomType("");
                    }}
                    className="w-full text-xs text-gray-600 hover:text-gray-700 transition-colors py-1 rounded border border-gray-200 hover:bg-gray-50"
                  >
                    使用预设分类
                  </button>
                </>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">标题 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="请输入标题"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">内容 *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
              placeholder="请输入内容"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">来源链接</label>
            <input
              value={form.source_url}
              onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">发布日期</label>
            <input
              type="date"
              value={form.published_at}
              onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">添加人</label>
            <input
              value={form.added_by}
              onChange={(e) => setForm((f) => ({ ...f, added_by: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="姓名或工号"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.title.trim() || !form.content.trim()}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "提交中..." : "提交"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── 编辑学术成就弹窗 ──────────────────────────────────────────────
interface EditAchievementsModalProps {
  publications: PublicationRecord[];
  patents: PatentRecord[];
  awards: AwardRecord[];
  onClose: () => void;
  onSubmit: (data: { publications: PublicationRecord[]; patents: PatentRecord[]; awards: AwardRecord[] }) => void;
}

function EditAchievementsModal({
  publications,
  patents,
  awards,
  onClose,
  onSubmit,
}: EditAchievementsModalProps) {
  const [activeTab, setActiveTab] = useState<"publications" | "patents" | "awards">("publications");
  const [editedPublications, setEditedPublications] = useState<PublicationRecord[]>(publications);
  const [editedPatents, setEditedPatents] = useState<PatentRecord[]>(patents);
  const [editedAwards, setEditedAwards] = useState<AwardRecord[]>(awards);

  const handleSubmit = () => {
    onSubmit({
      publications: editedPublications,
      patents: editedPatents,
      awards: editedAwards,
    });
  };

  const addPublication = () => {
    setEditedPublications([
      ...editedPublications,
      { title: "", venue: "", year: "", authors: "", url: "", citation_count: 0, is_corresponding: false, added_by: "user" },
    ]);
  };

  const removePublication = (index: number) => {
    setEditedPublications(editedPublications.filter((_, i) => i !== index));
  };

  const updatePublication = (index: number, field: keyof PublicationRecord, value: any) => {
    const updated = [...editedPublications];
    updated[index] = { ...updated[index], [field]: value };
    setEditedPublications(updated);
  };

  const addPatent = () => {
    setEditedPatents([
      ...editedPatents,
      { title: "", patent_no: "", year: "", inventors: "", patent_type: "", status: "", added_by: "user" },
    ]);
  };

  const removePatent = (index: number) => {
    setEditedPatents(editedPatents.filter((_, i) => i !== index));
  };

  const updatePatent = (index: number, field: keyof PatentRecord, value: any) => {
    const updated = [...editedPatents];
    updated[index] = { ...updated[index], [field]: value };
    setEditedPatents(updated);
  };

  const addAward = () => {
    setEditedAwards([
      ...editedAwards,
      { title: "", year: "", level: "", grantor: "", description: "", added_by: "user" },
    ]);
  };

  const removeAward = (index: number) => {
    setEditedAwards(editedAwards.filter((_, i) => i !== index));
  };

  const updateAward = (index: number, field: keyof AwardRecord, value: any) => {
    const updated = [...editedAwards];
    updated[index] = { ...updated[index], [field]: value };
    setEditedAwards(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">编辑学术成就</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex gap-3 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("publications")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "publications"
                ? "text-primary-600 border-b-2 border-primary-600 -mb-px"
                : "text-gray-600 hover:text-gray-800"
            )}
          >
            代表性论文 ({editedPublications.length})
          </button>
          <button
            onClick={() => setActiveTab("patents")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "patents"
                ? "text-primary-600 border-b-2 border-primary-600 -mb-px"
                : "text-gray-600 hover:text-gray-800"
            )}
          >
            专利 ({editedPatents.length})
          </button>
          <button
            onClick={() => setActiveTab("awards")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "awards"
                ? "text-primary-600 border-b-2 border-primary-600 -mb-px"
                : "text-gray-600 hover:text-gray-800"
            )}
          >
            奖项 ({editedAwards.length})
          </button>
        </div>

        {/* 论文编辑 */}
        {activeTab === "publications" && (
          <div className="space-y-3 mb-4">
            {editedPublications.map((pub, i) => (
              <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-gray-500">论文 {i + 1}</span>
                  <button
                    onClick={() => removePublication(i)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    删除
                  </button>
                </div>
                <input
                  type="text"
                  value={pub.title || ""}
                  onChange={(e) => updatePublication(i, "title", e.target.value)}
                  placeholder="论文标题"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={pub.venue || ""}
                  onChange={(e) => updatePublication(i, "venue", e.target.value)}
                  placeholder="会议/期刊"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={pub.year || ""}
                  onChange={(e) => updatePublication(i, "year", e.target.value)}
                  placeholder="年份"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={pub.authors || ""}
                  onChange={(e) => updatePublication(i, "authors", e.target.value)}
                  placeholder="作者"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={pub.url || ""}
                  onChange={(e) => updatePublication(i, "url", e.target.value)}
                  placeholder="URL"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={pub.citation_count || 0}
                    onChange={(e) => updatePublication(i, "citation_count", parseInt(e.target.value))}
                    placeholder="被引数"
                    className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={pub.is_corresponding || false}
                      onChange={(e) => updatePublication(i, "is_corresponding", e.target.checked)}
                      className="rounded"
                    />
                    <span>通讯作者</span>
                  </label>
                </div>
              </div>
            ))}
            <button
              onClick={addPublication}
              className="w-full px-4 py-2 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1" /> 添加论文
            </button>
          </div>
        )}

        {/* 专利编辑 */}
        {activeTab === "patents" && (
          <div className="space-y-3 mb-4">
            {editedPatents.map((patent, i) => (
              <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-gray-500">专利 {i + 1}</span>
                  <button
                    onClick={() => removePatent(i)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    删除
                  </button>
                </div>
                <input
                  type="text"
                  value={patent.title || ""}
                  onChange={(e) => updatePatent(i, "title", e.target.value)}
                  placeholder="专利名称"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={patent.patent_no || ""}
                  onChange={(e) => updatePatent(i, "patent_no", e.target.value)}
                  placeholder="专利号"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={patent.year || ""}
                  onChange={(e) => updatePatent(i, "year", e.target.value)}
                  placeholder="年份"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={patent.inventors || ""}
                  onChange={(e) => updatePatent(i, "inventors", e.target.value)}
                  placeholder="发明人"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={patent.patent_type || ""}
                  onChange={(e) => updatePatent(i, "patent_type", e.target.value)}
                  placeholder="专利类型"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={patent.status || ""}
                  onChange={(e) => updatePatent(i, "status", e.target.value)}
                  placeholder="状态"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
            ))}
            <button
              onClick={addPatent}
              className="w-full px-4 py-2 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1" /> 添加专利
            </button>
          </div>
        )}

        {/* 奖项编辑 */}
        {activeTab === "awards" && (
          <div className="space-y-3 mb-4">
            {editedAwards.map((award, i) => (
              <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-gray-500">奖项 {i + 1}</span>
                  <button
                    onClick={() => removeAward(i)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    删除
                  </button>
                </div>
                <input
                  type="text"
                  value={award.title || ""}
                  onChange={(e) => updateAward(i, "title", e.target.value)}
                  placeholder="奖项名称"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={award.year || ""}
                  onChange={(e) => updateAward(i, "year", e.target.value)}
                  placeholder="年份"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={award.level || ""}
                  onChange={(e) => updateAward(i, "level", e.target.value)}
                  placeholder="等级"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  type="text"
                  value={award.grantor || ""}
                  onChange={(e) => updateAward(i, "grantor", e.target.value)}
                  placeholder="颁发单位"
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <textarea
                  value={award.description || ""}
                  onChange={(e) => updateAward(i, "description", e.target.value)}
                  placeholder="描述"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
                />
              </div>
            ))}
            <button
              onClick={addAward}
              className="w-full px-4 py-2 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1" /> 添加奖项
            </button>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── 交往记录表单弹窗 ────────────────────────────────────────────
interface ExchangeRecordFormModalProps {
  record?: ExchangeRecord;
  onClose: () => void;
  onSubmit: (record: ExchangeRecord) => void;
}

function ExchangeRecordFormModal({ record, onClose, onSubmit }: ExchangeRecordFormModalProps) {
  const [form, setForm] = useState<ExchangeRecord>({
    type: record?.type ?? "",
    date: record?.date ?? "",
    title: record?.title ?? "",
    organization: record?.organization ?? "",
    description: record?.description ?? "",
  });

  const handleSubmit = () => {
    if (!form.title?.trim()) return;
    onSubmit(form);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            {record ? "编辑交往记录" : "添加交往记录"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">类型</label>
            <input
              type="text"
              value={form.type ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              placeholder="如：学术交流、人才称号、任职履新…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">标题 *</label>
            <input
              value={form.title ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="请输入标题"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">机构</label>
            <input
              value={form.organization ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="请输入相关机构"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">日期</label>
            <input
              type="date"
              value={form.date ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">描述</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
              placeholder="请输入详细描述"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title?.trim()}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            确定
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ScholarDetailPageDemo() {
  const { scholarId } = useParams<{ scholarId: string }>();
  const [faculty, setFaculty] = useState<FacultyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [editableAchievements, setEditableAchievements] = useState<{
    publications: PublicationRecord[];
    patents: PatentRecord[];
    awards: AwardRecord[];
  } | null>(null);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  // 交往记录编辑状态
  const [isExchangeEditMode, setIsExchangeEditMode] = useState(false);
  const [editedExchangeRecords, setEditedExchangeRecords] = useState<ExchangeRecord[]>([]);
  const [showExchangeRecordForm, setShowExchangeRecordForm] = useState(false);
  const [editingExchangeIdx, setEditingExchangeIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!scholarId) return;
    setIsLoading(true);
    setError(null);
    fetchFacultyDetail(scholarId)
      .then((data) => {
        setFaculty(data);
        setEditableAchievements({
          publications: data.representative_publications ?? [],
          patents: data.patents ?? [],
          awards: data.awards ?? [],
        });
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "加载失败");
        setIsLoading(false);
      });
  }, [scholarId]);

  // ── 单字段保存 (左侧基础信息点击编辑) ──────────────────────────
  const handleFieldSave = async (patch: FacultyDetailPatch) => {
    if (!faculty) return;
    const updated = await patchFacultyDetail(faculty.url_hash, patch);
    setFaculty(updated);
  };

  // ── 指导学生保存 ──────────────────────────────────────────────
  const handleStudentsSave = async (students: SupervisedStudent[]) => {
    if (!faculty) return;
    const updated = await patchFacultyRelation(faculty.url_hash, {
      supervised_students: students,
    });
    setFaculty(updated);
  };

  // ── 交往记录编辑处理 ──────────────────────────────────────────
  const handleEnterExchangeEdit = () => {
    setEditedExchangeRecords([...(faculty?.academic_exchange_records ?? [])]);
    setIsExchangeEditMode(true);
  };

  const handleCancelExchangeEdit = () => {
    setIsExchangeEditMode(false);
    setEditedExchangeRecords([]);
    setShowExchangeRecordForm(false);
    setEditingExchangeIdx(null);
  };

  const handleSaveExchangeRecords = async () => {
    if (!faculty) return;
    const updated = await patchFacultyRelation(faculty.url_hash, {
      academic_exchange_records: editedExchangeRecords,
    });
    setFaculty(updated);
    setIsExchangeEditMode(false);
    setEditedExchangeRecords([]);
    setShowExchangeRecordForm(false);
    setEditingExchangeIdx(null);
  };

  const handleExchangeRecordSubmit = (record: ExchangeRecord) => {
    if (editingExchangeIdx !== null) {
      setEditedExchangeRecords((prev) => {
        const updated = [...prev];
        updated[editingExchangeIdx] = record;
        return updated;
      });
      setEditingExchangeIdx(null);
    } else {
      setEditedExchangeRecords((prev) => [...prev, record]);
    }
  };

  const handleDeleteExchangeRecord = (idx: number) => {
    setEditedExchangeRecords((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteUpdate = async (index: number) => {
    if (!faculty) return;
    try {
      const updated = await deleteFacultyUpdate(faculty.url_hash, index);
      setFaculty(updated);
    } catch (error) {
      console.error("Failed to delete update:", error);
    }
  };

  if (isLoading) return <PageSkeleton />;

  if (error || !faculty) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500">{error ?? "未找到该学者"}</p>
        <Link
          to="/"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 返回列表
        </Link>
      </div>
    );
  }

  // Build advised students from supervised_students
  const advisedStudents = (faculty.supervised_students ?? []).map((s, idx) => ({
    id: String(idx),
    name: s.name ?? "未知",
    degree: (s.degree as "博士" | "硕士" | "博士后") ?? "博士",
    startYear: Number(s.start_year) || 0,
    endYear: s.end_year ? Number(s.end_year) : undefined,
    currentPosition: s.current_position,
  }));

  // Relation badges from boolean flags
  const relationBadges = [
    {
      label: "顾问委员",
      active: faculty.is_advisor_committee,
      desc: faculty.is_advisor_committee ? "顾问委员会" : "",
    },
    {
      label: "兼职导师",
      active: faculty.is_adjunct_supervisor,
      desc: faculty.is_adjunct_supervisor ? "联合培养" : "",
    },
    {
      label: "潜在引进",
      active: faculty.is_potential_recruit,
      desc: faculty.is_potential_recruit ? "已标记" : "",
    },
  ];

  const exchangeTypeColor: Record<string, string> = {
    一般动态: "bg-gray-100 text-gray-700",
    重大项目: "bg-red-100 text-red-700",
    人才称号: "bg-purple-100 text-purple-700",
    任职履新: "bg-blue-100 text-blue-700",
    获奖信息: "bg-amber-100 text-amber-700",
    顾问委员: "bg-cyan-100 text-cyan-700",
    兼职导师: "bg-violet-100 text-violet-700",
    指导学生: "bg-emerald-100 text-emerald-700",
    科研立项: "bg-indigo-100 text-indigo-700",
    联合管理: "bg-teal-100 text-teal-700",
    学术交流: "bg-pink-100 text-pink-700",
    潜在引进对象: "bg-orange-100 text-orange-700",
  };

  const updateTypeLabel: Record<string, string> = {
    general: "一般动态",
    major_project: "重大项目",
    talent_title: "人才称号",
    appointment: "任职履新",
    award: "获奖信息",
    advisor_committee: "顾问委员",
    adjunct_supervisor: "兼职导师",
    supervised_student: "指导学生",
    research_project: "科研立项",
    joint_management: "联合管理",
    academic_exchange: "学术交流",
    potential_recruit: "潜在引进对象",
  };

  const getUpdateTypeLabel = (updateType: string) => {
    return updateTypeLabel[updateType] || updateType;
  };

  const handleAddUpdate = async (data: NewFacultyUpdate) => {
    const updated = await postFacultyUpdate(faculty.url_hash, data);
    setFaculty(updated);
  };

  const handleRelationToggle = async (
    field: "is_advisor_committee" | "is_adjunct_supervisor" | "is_potential_recruit",
  ) => {
    const updated = await patchFacultyRelation(faculty.url_hash, {
      [field]: !faculty[field],
    });
    setFaculty(updated);
  };

  const BIO_LIMIT = 200;
  const bioText = faculty.bio ?? "";
  const bioNeedsExpand = bioText.length > BIO_LIMIT;

  return (
    <>
      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">联系方式</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {faculty.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${faculty.email}`}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      {faculty.email}
                    </a>
                  </div>
                )}
                {faculty.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{faculty.phone}</span>
                  </div>
                )}
                {faculty.profile_url && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a
                      href={faculty.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                    >
                      个人主页 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {!faculty.email && !faculty.phone && !faculty.profile_url && (
                  <p className="text-sm text-gray-400 text-center py-4">暂无联系方式</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Update Modal */}
      <AnimatePresence>
        {showAddUpdate && (
          <AddUpdateModal
            onClose={() => setShowAddUpdate(false)}
            onSubmit={handleAddUpdate}
          />
        )}
      </AnimatePresence>

      {/* Edit Achievements Modal */}
      <AnimatePresence>
        {showAchievementsModal && editableAchievements && (
          <EditAchievementsModal
            publications={editableAchievements.publications}
            patents={editableAchievements.patents}
            awards={editableAchievements.awards}
            onClose={() => setShowAchievementsModal(false)}
            onSubmit={async (data) => {
              const updated = await patchFacultyAchievements(faculty.url_hash, {
                representative_publications: data.publications,
                patents: data.patents,
                awards: data.awards,
              });
              setFaculty(updated);
              setEditableAchievements({
                publications: data.publications,
                patents: data.patents,
                awards: data.awards,
              });
              setShowAchievementsModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Exchange Record Form Modal */}
      <AnimatePresence>
        {(showExchangeRecordForm || editingExchangeIdx !== null) && (
          <ExchangeRecordFormModal
            record={editingExchangeIdx !== null ? editedExchangeRecords[editingExchangeIdx] : undefined}
            onClose={() => {
              setShowExchangeRecordForm(false);
              setEditingExchangeIdx(null);
            }}
            onSubmit={handleExchangeRecordSubmit}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              返回列表
            </Link>
          </motion.div>

          {/* Three Column Layout */}
          <div className="flex gap-5">
            {/* ══ Left Sidebar ══ */}
            <motion.aside
              className="w-[400px] shrink-0"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={slideInLeft}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Profile Header */}
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      {faculty.photo_url ? (
                        <img
                          src={faculty.photo_url}
                          alt={faculty.name}
                          className="w-[72px] h-[72px] rounded-xl object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-2xl font-bold bg-primary-600 text-white">
                          {getInitial(faculty.name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h2 className="text-lg font-bold text-gray-900 leading-snug">
                        <ClickToEditField
                          value={faculty.name}
                          onSave={async (val) => handleFieldSave({ name: val })}
                          className="text-lg font-bold text-gray-900"
                        />
                      </h2>
                      <div className="text-sm text-gray-500">
                        <ClickToEditField
                          value={faculty.name_en || ""}
                          onSave={async (val) => handleFieldSave({ name_en: val })}
                          placeholder="点击添加英文名"
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        <ClickToEditField
                          value={faculty.position || ""}
                          onSave={async (val) => handleFieldSave({ position: val })}
                          placeholder="点击添加职称"
                        />
                      </div>
                      <div className="text-xs text-gray-400">
                        <ClickToEditField
                          value={faculty.department || ""}
                          onSave={async (val) => handleFieldSave({ department: val })}
                          placeholder="点击添加院系"
                        />
                      </div>
                    </div>
                  </div>

                  {/* University */}
                  {faculty.university && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{faculty.university}</span>
                    </div>
                  )}

                  {/* Academic titles */}
                  {faculty.academic_titles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {faculty.academic_titles.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200"
                        >
                          <Award className="w-3 h-3" />
                          {t.length > 12 ? t.slice(0, 12) + "..." : t}
                        </span>
                      ))}
                    </div>
                  )}
                  {faculty.is_academician && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                        <Award className="w-3 h-3" />
                        院士
                      </span>
                    </div>
                  )}

                  {/* Data completeness */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <span>数据完整度</span>
                      <span className="font-medium text-gray-600">{faculty.data_completeness}%</span>
                    </div>
                    <div className="text-gray-400">
                      {faculty.crawled_at ? `采集于 ${faculty.crawled_at.slice(0, 10)}` : ""}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="px-5 py-4 border-t border-gray-100">
                  <SideLabel icon={Mail} title="联系方式" />
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-sm">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <ClickToEditField
                        value={faculty.email || ""}
                        onSave={async (val) => handleFieldSave({ email: val })}
                        placeholder="点击添加邮箱"
                        renderValue={
                          faculty.email ? (
                            <a
                              href={`mailto:${faculty.email}`}
                              className="hover:text-primary-600 truncate transition-colors text-gray-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {faculty.email}
                            </a>
                          ) : undefined
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <ClickToEditField
                        value={faculty.phone || ""}
                        onSave={async (val) => handleFieldSave({ phone: val })}
                        placeholder="点击添加电话"
                        className={!faculty.phone ? "text-gray-400" : "text-gray-600"}
                      />
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <ClickToEditField
                        value={faculty.office || ""}
                        onSave={async (val) => handleFieldSave({ office: val })}
                        placeholder="点击添加办公室"
                        className={!faculty.office ? "text-gray-400" : "text-gray-600"}
                      />
                    </div>
                    {faculty.profile_url && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <a
                          href={faculty.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary-600 flex items-center gap-1 transition-colors text-gray-600"
                        >
                          个人主页
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Links */}
                {(faculty.google_scholar_url || faculty.dblp_url || faculty.lab_url || faculty.orcid) && (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <SideLabel icon={Link2} title="学术链接" />
                    <div className="space-y-2">
                      {faculty.google_scholar_url && (
                        <div className="text-xs">
                          <label className="text-gray-400 block mb-1">Google Scholar</label>
                          <ClickToEditField
                            value={faculty.google_scholar_url}
                            onSave={async (val) => handleFieldSave({ google_scholar_url: val })}
                            renderValue={
                              <a
                                href={faculty.google_scholar_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline truncate block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {faculty.google_scholar_url}
                              </a>
                            }
                          />
                        </div>
                      )}
                      {faculty.dblp_url && (
                        <div className="text-xs">
                          <label className="text-gray-400 block mb-1">DBLP</label>
                          <ClickToEditField
                            value={faculty.dblp_url}
                            onSave={async (val) => handleFieldSave({ dblp_url: val })}
                            renderValue={
                              <a
                                href={faculty.dblp_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline truncate block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {faculty.dblp_url}
                              </a>
                            }
                          />
                        </div>
                      )}
                      {faculty.lab_url && (
                        <div className="text-xs">
                          <label className="text-gray-400 block mb-1">实验室网站</label>
                          <ClickToEditField
                            value={faculty.lab_url}
                            onSave={async (val) => handleFieldSave({ lab_url: val })}
                            renderValue={
                              <a
                                href={faculty.lab_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline truncate block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {faculty.lab_url}
                              </a>
                            }
                          />
                        </div>
                      )}
                      {faculty.orcid && (
                        <div className="text-xs">
                          <label className="text-gray-400 block mb-1">ORCID</label>
                          <ClickToEditField
                            value={faculty.orcid}
                            onSave={async (val) => handleFieldSave({ orcid: val })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {bioText && (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <SideLabel icon={User} title="个人简介" />
                    <ClickToEditField
                      value={bioText}
                      onSave={async (val) => handleFieldSave({ bio: val })}
                      multiline
                      renderValue={
                        <>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {bioNeedsExpand && !bioExpanded
                              ? bioText.slice(0, BIO_LIMIT) + "..."
                              : bioText}
                          </p>
                          {bioNeedsExpand && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setBioExpanded((v) => !v); }}
                              className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
                            >
                              {bioExpanded ? (
                                <><ChevronUp className="w-3 h-3" /> 收起</>
                              ) : (
                                <><ChevronDown className="w-3 h-3" /> 展开全文</>
                              )}
                            </button>
                          )}
                        </>
                      }
                    />
                  </div>
                )}

                {/* Education */}
                {(() => {
                  const eduItems =
                    faculty.education && faculty.education.length > 0
                      ? faculty.education
                      : faculty.phd_institution
                      ? [
                          {
                            degree: "博士",
                            institution: faculty.phd_institution,
                            major: "",
                            year: faculty.phd_year || "",
                            end_year: "",
                          },
                        ]
                      : [];
                  if (eduItems.length === 0) return null;
                  return (
                    <div className="px-5 py-4 border-t border-gray-100">
                      <SideLabel icon={GraduationCap} title="教育经历" />
                      <div className="space-y-4">
                        {eduItems.map((edu, i) => (
                          <div key={i} className="relative pl-5">
                            <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-white shadow-sm" />
                            {i < eduItems.length - 1 && (
                              <div className="absolute left-[4px] top-4 w-0.5 h-full bg-gray-200" />
                            )}
                            <div className="space-y-0.5">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-semibold text-gray-800">
                                  {edu.degree || "学历"}
                                </span>
                                {(edu.year || edu.end_year) && (
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {edu.end_year
                                      ? `${edu.year}–${edu.end_year}`
                                      : edu.year}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                <ClickToEditField
                                  value={String(edu.institution || "")}
                                  onSave={async (val) => handleFieldSave({ phd_institution: val })}
                                />
                              </div>
                              {edu.major && (
                                <div className="text-xs text-gray-400">{edu.major}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Work Experience (joint_management_roles) */}
                {faculty.joint_management_roles && faculty.joint_management_roles.length > 0 && (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <SideLabel icon={Briefcase} title="任职经历" />
                    <div className="space-y-4">
                      {faculty.joint_management_roles.map((role, i) => (
                        <div key={i} className="relative pl-5">
                          <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                          <div className="space-y-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-semibold text-gray-800">
                                {role.role || "职务"}
                              </span>
                              {(role.start_year || role.end_year) && (
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                  {role.end_year
                                    ? `${role.start_year}–${role.end_year}`
                                    : `${role.start_year}–至今`}
                                </span>
                              )}
                            </div>
                            {role.organization && (
                              <div className="text-sm text-gray-600">{role.organization}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research Areas */}
                {faculty.research_areas && faculty.research_areas.length > 0 && (
                  <div className="px-5 py-4 border-t border-gray-100">
                    <SideLabel icon={BookOpen} title="研究方向" />
                    <ClickToEditField
                      value={faculty.research_areas.join(", ")}
                      onSave={async (val) =>
                        handleFieldSave({
                          research_areas: val
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      multiline
                      renderValue={
                        <div className="flex flex-wrap gap-1.5">
                          {faculty.research_areas.slice(0, 10).map((area) => (
                            <span
                              key={area}
                              className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-100"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      }
                    />
                  </div>
                )}
              </motion.div>
            </motion.aside>

            {/* ══ Center Content ══ */}
            <motion.main
              className="flex-1 min-w-0 space-y-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* ─ 与两院关系 ─ */}
              <motion.div
                variants={slideInUp}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Handshake className="w-5 h-5 text-primary-600" />
                  <h3 className="text-base font-semibold text-gray-900">与两院关系</h3>
                </div>

                {/* Relation badges */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    关系概况
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {relationBadges.map((rel) => (
                      <button
                        key={rel.label}
                        onClick={() => {
                          const fieldMap: Record<string, "is_advisor_committee" | "is_adjunct_supervisor" | "is_potential_recruit"> = {
                            顾问委员: "is_advisor_committee",
                            兼职导师: "is_adjunct_supervisor",
                            潜在引进: "is_potential_recruit",
                          };
                          const field = fieldMap[rel.label];
                          if (field) handleRelationToggle(field);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all hover:opacity-80",
                          rel.active
                            ? "bg-primary-50 border-primary-200 text-primary-700"
                            : "bg-gray-50 border-gray-200 text-gray-400",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            rel.active ? "bg-primary-500" : "bg-gray-300",
                          )}
                        />
                        <span className="font-medium">{rel.label}</span>
                        {rel.active && rel.desc && (
                          <span className="text-xs text-primary-500">{rel.desc}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {faculty.institute_relation_notes ? (
                    <ClickToEditField
                      value={faculty.institute_relation_notes}
                      onSave={async (val) => {
                        const updated = await patchFacultyRelation(faculty.url_hash, {
                          institute_relation_notes: val,
                        });
                        setFaculty(updated);
                      }}
                      multiline
                      renderValue={
                        <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          {faculty.institute_relation_notes}
                        </p>
                      }
                    />
                  ) : null}
                </div>

                {/* Exchange Records */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      交往记录
                    </p>
                    {!isExchangeEditMode ? (
                      <button
                        onClick={handleEnterExchangeEdit}
                        className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-full transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        编辑
                      </button>
                    ) : (
                      <div className="ml-auto flex gap-1">
                        <button
                          onClick={handleSaveExchangeRecords}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded-full transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          保存
                        </button>
                        <button
                          onClick={handleCancelExchangeEdit}
                          className="px-2.5 py-1 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Edit mode: show editedExchangeRecords */}
                  {isExchangeEditMode ? (
                    <div className="space-y-2 p-3 bg-primary-50/20 rounded-lg border border-primary-100">
                      {editedExchangeRecords.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">暂无交往记录</p>
                      )}
                      {editedExchangeRecords.map((record, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 flex items-start gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {record.type && (
                                <span
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-semibold",
                                    exchangeTypeColor[record.type] ?? "bg-gray-100 text-gray-600",
                                  )}
                                >
                                  {record.type}
                                </span>
                              )}
                              {record.date && (
                                <span className="text-xs text-gray-400">{record.date}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 truncate">
                              {[record.title, record.organization].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => setEditingExchangeIdx(index)}
                              className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                              title="编辑"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExchangeRecord(index)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="删除"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setShowExchangeRecordForm(true)}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> 添加交往记录
                      </button>
                    </div>
                  ) : (
                    /* View mode */
                    faculty.academic_exchange_records && faculty.academic_exchange_records.length > 0 ? (
                      <div className="space-y-3">
                        {faculty.academic_exchange_records.map((record, index) => (
                          <motion.div
                            key={index}
                            variants={listItem}
                            className="p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200"
                          >
                            <div className="flex items-start gap-3 flex-wrap mb-2">
                              {record.type && (
                                <span
                                  className={cn(
                                    "text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap",
                                    exchangeTypeColor[record.type] ?? "bg-gray-100 text-gray-600",
                                  )}
                                >
                                  {record.type}
                                </span>
                              )}
                              {record.date && (
                                <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                                  <Calendar className="w-3 h-3" />
                                  {record.date}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {[record.title, record.organization, record.description]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-6">暂无交往记录</p>
                    )
                  )}
                </div>
              </motion.div>

              {/* ─ 动态更新 ─ */}
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
                    onClick={() => setShowAddUpdate(true)}
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
                            {update.title || getUpdateTypeLabel(update.update_type ?? "general")}
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
                                onClick={() => handleDeleteUpdate(i)}
                                className="ml-1 px-1.5 py-0.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="删除"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        {update.content && (
                          <p className="text-sm text-gray-600 leading-relaxed">{update.content}</p>
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

              {/* ─ 联合研究项目 ─ */}
              {faculty.joint_research_projects && faculty.joint_research_projects.length > 0 && (
                <motion.div
                  variants={slideInUp}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <h3 className="text-base font-semibold text-gray-900">联合研究项目</h3>
                    <span className="ml-auto text-xs text-gray-400">
                      {faculty.joint_research_projects.length} 项
                    </span>
                  </div>
                  <div className="space-y-3">
                    {faculty.joint_research_projects.map((proj, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-800">
                              {proj.title || "研究项目"}
                            </span>
                            {proj.year && (
                              <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                {String(proj.year)}
                              </span>
                            )}
                          </div>
                          {proj.description && (
                            <p className="text-xs text-gray-500 leading-relaxed">
                              {proj.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ─ 学术成就 ─ */}
              <motion.div
                variants={slideInUp}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                {/* 卡片标题 */}
                <div className="flex items-center gap-2 mb-5">
                  <Trophy className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">学术成就</h3>
                  <button
                    onClick={() => setShowAchievementsModal(true)}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-full transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    编辑
                  </button>
                </div>

                {/* ── 代表性论文 ── */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-600">代表性论文</h4>
                    {faculty.representative_publications && faculty.representative_publications.length > 0 && (
                      <span className="text-xs text-gray-400">{faculty.representative_publications.length} 篇</span>
                    )}
                  </div>
                  {faculty.representative_publications && faculty.representative_publications.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {faculty.representative_publications.map((pub, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800 leading-snug">
                                    {pub.title || "论文"}
                                  </p>
                                  {pub.is_corresponding && (
                                    <span className="inline-block text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded mt-1">
                                      通讯作者
                                    </span>
                                  )}
                                </div>
                                {pub.citation_count !== undefined && pub.citation_count > 0 && (
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    被引 {pub.citation_count}
                                  </span>
                                )}
                              </div>
                              {pub.venue && (
                                <p className="text-xs text-gray-500 mb-1">
                                  {pub.venue}
                                  {pub.year && ` (${pub.year})`}
                                </p>
                              )}
                              {pub.authors && (
                                <p className="text-xs text-gray-400 truncate">{pub.authors}</p>
                              )}
                            </div>
                            {pub.url && (
                              <a
                                href={pub.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                      {faculty.publications_count > 0 && (
                        <p className="text-xs text-gray-400 text-center mt-3 pt-3 border-t border-gray-100">
                          总计约 {faculty.publications_count} 篇，可前往{" "}
                          {faculty.dblp_url ? (
                            <a href={faculty.dblp_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">DBLP</a>
                          ) : "DBLP"}{" "}
                          或{" "}
                          {faculty.google_scholar_url ? (
                            <a href={faculty.google_scholar_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google Scholar</a>
                          ) : "Google Scholar"}{" "}
                          查看全部
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">
                      论文详情暂未收录
                      {(faculty.dblp_url || faculty.google_scholar_url) && (
                        <>，可前往{" "}
                          {faculty.dblp_url ? (
                            <a href={faculty.dblp_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">DBLP</a>
                          ) : "DBLP"}{" "}
                          或{" "}
                          {faculty.google_scholar_url ? (
                            <a href={faculty.google_scholar_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google Scholar</a>
                          ) : "Google Scholar"}{" "}
                          查看
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* ── 专利 ── */}
                <div className="pt-4 border-t border-gray-100 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-600">专利</h4>
                    {faculty.patents && faculty.patents.length > 0 && (
                      <span className="text-xs text-gray-400">{faculty.patents.length} 项</span>
                    )}
                  </div>
                  {faculty.patents && faculty.patents.length > 0 ? (
                    <div className="space-y-3">
                      {faculty.patents.map((patent, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-800 leading-snug">
                                {patent.title || "专利"}
                              </p>
                              {patent.year && (
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {patent.year}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-1">
                              {patent.patent_no && (
                                <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                  {patent.patent_no}
                                </span>
                              )}
                              {patent.patent_type && (
                                <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                  {patent.patent_type}
                                </span>
                              )}
                              {patent.status && (
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded border",
                                  patent.status === "已授权" ? "bg-green-50 border-green-200 text-green-700" : "bg-blue-50 border-blue-200 text-blue-700"
                                )}>
                                  {patent.status}
                                </span>
                              )}
                            </div>
                            {patent.inventors && (
                              <p className="text-xs text-gray-400 truncate">
                                发明人: {patent.inventors}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">暂无专利数据</p>
                  )}
                </div>

                {/* ── 荣誉奖项 ── */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-600">荣誉奖项</h4>
                    {faculty.awards && faculty.awards.length > 0 && (
                      <span className="text-xs text-gray-400">{faculty.awards.length} 个</span>
                    )}
                  </div>
                  {faculty.awards && faculty.awards.length > 0 ? (
                    <div className="space-y-3">
                      {faculty.awards.map((award, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-800 leading-snug">
                                {award.title || "奖项"}
                              </p>
                              {award.year && (
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {award.year}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs mb-1">
                              {award.level && (
                                <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-amber-700">
                                  {award.level}
                                </span>
                              )}
                              {award.grantor && (
                                <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 text-gray-600">
                                  {award.grantor}
                                </span>
                              )}
                            </div>
                            {award.description && (
                              <p className="text-xs text-gray-500 leading-relaxed">
                                {award.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">暂无荣誉奖项数据</p>
                  )}
                </div>
              </motion.div>
            </motion.main>

            {/* ══ Right Sidebar ══ */}
            <motion.div variants={slideInRight} initial="hidden" animate="visible">
              <StatsSidebar
                advisedStudents={advisedStudents}
                onSave={handleStudentsSave}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
