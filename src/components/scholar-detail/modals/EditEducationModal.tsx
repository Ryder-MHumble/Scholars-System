import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import type { EducationRecord } from "@/services/scholarApi";
import { parseEducationFromText } from "@/utils/textParsers";

interface EditEducationModalProps {
  education: EducationRecord[];
  onClose: () => void;
  onSubmit: (records: EducationRecord[]) => void;
}

export function EditEducationModal({
  education,
  onClose,
  onSubmit,
}: EditEducationModalProps) {
  const [records, setRecords] = useState<EducationRecord[]>(education);
  const [batchMode, setBatchMode] = useState(false);
  const [batchText, setBatchText] = useState("");

  const addRecord = () => {
    setRecords((prev) => [
      ...prev,
      { degree: "", institution: "", major: "", year: "", end_year: "" },
    ]);
  };

  const removeRecord = (i: number) => {
    setRecords((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateRecord = (
    i: number,
    field: keyof EducationRecord,
    val: string,
  ) => {
    setRecords((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: val };
      return updated;
    });
  };

  const applyBatch = () => {
    const newRecs = parseEducationFromText(batchText);
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
            编辑教育经历
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
                  经历 {i + 1}
                </span>
                <button
                  onClick={() => removeRecord(i)}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  删除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={rec.degree?.toString() || ""}
                  onChange={(e) => updateRecord(i, "degree", e.target.value)}
                  placeholder="学位（博士/硕士/学士）"
                  className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <input
                  value={rec.year?.toString() || ""}
                  onChange={(e) => updateRecord(i, "year", e.target.value)}
                  placeholder="入学年份"
                  className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <input
                value={rec.institution?.toString() || ""}
                onChange={(e) => updateRecord(i, "institution", e.target.value)}
                placeholder="学校名称"
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <input
                value={rec.major?.toString() || ""}
                onChange={(e) => updateRecord(i, "major", e.target.value)}
                placeholder="专业方向"
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <input
                value={rec.end_year?.toString() || ""}
                onChange={(e) => updateRecord(i, "end_year", e.target.value)}
                placeholder="毕业年份"
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
          ))}

          {batchMode ? (
            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/30 space-y-2">
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-medium">
                  支持直接粘贴简历中的教育经历，自动识别以下格式：
                </p>
                <p className="text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded leading-relaxed text-[11px]">
                  2015-02至2018-04, 美国明尼苏达大学, 电子与计算机工程, 博士
                  <br />
                  2006/11 to 2009/10 Bonn University PhD in Mathematical Physics
                  <br />
                  2001/10 to 2006/10 Bonn University Bachelor and Master in
                  Physics
                </p>
                <p className="text-gray-400">
                  也支持：学位 | 学校 | 专业 | 入学年份 | 毕业年份（旧格式）
                </p>
              </div>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                autoFocus
                rows={6}
                placeholder={
                  "2015-02至2018-04, 美国明尼苏达大学, 电子与计算机工程, 博士\n2011-09至2018-03, 北京理工大学, 控制科学与工程, 博士\n2007-09至2011-06, 北京理工大学, 电气工程及其自动化, 学士"
                }
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={applyBatch}
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  确认导入 ({parseEducationFromText(batchText).length} 条)
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
