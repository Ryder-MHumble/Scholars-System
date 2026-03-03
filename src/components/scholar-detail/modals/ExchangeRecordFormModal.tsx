import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { ExchangeRecord } from "@/services/facultyApi";

interface ExchangeRecordFormModalProps {
  record?: ExchangeRecord;
  onClose: () => void;
  onSubmit: (record: ExchangeRecord) => void;
}

export function ExchangeRecordFormModal({
  record,
  onClose,
  onSubmit,
}: ExchangeRecordFormModalProps) {
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              类型
            </label>
            <input
              type="text"
              value={form.type ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              placeholder="如：学术交流、人才称号、任职履新…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              标题 *
            </label>
            <input
              value={form.title ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="请输入标题"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              机构
            </label>
            <input
              value={form.organization ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, organization: e.target.value }))
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="请输入相关机构"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              日期
            </label>
            <input
              type="date"
              value={form.date ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              描述
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
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
