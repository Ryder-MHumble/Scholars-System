import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Loader2,
  FileSpreadsheet,
  ArrowRight,
  ChevronLeft,
  Info,
  FileCheck2,
  Upload,
  ShieldAlert,
} from "lucide-react";
import {
  smartParseExcel,
  type SmartParseResult,
} from "@/utils/smartExcelParser";
import {
  importScholarData,
  type ScholarImportResult,
} from "@/utils/scholarImportHandler";
import { downloadScholarTemplate } from "@/utils/scholarTemplateGenerator";

interface ScholarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  urlHash: string;
  scholarName: string;
  onSuccess?: () => void;
}

type ImportType = "basic" | "education" | "achievements" | "all";
type ModalStep = 1 | 2 | 3;

const STEP_LABELS = ["了解须知", "上传文件", "核对确认"];

const IMPORT_TYPES: {
  value: ImportType;
  label: string;
  desc: string;
  fields: string[];
}[] = [
  {
    value: "basic",
    label: "基本信息",
    desc: "姓名、邮箱、职称、院校等",
    fields: ["姓名", "英文名", "职称", "院校", "院系", "邮箱", "电话", "主页", "研究方向"],
  },
  {
    value: "education",
    label: "教育经历",
    desc: "学位、院校、专业、年份等",
    fields: ["学位", "院校", "专业", "起始年份", "结束年份"],
  },
  {
    value: "achievements",
    label: "成就数据",
    desc: "论文、专利、奖项等",
    fields: ["论文标题", "会议/期刊", "专利名称", "奖项名称", "年份"],
  },
  {
    value: "all",
    label: "全部数据",
    desc: "包含以上所有类型",
    fields: ["所有字段"],
  },
];

function StepIndicator({ current }: { current: ModalStep }) {
  return (
    <div className="flex items-center px-6 py-3 border-b border-gray-100 bg-gray-50/80">
      {STEP_LABELS.map((label, idx) => {
        const num = (idx + 1) as ModalStep;
        const isActive = current === num;
        const isDone = current > num;
        return (
          <div key={num} className="flex items-center">
            {idx > 0 && (
              <div
                className={`h-px w-10 mx-2 transition-colors ${isDone ? "bg-primary-400" : "bg-gray-200"}`}
              />
            )}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-200"
                    : isDone
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {isDone ? "✓" : num}
              </div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? "text-primary-700"
                    : isDone
                      ? "text-green-600"
                      : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Extract a field value from a parsed row
function getField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return "";
}

export function ScholarImportModal({
  isOpen,
  onClose,
  urlHash,
  scholarName,
  onSuccess,
}: ScholarImportModalProps) {
  const [step, setStep] = useState<ModalStep>(1);
  const [selectedType, setSelectedType] = useState<ImportType>("all");
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<SmartParseResult<
    Record<string, unknown>
  > | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] =
    useState<ScholarImportResult | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) await handleFileSelect(droppedFile);
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setParseResult(null);
    try {
      const result = await smartParseExcel<Record<string, unknown>>(
        selectedFile,
        "scholar",
      );
      setParseResult(result);
    } catch (err) {
      setParseResult({
        data: [],
        detectedColumns: [],
        errors: [
          { row: 0, error: err instanceof Error ? err.message : "解析失败" },
        ],
        confidence: 0,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
    e.target.value = "";
  };

  const handleDownloadTemplate = () => {
    downloadScholarTemplate(undefined, selectedType);
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.data.length === 0) return;
    setIsImporting(true);
    try {
      const importedData: Parameters<typeof importScholarData>[1] = {};
      if (selectedType === "all" || selectedType === "basic") {
        const basicRows = parseResult.data.slice(0, 1);
        if (basicRows.length > 0) {
          importedData.basicInfo = basicRows[0] as Record<string, string>;
        }
      }
      if (selectedType === "all" || selectedType === "education") {
        importedData.education = parseResult.data as Record<string, string>[];
      }
      if (selectedType === "all" || selectedType === "achievements") {
        importedData.publications = parseResult.data as Record<string, string>[];
        importedData.patents = parseResult.data as Record<string, string>[];
        importedData.awards = parseResult.data as Record<string, string>[];
      }
      const result = await importScholarData(urlHash, importedData);
      setImportResult(result);
      if (result.success) {
        setTimeout(() => {
          handleClose();
          onSuccess?.();
        }, 2000);
      }
    } catch (err) {
      setImportResult({
        success: false,
        basicInfoUpdated: false,
        educationUpdated: false,
        achievementsUpdated: false,
        errors: [err instanceof Error ? err.message : "导入失败"],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType("all");
    setFile(null);
    setParseResult(null);
    setIsProcessing(false);
    setIsImporting(false);
    setImportResult(null);
    onClose();
  };

  const canProceedToStep3 =
    parseResult !== null && !isProcessing && parseResult.data.length > 0;

  const selectedTypeInfo = IMPORT_TYPES.find((t) => t.value === selectedType)!;

  const confidencePct = parseResult
    ? Math.round(parseResult.confidence * 100)
    : 0;
  const confidenceLabel =
    confidencePct >= 80 ? "高" : confidencePct >= 60 ? "中" : "低";
  const confidenceColor =
    confidencePct >= 80
      ? "text-green-600"
      : confidencePct >= 60
        ? "text-amber-600"
        : "text-red-600";
  const confidenceBarColor =
    confidencePct >= 80
      ? "bg-green-500"
      : confidencePct >= 60
        ? "bg-amber-500"
        : "bg-red-500";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col"
        >
          {/* ── Header ── */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">导入学者数据</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  当前学者：{scholarName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Step Indicator ── */}
          <StepIndicator current={step} />

          {/* ── Content ── */}
          <div className="flex-1 overflow-y-auto">
            {/* ──────────── STEP 1: 了解须知 & 选择类型 ──────────── */}
            {step === 1 && (
              <div className="p-6 space-y-4">
                {/* Overwrite warning - prominent red */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-red-800">
                      重要提示：导入将覆盖现有数据
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {[
                      "导入后，对应类型的数据将被新数据完全替换，无法撤销",
                      "建议在导入前先导出当前数据进行备份",
                      "若只需更新部分字段，请选择对应的导入类型（避免选「全部数据」）",
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                        <span className="flex-shrink-0 mt-0.5">•</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Import type selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                    选择导入类型
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {IMPORT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                          selectedType === type.value
                            ? "border-primary-500 bg-primary-50 shadow-sm"
                            : "border-gray-200 hover:border-primary-300 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`text-sm font-semibold ${
                            selectedType === type.value
                              ? "text-primary-800"
                              : "text-gray-800"
                          }`}
                        >
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {type.desc}
                        </div>
                        {selectedType === type.value && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {type.fields.slice(0, 4).map((f) => (
                              <span
                                key={f}
                                className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded"
                              >
                                {f}
                              </span>
                            ))}
                            {type.fields.length > 4 && (
                              <span className="text-xs text-primary-500">
                                +{type.fields.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-blue-800">
                      操作步骤
                    </span>
                  </div>
                  <ol className="space-y-1.5">
                    {[
                      `选择导入类型（当前：${selectedTypeInfo.label}）`,
                      "下载对应的 Excel 模板并填写数据",
                      "上传文件，系统自动识别并解析",
                      "在第三步核对内容后确认导入",
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
                        <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {text}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Template download */}
                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      下载「{selectedTypeInfo.label}」模板
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      含字段说明，确保格式正确
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    下载模板
                  </button>
                </div>
              </div>
            )}

            {/* ──────────── STEP 2: 上传文件 ──────────── */}
            {step === 2 && (
              <div className="p-6 space-y-4">
                {/* Type reminder */}
                <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span className="text-xs text-primary-700">
                    当前导入类型：
                    <span className="font-semibold">{selectedTypeInfo.label}</span>
                    （{selectedTypeInfo.desc}）
                  </span>
                </div>

                {!file ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl transition-all ${
                      isDragging
                        ? "border-primary-500 bg-primary-50 scale-[1.01]"
                        : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                          isDragging ? "bg-primary-100" : "bg-gray-100"
                        }`}
                      >
                        <Upload
                          className={`w-7 h-7 transition-colors ${isDragging ? "text-primary-500" : "text-gray-400"}`}
                        />
                      </div>
                      <p className="text-base font-medium text-gray-700 mb-1">
                        拖拽 Excel 文件至此处
                      </p>
                      <p className="text-sm text-gray-400 mb-4">
                        或点击下方按钮选择文件
                      </p>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileInputChange}
                        className="hidden"
                        id="scholar-import-file-input"
                      />
                      <label
                        htmlFor="scholar-import-file-input"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        选择 Excel 文件
                      </label>
                      <p className="text-xs text-gray-400 mt-3">
                        支持 .xlsx、.xls 格式
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <FileCheck2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setFile(null);
                          setParseResult(null);
                        }}
                        className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
                      >
                        重新选择
                      </button>
                    </div>

                    <div className="p-4">
                      {isProcessing && (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 text-primary-500 animate-spin flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              正在智能识别文件结构...
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              自动匹配列名与字段
                            </p>
                          </div>
                        </div>
                      )}
                      {parseResult && !isProcessing && (
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-gray-600">
                                识别质量
                              </span>
                              <span
                                className={`text-xs font-bold ${confidenceColor}`}
                              >
                                {confidenceLabel} · {confidencePct}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-full rounded-full transition-all ${confidenceBarColor}`}
                                style={{ width: `${confidencePct}%` }}
                              />
                            </div>
                          </div>
                          {parseResult.data.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-gray-700">
                                解析完成，共识别到{" "}
                                <span className="font-bold text-gray-900">
                                  {parseResult.data.length}
                                </span>{" "}
                                行数据
                              </span>
                            </div>
                          )}
                          {parseResult.errors.length > 0 && (
                            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                              <div className="flex items-center gap-2 mb-1.5">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="text-sm font-medium text-red-800">
                                  发现 {parseResult.errors.length} 个解析问题
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {parseResult.errors.slice(0, 3).map((err, i) => (
                                  <li key={i} className="text-xs text-red-700">
                                    {err.row > 0 ? `第 ${err.row} 行：` : ""}
                                    {err.error}
                                  </li>
                                ))}
                                {parseResult.errors.length > 3 && (
                                  <li className="text-xs text-red-500">
                                    ...还有 {parseResult.errors.length - 3} 个问题
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──────────── STEP 3: 核对确认 ──────────── */}
            {step === 3 && parseResult && (
              <div className="p-6 space-y-4">
                {/* Import result */}
                {importResult ? (
                  <div
                    className={`rounded-xl p-4 border ${
                      importResult.success
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          importResult.success ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {importResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-bold ${importResult.success ? "text-green-900" : "text-red-900"}`}
                        >
                          {importResult.success ? "导入成功" : "导入失败"}
                        </p>
                        {importResult.success && (
                          <ul className="mt-1.5 space-y-1">
                            {importResult.basicInfoUpdated && (
                              <li className="text-xs text-green-700">
                                ✓ 基本信息已更新
                              </li>
                            )}
                            {importResult.educationUpdated && (
                              <li className="text-xs text-green-700">
                                ✓ 教育经历已更新
                              </li>
                            )}
                            {importResult.achievementsUpdated && (
                              <li className="text-xs text-green-700">
                                ✓ 成就数据已更新
                              </li>
                            )}
                            <li className="text-xs text-gray-400 mt-1">
                              窗口将自动关闭
                            </li>
                          </ul>
                        )}
                        {importResult.errors.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {importResult.errors.map((err, i) => (
                              <li key={i} className="text-xs text-red-700">
                                • {err}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Overwrite reminder */}
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-700">
                        <span className="font-semibold">确认前请仔细核对：</span>
                        导入「{selectedTypeInfo.label}」后，
                        {scholarName} 的对应数据将被以下内容完全替换，此操作不可撤销。
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <FileSpreadsheet className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedTypeInfo.label} · {parseResult.data.length} 行数据
                        </p>
                        <p className="text-xs text-gray-500">
                          识别质量：{confidenceLabel} ({confidencePct}%) ·{" "}
                          {parseResult.detectedColumns.length} 个字段已映射
                        </p>
                      </div>
                    </div>

                    {/* Column mapping summary */}
                    {parseResult.detectedColumns.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          已识别的列映射
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {parseResult.detectedColumns.map((col, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200"
                            >
                              <span className="font-medium">{col.excelHeader}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-primary-600">{col.mappedKey}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Data preview table */}
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">
                        数据预览
                        <span className="text-xs font-normal text-gray-400 ml-2">
                          共 {parseResult.data.length} 行 · 仅显示前 10 行
                        </span>
                      </p>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="overflow-auto max-h-60">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-3 py-2.5 text-center text-gray-500 font-medium w-8">
                                  #
                                </th>
                                {Object.keys(
                                  parseResult.data[0] as Record<string, unknown>,
                                )
                                  .slice(0, 6)
                                  .map((col) => (
                                    <th
                                      key={col}
                                      className="px-3 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap"
                                    >
                                      {col}
                                    </th>
                                  ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {parseResult.data
                                .slice(0, 10)
                                .map((row, idx) => {
                                  const r = row as Record<string, unknown>;
                                  const cols = Object.keys(r).slice(0, 6);
                                  return (
                                    <tr
                                      key={idx}
                                      className="hover:bg-blue-50/30"
                                    >
                                      <td className="px-3 py-2 text-center text-gray-400">
                                        {idx + 1}
                                      </td>
                                      {cols.map((col) => (
                                        <td
                                          key={col}
                                          className="px-3 py-2 text-gray-700 max-w-[140px]"
                                        >
                                          <span
                                            className="block truncate"
                                            title={String(r[col] ?? "")}
                                          >
                                            {r[col] !== undefined &&
                                            r[col] !== null &&
                                            String(r[col]).trim() !== "" ? (
                                              String(r[col])
                                            ) : (
                                              <span className="text-gray-300">
                                                —
                                              </span>
                                            )}
                                          </span>
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                        {parseResult.data.length > 10 && (
                          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-400">
                              还有 {parseResult.data.length - 10} 行数据未显示
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/80 flex-shrink-0">
            <div>
              {step === 1 && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  取消
                </button>
              )}
              {step > 1 && !importResult && (
                <button
                  onClick={() => setStep((s) => (s - 1) as ModalStep)}
                  disabled={isImporting}
                  className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  返回
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step === 1 && (
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  去上传文件
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedToStep3}
                  className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  查看解析结果
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && !importResult && (
                <button
                  onClick={handleImport}
                  disabled={
                    !parseResult ||
                    parseResult.data.length === 0 ||
                    isImporting
                  }
                  className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      导入中...
                    </>
                  ) : (
                    <>
                      确认导入 {parseResult?.data.length ?? 0} 条数据
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {step === 3 && importResult && (
                <button
                  onClick={handleClose}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  关闭
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
