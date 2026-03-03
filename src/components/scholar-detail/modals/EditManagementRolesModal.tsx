import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import type { ManagementRole } from "@/services/facultyApi";

interface EditManagementRolesModalProps {
  roles: ManagementRole[];
  onClose: () => void;
  onSubmit: (records: ManagementRole[]) => void;
}

export function EditManagementRolesModal({
  roles,
  onClose,
  onSubmit,
}: EditManagementRolesModalProps) {
  const [records, setRecords] = useState<ManagementRole[]>(roles);
  const [batchMode, setBatchMode] = useState(false);
  const [batchText, setBatchText] = useState("");

  const addRecord = () => {
    setRecords((prev) => [
      ...prev,
      { role: "", organization: "", start_year: "", end_year: "" },
    ]);
  };

  const removeRecord = (i: number) => {
    setRecords((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateRecord = (i: number, field: keyof ManagementRole, val: string) => {
    setRecords((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: val };
      return updated;
    });
  };

  const applyBatch = () => {
    const newRecs = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const p = line.split("|").map((s) => s.trim());
        return {
          role: p[0] || "",
          organization: p[1] || "",
          start_year: p[2] || "",
          end_year: p[3] || "",
        } as ManagementRole;
      });
    setRecords((prev) => [...prev, ...newRecs]);
    setBatchMode(false);
    setBatchText("");
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
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            编辑任职经历
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {records.map((rec, i) => (
            <div
              key={i}
              className="p-3 border border-gray-200 rounded-lg space-y-2"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-gray-500">
                  职务 {i + 1}
                </span>
                <button
                  onClick={() => removeRecord(i)}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  删除
                </button>
              </div>
              <input
                value={rec.role?.toString() || ""}
                onChange={(e) => updateRecord(i, "role", e.target.value)}
                placeholder="职务名称"
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <input
                value={rec.organization?.toString() || ""}
                onChange={(e) =>
                  updateRecord(i, "organization", e.target.value)
                }
                placeholder="所属机构"
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={rec.start_year?.toString() || ""}
                  onChange={(e) => updateRecord(i, "start_year", e.target.value)}
                  placeholder="开始年份"
                  className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  value={rec.end_year?.toString() || ""}
                  onChange={(e) => updateRecord(i, "end_year", e.target.value)}
                  placeholder="结束年份"
                  className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
            </div>
          ))}

          {batchMode ? (
            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/30 space-y-2">
              <p className="text-xs text-gray-500">
                每行一条，字段用{" "}
                <code className="bg-gray-100 px-1 rounded font-mono">|</code>{" "}
                分隔：
                <code className="bg-gray-100 px-1 rounded font-mono text-xs">
                  职务 | 机构 | 开始年份 | 结束年份
                </code>
              </p>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                autoFocus
                rows={5}
                placeholder={
                  "顾问委员会委员 | IEEE | 2020 | 2024\n兼职教授 | 清华大学 | 2018 | 2022"
                }
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={applyBatch}
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  确认导入 (
                  {batchText.split("\n").filter((l) => l.trim()).length} 条)
                </button>
                <button
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
                onClick={addRecord}
                className="flex-1 px-4 py-2 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1" /> 逐条添加
              </button>
              <button
                onClick={() => {
                  setBatchMode(true);
                  setBatchText("");
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
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onSubmit(records)}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
