import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import type {
  Project,
  ProjectCreateRequest,
  RelatedScholar,
  ProjectOutput,
} from "@/types/project";

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectCreateRequest) => Promise<void>;
  initialData?: Project | null;
  title?: string;
}

const STATUS_OPTIONS = ["在研", "已结题", "已验收", "已终止"];
const CATEGORY_OPTIONS = [
  "国家自然科学基金",
  "国家重点研发计划",
  "国家科技重大专项",
  "省部级项目",
  "企业合作项目",
  "其他",
];

const emptyScholar = (): RelatedScholar => ({
  name: "",
  role: "",
  institution: "",
  scholar_id: "",
});

const emptyOutput = (): ProjectOutput => ({
  type: "",
  title: "",
  year: new Date().getFullYear(),
  authors: [],
  venue: "",
  url: "",
});

export function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = "添加项目",
}: ProjectFormModalProps) {
  const [form, setForm] = useState<ProjectCreateRequest>({
    name: "",
    pi_name: "",
    pi_institution: "",
    funder: "",
    funding_amount: undefined,
    start_year: new Date().getFullYear(),
    end_year: undefined,
    status: "在研",
    category: "",
    description: "",
    keywords: [],
    tags: [],
    related_scholars: [],
    cooperation_institutions: [],
    outputs: [],
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [coopInput, setCoopInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          name: initialData.name,
          pi_name: initialData.pi_name,
          pi_institution: initialData.pi_institution,
          funder: initialData.funder,
          funding_amount: initialData.funding_amount,
          start_year: initialData.start_year,
          end_year: initialData.end_year,
          status: initialData.status,
          category: initialData.category,
          description: initialData.description ?? "",
          keywords: initialData.keywords ?? [],
          tags: initialData.tags ?? [],
          related_scholars: initialData.related_scholars ?? [],
          cooperation_institutions: initialData.cooperation_institutions ?? [],
          outputs: initialData.outputs ?? [],
        });
      } else {
        setForm({
          name: "",
          pi_name: "",
          pi_institution: "",
          funder: "",
          funding_amount: undefined,
          start_year: new Date().getFullYear(),
          end_year: undefined,
          status: "在研",
          category: "",
          description: "",
          keywords: [],
          tags: [],
          related_scholars: [],
          cooperation_institutions: [],
          outputs: [],
        });
      }
      setKeywordInput("");
      setTagInput("");
      setCoopInput("");
      setError(null);
    }
  }, [isOpen, initialData]);

  const set = <K extends keyof ProjectCreateRequest>(
    key: K,
    value: ProjectCreateRequest[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const addKeyword = () => {
    const v = keywordInput.trim();
    if (v && !form.keywords?.includes(v)) {
      set("keywords", [...(form.keywords ?? []), v]);
    }
    setKeywordInput("");
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !form.tags?.includes(v)) {
      set("tags", [...(form.tags ?? []), v]);
    }
    setTagInput("");
  };

  const addCoop = () => {
    const v = coopInput.trim();
    if (v && !form.cooperation_institutions?.includes(v)) {
      set("cooperation_institutions", [
        ...(form.cooperation_institutions ?? []),
        v,
      ]);
    }
    setCoopInput("");
  };

  const updateScholar = (
    idx: number,
    field: keyof RelatedScholar,
    value: string,
  ) => {
    const scholars = [...(form.related_scholars ?? [])];
    scholars[idx] = { ...scholars[idx], [field]: value };
    set("related_scholars", scholars);
  };

  const updateOutput = (
    idx: number,
    field: keyof ProjectOutput,
    value: string | number | string[],
  ) => {
    const outputs = [...(form.outputs ?? [])];
    outputs[idx] = { ...outputs[idx], [field]: value };
    set("outputs", outputs);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("请填写项目名称");
      return;
    }
    if (!form.pi_name.trim()) {
      setError("请填写项目负责人");
      return;
    }
    if (!form.funder.trim()) {
      setError("请填写资助机构");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
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
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                基本信息
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    项目名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入项目名称"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      项目负责人 <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.pi_name}
                      onChange={(e) => set("pi_name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      负责人单位
                    </label>
                    <input
                      value={form.pi_institution}
                      onChange={(e) => set("pi_institution", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="所属机构"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      资助机构 <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.funder}
                      onChange={(e) => set("funder", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="资助机构名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      资助金额（万元）
                    </label>
                    <input
                      type="number"
                      value={form.funding_amount ?? ""}
                      onChange={(e) =>
                        set(
                          "funding_amount",
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      开始年份 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.start_year}
                      onChange={(e) => set("start_year", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      结束年份
                    </label>
                    <input
                      type="number"
                      value={form.end_year ?? ""}
                      onChange={(e) =>
                        set(
                          "end_year",
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="进行中"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      项目状态
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => set("status", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    项目类别
                  </label>
                  <input
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    list="category-options"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="选择或输入项目类别"
                  />
                  <datalist id="category-options">
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    项目简介
                  </label>
                  <textarea
                    value={form.description ?? ""}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="请输入项目简介"
                  />
                </div>
              </div>
            </section>

            {/* Keywords & Tags */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                关键词与标签
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    关键词
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="输入关键词后回车或点击添加"
                    />
                    <button
                      type="button"
                      onClick={addKeyword}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(form.keywords ?? []).map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "keywords",
                              (form.keywords ?? []).filter((_, j) => j !== i),
                            )
                          }
                          className="hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标签
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="输入标签后回车或点击添加"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(form.tags ?? []).map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "tags",
                              (form.tags ?? []).filter((_, j) => j !== i),
                            )
                          }
                          className="hover:text-purple-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Related Scholars */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  相关学者
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    set("related_scholars", [
                      ...(form.related_scholars ?? []),
                      emptyScholar(),
                    ])
                  }
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  添加学者
                </button>
              </div>
              <div className="space-y-3">
                {(form.related_scholars ?? []).map((scholar, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <input
                      value={scholar.name}
                      onChange={(e) => updateScholar(idx, "name", e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="姓名"
                    />
                    <input
                      value={scholar.role}
                      onChange={(e) => updateScholar(idx, "role", e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="角色（如：主要参与者）"
                    />
                    <div className="flex gap-2">
                      <input
                        value={scholar.institution}
                        onChange={(e) =>
                          updateScholar(idx, "institution", e.target.value)
                        }
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="所属机构"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            "related_scholars",
                            (form.related_scholars ?? []).filter(
                              (_, j) => j !== idx,
                            ),
                          )
                        }
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Cooperation Institutions */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                合作机构
              </h3>
              <div className="flex gap-2 mb-2">
                <input
                  value={coopInput}
                  onChange={(e) => setCoopInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCoop())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="输入合作机构名称"
                />
                <button
                  type="button"
                  onClick={addCoop}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(form.cooperation_institutions ?? []).map((inst, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs"
                  >
                    {inst}
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "cooperation_institutions",
                          (form.cooperation_institutions ?? []).filter(
                            (_, j) => j !== i,
                          ),
                        )
                      }
                      className="hover:text-emerald-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </section>

            {/* Outputs */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  项目成果
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    set("outputs", [...(form.outputs ?? []), emptyOutput()])
                  }
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  添加成果
                </button>
              </div>
              <div className="space-y-3">
                {(form.outputs ?? []).map((output, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={output.type}
                        onChange={(e) => updateOutput(idx, "type", e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="类型（论文/专利等）"
                      />
                      <input
                        type="number"
                        value={output.year}
                        onChange={(e) =>
                          updateOutput(idx, "year", Number(e.target.value))
                        }
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="年份"
                      />
                      <div className="flex gap-2">
                        <input
                          value={output.venue}
                          onChange={(e) =>
                            updateOutput(idx, "venue", e.target.value)
                          }
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="发表期刊/会议"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "outputs",
                              (form.outputs ?? []).filter((_, j) => j !== idx),
                            )
                          }
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <input
                      value={output.title}
                      onChange={(e) => updateOutput(idx, "title", e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="成果标题"
                    />
                    <input
                      value={output.url ?? ""}
                      onChange={(e) => updateOutput(idx, "url", e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="链接（可选）"
                    />
                  </div>
                ))}
              </div>
            </section>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "保存中..." : "保存"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
