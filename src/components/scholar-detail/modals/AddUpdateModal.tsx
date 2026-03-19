import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { NewScholarUpdate } from "@/services/scholarApi";
import { SelectInput } from "@/components/ui/SelectInput";

interface AddUpdateModalProps {
  onClose: () => void;
  onSubmit: (data: NewScholarUpdate) => Promise<void>;
}

export function AddUpdateModal({ onClose, onSubmit }: AddUpdateModalProps) {
  const [form, setForm] = useState<NewScholarUpdate>({
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
      update_type:
        useCustomType && customType.trim()
          ? customType.trim()
          : form.update_type,
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
          <h3 className="text-base font-semibold text-gray-900">
            新增动态备注
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">
              类型
            </label>
            <div className="space-y-2">
              {!useCustomType ? (
                <>
                  <SelectInput
                    value={form.update_type}
                    onChange={(v) => setForm((f) => ({ ...f, update_type: v }))}
                    className="focus:ring-1 focus:ring-primary-400"
                  >
                    {presetTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </SelectInput>
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
            <label className="text-xs font-medium text-gray-500 block mb-1">
              标题 *
            </label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="请输入标题"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              内容 *
            </label>
            <textarea
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none"
              placeholder="请输入内容"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              来源链接
            </label>
            <input
              value={form.source_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, source_url: e.target.value }))
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              发布日期
            </label>
            <input
              type="date"
              value={form.published_at}
              onChange={(e) =>
                setForm((f) => ({ ...f, published_at: e.target.value }))
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              添加人
            </label>
            <input
              value={form.added_by}
              onChange={(e) =>
                setForm((f) => ({ ...f, added_by: e.target.value }))
              }
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
