import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus, RefreshCw, Trash2, X } from "lucide-react";
import {
  mergeAcademicAffiliations,
  parseAcademicAffiliationsFromText,
} from "@/utils/textParsers";
import type { ManagementRole } from "@/services/scholarApi";

interface EditManagementRolesModalProps {
  roles: ManagementRole[];
  onClose: () => void;
  onSubmit: (records: ManagementRole[]) => void | Promise<void>;
}

export function EditManagementRolesModal({
  roles,
  onClose,
  onSubmit,
}: EditManagementRolesModalProps) {
  const [records, setRecords] = useState<ManagementRole[]>(roles);
  const [batchMode, setBatchMode] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [batchStrategy, setBatchStrategy] = useState<"append" | "replace">("append");

  const parsedBatch = useMemo(
    () => parseAcademicAffiliationsFromText(batchText),
    [batchText],
  );

  const addRecord = () =>
    setRecords((prev) => [
      ...prev,
      { role: "", organization: "", start_year: "", end_year: "" },
    ]);

  const removeRecord = (i: number) =>
    setRecords((prev) => prev.filter((_, idx) => idx !== i));

  const updateRecord = (i: number, key: keyof ManagementRole, value: string) =>
    setRecords((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [key]: value };
      return updated;
    });

  const applyBatch = () => {
    if (parsedBatch.length === 0) return;
    setRecords((prev) =>
      batchStrategy === "replace"
        ? mergeAcademicAffiliations([], parsedBatch)
        : mergeAcademicAffiliations(prev, parsedBatch),
    );
    setBatchMode(false);
    setBatchText("");
  };

  const cleanRecords = records.filter(
    (record) => record.role?.trim() || record.organization?.trim(),
  );

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
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            编辑学术兼职
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {records.map((rec, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={rec.organization ?? ""}
                  onChange={(e) => updateRecord(i, "organization", e.target.value)}
                  placeholder="机构，如：中国人工智能学会"
                  className="min-w-0 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  value={rec.role ?? ""}
                  onChange={(e) => updateRecord(i, "role", e.target.value)}
                  placeholder="职务，如：会士 / 编委"
                  className="min-w-0 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  value={rec.start_year ?? ""}
                  onChange={(e) => updateRecord(i, "start_year", e.target.value)}
                  placeholder="开始年份"
                  className="min-w-0 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  value={rec.end_year ?? ""}
                  onChange={(e) => updateRecord(i, "end_year", e.target.value)}
                  placeholder="结束年份 / 至今"
                  className="min-w-0 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <button
                type="button"
                onClick={() => removeRecord(i)}
                aria-label={`删除第 ${i + 1} 条学术兼职`}
                title="删除这条兼职"
                className="mt-2 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
            </div>
          ))}

          {batchMode ? (
            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/30 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-600">
                  支持逐行、管道分隔、机构/职务标签和中文逗号分隔的多条兼职
                </p>
                <span className="shrink-0 text-xs font-medium text-blue-700">
                  已识别 {parsedBatch.length} 条
                </span>
              </div>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                autoFocus
                rows={6}
                placeholder={"中国人工智能学会 | 会士\n职务：期刊编委；机构：IEEE TCC；开始：2024；结束：至今"}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              />
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>导入方式</span>
                <button
                  type="button"
                  aria-pressed={batchStrategy === "append"}
                  onClick={() => setBatchStrategy("append")}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${batchStrategy === "append" ? "border-blue-300 bg-blue-100 text-blue-700" : "border-gray-200 bg-white text-gray-500"}`}
                >
                  <Plus className="h-3 w-3" /> 追加并去重
                </button>
                <button
                  type="button"
                  aria-pressed={batchStrategy === "replace"}
                  onClick={() => setBatchStrategy("replace")}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${batchStrategy === "replace" ? "border-blue-300 bg-blue-100 text-blue-700" : "border-gray-200 bg-white text-gray-500"}`}
                >
                  <RefreshCw className="h-3 w-3" /> 替换当前列表
                </button>
              </div>
              {parsedBatch.length > 0 && (
                <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border border-blue-100 bg-white/80 p-2">
                  {parsedBatch.map((record, index) => (
                    <div key={`${record.role}-${record.organization}-${index}`} className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="truncate">
                        {[record.organization, record.role].filter(Boolean).join(" · ") || "学术兼职"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={parsedBatch.length === 0}
                  onClick={applyBatch}
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  应用识别结果
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBatchMode(false);
                    setBatchText("");
                  }}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addRecord}
                className="flex-1 px-4 py-2 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1" /> 逐条添加
              </button>
              <button
                type="button"
                onClick={() => {
                  setBatchMode(true);
                  setBatchText("");
                  setBatchStrategy("append");
                }}
                className="flex-1 px-4 py-2 border border-dashed border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
              >
                批量导入
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onSubmit(cleanRecords)}
            disabled={cleanRecords.length === 0}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
