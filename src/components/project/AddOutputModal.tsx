import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { OUTPUT_TYPE_OPTIONS } from "@/constants/projectConstants";
import type { ProjectOutput } from "@/types/project";

interface AddOutputModalProps {
  onAdd: (output: ProjectOutput) => void;
  onClose: () => void;
}

export function AddOutputModal({ onAdd, onClose }: AddOutputModalProps) {
  const [form, setForm] = useState<ProjectOutput>({
    type: "论文",
    title: "",
    year: new Date().getFullYear(),
    authors: [],
    venue: "",
  });
  const [authorsStr, setAuthorsStr] = useState("");

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    onAdd({
      ...form,
      title: form.title.trim(),
      authors: authorsStr
        .split(/[,，]/)
        .map((a) => a.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">添加项目成果</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">成果类型</label>
            <div className="flex flex-wrap gap-2">
              {OUTPUT_TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                    form.type === t
                      ? "bg-primary-50 text-primary-700 border-primary-300 font-medium"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">标题 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请输入成果标题"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">年份</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">发表/授予机构</label>
              <input
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="如期刊、会议名称"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">作者（逗号分隔）</label>
            <input
              value={authorsStr}
              onChange={(e) => setAuthorsStr(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="张三, 李四, ..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">链接（可选）</label>
            <input
              value={form.url ?? ""}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim()}
            className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加
          </button>
        </div>
      </motion.div>
    </div>
  );
}
