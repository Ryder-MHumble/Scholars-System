import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileSpreadsheet,
  ArrowRight,
  ChevronLeft,
  Info,
  FileCheck2,
} from "lucide-react";
import type { ExcelColumn, ImportProgress } from "@/types/import";
import { parseExcelFile, downloadExcelTemplate } from "@/utils/excelParser";

interface ExcelImportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: T[]) => Promise<void>;
  columns: ExcelColumn[];
  title: string;
  templateFilename: string;
  /** Extra caution notes specific to this import type */
  cautionNotes?: string[];
}

type ModalStep = 1 | 2 | 3;

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

export function ExcelImportModal<T>({
  isOpen,
  onClose,
  onImport,
  columns,
  title,
  templateFilename,
  cautionNotes,
}: ExcelImportModalProps<T>) {
  const [step, setStep] = useState<ModalStep>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<T[]>([]);
  const [errors, setErrors] = useState<Array<{ row: number; error: string }>>(
    [],
  );
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const requiredCols = columns.filter((c) => c.required);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile &&
        (droppedFile.name.endsWith(".xlsx") ||
          droppedFile.name.endsWith(".xls"))
      ) {
        await handleFileSelect(droppedFile);
      }
    },
    [columns],
  );

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);
    setParsedData([]);
    setProgress(null);
    setImportDone(false);
    try {
      const result = await parseExcelFile<T>(selectedFile, columns);
      setParsedData(result.data);
      setErrors(result.errors);
    } catch (err) {
      setErrors([
        { row: 0, error: err instanceof Error ? err.message : "解析失败" },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);
    setProgress({
      total: parsedData.length,
      processed: 0,
      successful: 0,
      failed: 0,
      duplicates: 0,
    });
    try {
      await onImport(parsedData);
      setProgress({
        total: parsedData.length,
        processed: parsedData.length,
        successful: parsedData.length,
        failed: 0,
        duplicates: 0,
      });
      setImportDone(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setErrors([
        { row: 0, error: err instanceof Error ? err.message : "导入失败" },
      ]);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(columns, templateFilename);
  };

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setProgress(null);
    setIsProcessing(false);
    setIsImporting(false);
    setImportDone(false);
    onClose();
  };

  const canProceedToStep3 =
    parsedData.length > 0 && !isProcessing && errors.length === 0;

  if (!isOpen) return null;

  // Validate a row: check all required columns have values
  function rowIsValid(row: T): boolean {
    const r = row as Record<string, unknown>;
    return requiredCols.every((col) => {
      const val = r[col.key];
      return val !== undefined && val !== null && String(val).trim() !== "";
    });
  }

  const validCount = parsedData.filter(rowIsValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
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
                <FileSpreadsheet className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  通过 Excel 文件批量导入数据
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
              <div className="p-6 space-y-4">
                {/* Steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-blue-800">
                      如何使用批量导入
                    </span>
                  </div>
                  <ol className="space-y-2">
                    {[
                      "下载下方的标准 Excel 模板文件",
                      "按模板中的列名和说明填写数据，每行一条记录",
                      "上传填写完成的文件，系统自动解析",
                      "在第三步预览数据无误后，点击「确认导入」",
                    ].map((text, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-blue-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {text}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Required fields */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2.5">
                    字段说明
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {columns.map((col) => (
                      <span
                        key={col.key}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
                          col.required
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {col.label}
                        {col.required && (
                          <span className="text-red-400 font-bold">*</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    <span className="text-red-400">*</span> 标注为必填字段
                  </p>
                </div>

                {/* Cautions */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-amber-800">
                      使用前请注意
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {[
                      `必填字段（${requiredCols.map((c) => c.label).join("、")}）不能为空，否则该行将跳过`,
                      "请确保 Excel 文件第一行为列标题行",
                      "导入操作不可撤销，请在第三步核对数据无误后再提交",
                      ...(cautionNotes ?? []),
                    ].map((text, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-amber-800"
                      >
                        <span className="flex-shrink-0 mt-0.5">•</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Template Download */}
                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      下载 Excel 标准模板
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      含字段说明与列名，推荐使用标准模板
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
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileInputChange}
                        className="hidden"
                        id="excel-import-file-input"
                      />
                      <label
                        htmlFor="excel-import-file-input"
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
                          setParsedData([]);
                          setErrors([]);
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
                              正在解析文件...
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              验证字段格式与必填项
                            </p>
                          </div>
                        </div>
                      )}

                      {!isProcessing && parsedData.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">
                              解析完成，共识别到{" "}
                              <span className="font-bold text-gray-900">
                                {parsedData.length}
                              </span>{" "}
                              条记录
                            </span>
                          </div>
                          {errors.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-amber-700">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              发现 {errors.length} 个格式问题
                            </div>
                          )}
                        </div>
                      )}

                      {!isProcessing && errors.length > 0 && (
                        <div className="mt-3 bg-red-50 rounded-lg p-3 border border-red-100">
                          <p className="text-xs font-medium text-red-700 mb-2">
                            解析错误详情：
                          </p>
                          <ul className="space-y-1">
                            {errors.slice(0, 5).map((err, i) => (
                              <li key={i} className="text-xs text-red-600">
                                {err.row > 0 ? `第 ${err.row} 行：` : ""}
                                {err.error}
                              </li>
                            ))}
                            {errors.length > 5 && (
                              <li className="text-xs text-red-400">
                                ...还有 {errors.length - 5} 个错误
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──────────── STEP 3: 核对确认 ──────────── */}
            {step === 3 && (
              <div className="p-6 space-y-4">
                {/* Import progress/done */}
                {(progress || importDone) && (
                  <div
                    className={`rounded-xl p-4 border ${
                      importDone
                        ? "bg-green-50 border-green-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    {importDone ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-900">
                            导入完成
                          </p>
                          <p className="text-xs text-green-700 mt-0.5">
                            成功导入{" "}
                            <span className="font-bold">
                              {progress?.successful ?? parsedData.length}
                            </span>{" "}
                            条记录 · 窗口将自动关闭
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">导入进度</span>
                          <span className="font-medium text-gray-900">
                            {progress!.processed} / {progress!.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary-600 h-full transition-all duration-300 rounded-full"
                            style={{
                              width: `${(progress!.processed / progress!.total) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center pt-1">
                          <div>
                            <p className="text-lg font-black text-green-600">
                              {progress!.successful}
                            </p>
                            <p className="text-xs text-gray-500">成功</p>
                          </div>
                          <div>
                            <p className="text-lg font-black text-red-500">
                              {progress!.failed}
                            </p>
                            <p className="text-xs text-gray-500">失败</p>
                          </div>
                          <div>
                            <p className="text-lg font-black text-amber-500">
                              {progress!.duplicates}
                            </p>
                            <p className="text-xs text-gray-500">重复</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!progress && !importDone && (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                        <p className="text-xl font-black text-gray-800">
                          {parsedData.length}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">总计行数</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                        <p className="text-xl font-black text-green-700">
                          {validCount}
                        </p>
                        <p className="text-xs text-green-600 mt-0.5">
                          有效记录
                        </p>
                      </div>
                      <div
                        className={`rounded-xl p-3 text-center border ${
                          invalidCount > 0
                            ? "bg-red-50 border-red-100"
                            : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <p
                          className={`text-xl font-black ${invalidCount > 0 ? "text-red-600" : "text-gray-400"}`}
                        >
                          {invalidCount}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${invalidCount > 0 ? "text-red-500" : "text-gray-400"}`}
                        >
                          将被跳过
                        </p>
                      </div>
                    </div>

                    {invalidCount > 0 && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          <span className="font-medium">{invalidCount} 行</span>
                          缺少必填字段（
                          {requiredCols.map((c) => c.label).join("、")}
                          ），将在导入时自动跳过。
                        </p>
                      </div>
                    )}

                    {/* Data preview table */}
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">
                        数据预览
                        <span className="text-xs font-normal text-gray-400 ml-2">
                          共 {parsedData.length} 条，请核对后再导入
                        </span>
                      </p>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="overflow-auto max-h-72">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-3 py-2.5 text-center text-gray-500 font-medium w-8 sticky left-0 bg-gray-50">
                                  #
                                </th>
                                {columns.map((col) => (
                                  <th
                                    key={col.key}
                                    className="px-3 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap"
                                  >
                                    {col.label}
                                    {col.required && (
                                      <span className="text-red-400 ml-0.5">
                                        *
                                      </span>
                                    )}
                                  </th>
                                ))}
                                <th className="px-3 py-2.5 text-center text-gray-500 font-medium whitespace-nowrap">
                                  状态
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {parsedData.map((row, idx) => {
                                const r = row as Record<string, unknown>;
                                const valid = rowIsValid(row);
                                return (
                                  <tr
                                    key={idx}
                                    className={
                                      valid
                                        ? "hover:bg-blue-50/30"
                                        : "bg-red-50/60 hover:bg-red-50"
                                    }
                                  >
                                    <td className="px-3 py-2 text-center text-gray-400 sticky left-0 bg-inherit">
                                      {idx + 1}
                                    </td>
                                    {columns.map((col) => {
                                      const val = r[col.key];
                                      const hasValue =
                                        val !== undefined &&
                                        val !== null &&
                                        String(val).trim() !== "";
                                      return (
                                        <td
                                          key={col.key}
                                          className={`px-3 py-2 max-w-[150px] ${
                                            !hasValue && col.required
                                              ? "text-red-400"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          <span
                                            className="block truncate"
                                            title={hasValue ? String(val) : ""}
                                          >
                                            {hasValue ? (
                                              String(val)
                                            ) : col.required ? (
                                              <span className="italic">
                                                (缺失)
                                              </span>
                                            ) : (
                                              <span className="text-gray-300">
                                                —
                                              </span>
                                            )}
                                          </span>
                                        </td>
                                      );
                                    })}
                                    <td className="px-3 py-2 text-center">
                                      {valid ? (
                                        <span className="text-green-500 text-xs font-medium">
                                          ✓
                                        </span>
                                      ) : (
                                        <span className="text-red-500 text-xs font-medium">
                                          ✗
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {parsedData.length === 0 && (
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
            <div>
              {step === 1 && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  取消
                </button>
              )}
              {step > 1 && !importDone && (
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

            <div>
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

              {step === 3 && !importDone && (
                <button
                  onClick={handleImport}
                  disabled={validCount === 0 || isImporting}
                  className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      导入中...
                    </>
                  ) : (
                    <>
                      确认导入 {validCount} 条数据
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {step === 3 && importDone && (
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
