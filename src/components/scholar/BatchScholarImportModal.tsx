import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
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
} from "lucide-react";
import {
  smartParseExcel,
  type SmartParseResult,
} from "@/utils/smartExcelParser";
import { downloadScholarTemplate } from "@/utils/scholarTemplateGenerator";
import { createScholar, type ScholarCreate } from "@/services/scholarApi";

interface BatchScholarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalStep = 1 | 2 | 3;

// Extract a field value from a parsed row, trying multiple possible key names
function getField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return "";
}

const STEP_LABELS = ["了解须知", "上传文件", "核对确认"];

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

export function BatchScholarImportModal({
  isOpen,
  onClose,
  onSuccess,
}: BatchScholarImportModalProps) {
  const [step, setStep] = useState<ModalStep>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<SmartParseResult<
    Record<string, unknown>
  > | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    successCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setImportResult(null);
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
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleClearFile = () => {
    setFile(null);
    setParseResult(null);
    setImportResult(null);
  };

  const handleDownloadTemplate = () => {
    downloadScholarTemplate(undefined, "basic");
  };

  // Derive valid/invalid rows from parseResult
  const rows = parseResult?.data ?? [];
  const validRows = rows.filter((row) => {
    const r = row as Record<string, unknown>;
    return getField(r, "name", "姓名", "Name").length > 0;
  });
  const invalidRows = rows.length - validRows.length;

  const handleImport = async () => {
    if (!parseResult || validRows.length === 0) return;
    setIsImporting(true);

    const scholars: ScholarCreate[] = validRows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        name: getField(r, "name", "姓名"),
        name_en: getField(r, "nameEn", "name_en", "英文名") || undefined,
        position: getField(r, "title", "position", "职称") || undefined,
        university:
          getField(r, "university", "institution", "院校") || undefined,
        department: getField(r, "department", "院系") || undefined,
        email: getField(r, "email", "邮箱") || undefined,
        phone: getField(r, "phone", "电话") || undefined,
        profile_url:
          getField(r, "homepage", "profile_url", "主页") || undefined,
        google_scholar_url:
          getField(r, "google_scholar", "googleScholar", "谷歌学术") ||
          undefined,
        dblp_url: getField(r, "dblp", "dblp_url") || undefined,
        research_areas: getField(
          r,
          "researchFields",
          "research_areas",
          "研究方向",
        )
          .split(/[,，、;；]/)
          .map((s) => s.trim())
          .filter(Boolean),
        bio: getField(r, "bio", "简介") || undefined,
        added_by: "user",
      };
    });

    const errors: string[] = [];
    let successCount = 0;
    for (let i = 0; i < scholars.length; i++) {
      try {
        await createScholar(scholars[i]);
        successCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "未知错误";
        errors.push(`第 ${i + 2} 行 (${scholars[i].name}): ${errorMsg}`);
      }
    }
    const failedCount = scholars.length - successCount;
    setImportResult({
      success: successCount > 0,
      successCount,
      failedCount,
      errors,
    });
    setIsImporting(false);

    if (successCount > 0) {
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2500);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setParseResult(null);
    setIsProcessing(false);
    setIsImporting(false);
    setImportResult(null);
    onClose();
  };

  const canProceedToStep3 =
    parseResult !== null && !isProcessing && parseResult.data.length > 0;

  if (!isOpen) return null;

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

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col"
        >
          {/* ── Header ── */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  批量添加学者
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  通过 Excel 文件快速导入多位学者
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
            {/* ──────────── STEP 1: 了解须知 ──────────── */}
            {step === 1 && (
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* ── Left: steps + download ── */}
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Info className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-blue-900">
                          操作步骤
                        </span>
                      </div>
                      <ol className="space-y-3">
                        {[
                          {
                            text: "下载右侧标准 Excel 模板文件",
                            sub: "含所有字段说明",
                          },
                          {
                            text: "按模板列名填写学者信息",
                            sub: "每行一位学者",
                          },
                          {
                            text: "上传文件，系统自动识别列结构",
                            sub: "支持中英文列名",
                          },
                          { text: "预览无误后确认导入", sub: "操作完成" },
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-blue-200">
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-sm text-gray-800 font-medium leading-snug">
                                {item.text}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {item.sub}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Download className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-tight">
                            Excel 标准模板
                          </p>
                          <p className="text-xs text-gray-400">
                            含字段说明与示例数据
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleDownloadTemplate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        下载模板
                      </button>
                    </div>
                  </div>

                  {/* ── Right: field hints + cautions ── */}
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-700">
                          字段填写说明
                        </p>
                        <span className="text-xs text-gray-400">
                          <span className="text-red-400 font-bold">*</span>{" "}
                          为必填
                        </span>
                      </div>
                      <div className="overflow-y-auto max-h-52">
                        <table className="w-full text-xs">
                          <tbody className="divide-y divide-gray-50">
                            {[
                              {
                                label: "姓名",
                                required: true,
                                hint: "完整中文或英文姓名",
                              },
                              {
                                label: "英文名",
                                required: false,
                                hint: "拼音或英文全名",
                              },
                              {
                                label: "职称",
                                required: false,
                                hint: "如 教授、副教授、研究员",
                              },
                              {
                                label: "所属院校",
                                required: false,
                                hint: "机构全称，如 北京大学",
                              },
                              {
                                label: "院系/部门",
                                required: false,
                                hint: "如 计算机科学系",
                              },
                              {
                                label: "邮箱",
                                required: false,
                                hint: "学术邮箱地址",
                              },
                              {
                                label: "研究方向",
                                required: false,
                                hint: "多个方向用逗号/分号分隔",
                              },
                              {
                                label: "主页",
                                required: false,
                                hint: "个人主页 URL",
                              },
                              {
                                label: "谷歌学术",
                                required: false,
                                hint: "Google Scholar 链接",
                              },
                              {
                                label: "DBLP",
                                required: false,
                                hint: "DBLP 页面链接",
                              },
                              {
                                label: "简介",
                                required: false,
                                hint: "个人简介，可留空",
                              },
                            ].map((col) => (
                              <tr
                                key={col.label}
                                className={col.required ? "bg-red-50/30" : ""}
                              >
                                <td className="pl-4 pr-2 py-2 w-24 shrink-0">
                                  <span
                                    className={`inline-flex items-center font-semibold whitespace-nowrap ${col.required ? "text-gray-800" : "text-gray-500"}`}
                                  >
                                    {col.label}
                                    {col.required && (
                                      <span className="text-red-500 ml-0.5">
                                        *
                                      </span>
                                    )}
                                  </span>
                                </td>
                                <td className="px-2 py-2">
                                  <span
                                    className={
                                      col.required
                                        ? "text-primary-600 bg-primary-50 border border-primary-100 rounded px-1.5 py-0.5 font-medium text-xs"
                                        : "text-gray-400 text-xs"
                                    }
                                  >
                                    {col.hint}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <span className="text-sm font-semibold text-amber-900">
                          注意事项
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {[
                          "「姓名」为唯一必填项，缺少姓名的行将自动跳过",
                          "重复导入同一学者会创建重复记录，请先检查",
                          "系统支持中英文列名自动识别",
                          "导入后不可撤销，请核对后再提交",
                        ].map((text, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-amber-800"
                          >
                            <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ──────────── STEP 2: 上传文件 ──────────── */}
            {step === 2 && (
              <div className="p-6 space-y-4">
                {!file ? (
                  /* Drop zone */
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
                    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                          isDragging ? "bg-primary-100" : "bg-gray-100"
                        }`}
                      >
                        <Upload
                          className={`w-8 h-8 transition-colors ${isDragging ? "text-primary-500" : "text-gray-400"}`}
                        />
                      </div>
                      <p className="text-base font-medium text-gray-700 mb-1">
                        拖拽 Excel 文件至此处
                      </p>
                      <p className="text-sm text-gray-400 mb-5">
                        或点击下方按钮选择文件
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileInputChange}
                        className="hidden"
                        id="batch-scholar-file-input"
                      />
                      <label
                        htmlFor="batch-scholar-file-input"
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
                  /* File selected state */
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* File info bar */}
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
                        onClick={handleClearFile}
                        className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
                      >
                        重新选择
                      </button>
                    </div>

                    {/* Parse status */}
                    <div className="p-4">
                      {isProcessing && (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 text-primary-500 animate-spin flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              正在智能识别文件结构...
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              自动匹配列名与字段映射
                            </p>
                          </div>
                        </div>
                      )}

                      {parseResult && !isProcessing && (
                        <div className="space-y-3">
                          {/* Confidence bar */}
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

                          {/* Parse summary */}
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

                          {/* Parse errors */}
                          {parseResult.errors.length > 0 && (
                            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="text-sm font-medium text-red-800">
                                  发现 {parseResult.errors.length} 个解析问题
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {parseResult.errors
                                  .slice(0, 3)
                                  .map((err, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-red-700"
                                    >
                                      {err.row > 0 ? `第 ${err.row} 行：` : ""}
                                      {err.error}
                                    </li>
                                  ))}
                                {parseResult.errors.length > 3 && (
                                  <li className="text-xs text-red-500">
                                    ...还有 {parseResult.errors.length - 3}{" "}
                                    个问题
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

                {/* Hint */}
                {!file && (
                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      系统支持自动识别中英文列名，无需严格按模板格式。
                      但使用标准模板可获得最佳识别效果。
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ──────────── STEP 3: 核对确认 ──────────── */}
            {step === 3 && parseResult && (
              <div className="p-6 space-y-4">
                {/* Import result (shown after import) */}
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
                          {importResult.success ? "导入完成" : "导入失败"}
                        </p>
                        <p className="text-xs mt-1 text-gray-600">
                          成功导入{" "}
                          <span className="font-bold text-green-700">
                            {importResult.successCount}
                          </span>{" "}
                          位学者
                          {importResult.failedCount > 0 && (
                            <>
                              ，其中{" "}
                              <span className="font-bold text-red-600">
                                {importResult.failedCount}
                              </span>{" "}
                              位失败
                            </>
                          )}
                          {importResult.success && (
                            <span className="text-gray-400 ml-1">
                              · 窗口将自动关闭
                            </span>
                          )}
                        </p>
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
                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                        <p className="text-xl font-black text-gray-800">
                          {rows.length}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">总计行数</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                        <p className="text-xl font-black text-green-700">
                          {validRows.length}
                        </p>
                        <p className="text-xs text-green-600 mt-0.5">
                          有效记录
                        </p>
                      </div>
                      <div
                        className={`rounded-xl p-3 text-center border ${
                          invalidRows > 0
                            ? "bg-red-50 border-red-100"
                            : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <p
                          className={`text-xl font-black ${invalidRows > 0 ? "text-red-600" : "text-gray-400"}`}
                        >
                          {invalidRows}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${invalidRows > 0 ? "text-red-500" : "text-gray-400"}`}
                        >
                          将被跳过
                        </p>
                      </div>
                    </div>

                    {/* Warning when some rows will be skipped */}
                    {invalidRows > 0 && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          <span className="font-medium">{invalidRows} 行</span>
                          缺少姓名字段（必填），将在导入时自动跳过。
                          {parseResult.errors.length > 0 && (
                            <> 另有 {parseResult.errors.length} 个格式警告。</>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Data Preview Table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-800">
                          数据预览
                          <span className="text-xs font-normal text-gray-400 ml-2">
                            共 {rows.length} 条，请核对内容后再导入
                          </span>
                        </p>
                      </div>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="overflow-auto max-h-72">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-3 py-2.5 text-center text-gray-500 font-medium w-8 sticky left-0 bg-gray-50">
                                  #
                                </th>
                                <th className="px-3 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap">
                                  姓名{" "}
                                  <span className="text-red-400 font-normal">
                                    *必填
                                  </span>
                                </th>
                                <th className="px-3 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap">
                                  职称
                                </th>
                                <th className="px-3 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap">
                                  院校
                                </th>
                                <th className="px-3 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap">
                                  院系
                                </th>
                                <th className="px-3 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap">
                                  研究方向
                                </th>
                                <th className="px-3 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap">
                                  邮箱
                                </th>
                                <th className="px-3 py-2.5 text-center text-gray-500 font-medium whitespace-nowrap">
                                  状态
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {rows.map((row, idx) => {
                                const r = row as Record<string, unknown>;
                                const name = getField(r, "name", "姓名");
                                const position = getField(
                                  r,
                                  "position",
                                  "title",
                                  "职称",
                                );
                                const university = getField(
                                  r,
                                  "university",
                                  "institution",
                                  "院校",
                                );
                                const department = getField(
                                  r,
                                  "department",
                                  "院系",
                                );
                                const researchAreas = getField(
                                  r,
                                  "researchFields",
                                  "research_areas",
                                  "研究方向",
                                );
                                const email = getField(r, "email", "邮箱");
                                const isInvalid = !name;
                                return (
                                  <tr
                                    key={idx}
                                    className={
                                      isInvalid
                                        ? "bg-red-50/60 hover:bg-red-50"
                                        : "hover:bg-blue-50/30"
                                    }
                                  >
                                    <td className="px-3 py-2 text-center text-gray-400 sticky left-0 bg-inherit">
                                      {idx + 1}
                                    </td>
                                    <td className="px-3 py-2 font-medium">
                                      {name ? (
                                        <span className="text-gray-800">
                                          {name}
                                        </span>
                                      ) : (
                                        <span className="text-red-400 italic">
                                          (缺失)
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                      {position || (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                      {university || (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                      {department || (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600 max-w-[140px]">
                                      <span
                                        className="block truncate"
                                        title={researchAreas}
                                      >
                                        {researchAreas || (
                                          <span className="text-gray-300">
                                            —
                                          </span>
                                        )}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-600 max-w-[160px]">
                                      <span className="block truncate">
                                        {email || (
                                          <span className="text-gray-300">
                                            —
                                          </span>
                                        )}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {isInvalid ? (
                                        <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                                          ✗{" "}
                                          <span className="hidden sm:inline">
                                            跳过
                                          </span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-green-500 text-xs font-medium">
                                          ✓{" "}
                                          <span className="hidden sm:inline">
                                            有效
                                          </span>
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {rows.length === 0 && (
                          <div className="py-8 text-center text-gray-400 text-sm">
                            未解析到任何数据行
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
            {/* Left: cancel / back */}
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
                  className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  disabled={isImporting}
                >
                  <ChevronLeft className="w-4 h-4" />
                  返回
                </button>
              )}
            </div>

            {/* Right: next / confirm */}
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
                    validRows.length === 0 || isImporting || !!importResult
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
                      确认导入 {validRows.length} 位学者
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
