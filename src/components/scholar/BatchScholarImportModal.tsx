import { useState } from "react";
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
} from "lucide-react";
import {
  smartParseExcel,
  type SmartParseResult,
} from "@/utils/smartExcelParser";
import { downloadScholarTemplate } from "@/utils/scholarTemplateGenerator";
import {
  batchCreateScholars,
  type BatchScholarCreate,
} from "@/services/scholarApi";

interface BatchScholarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BatchScholarImportModal({
  isOpen,
  onClose,
  onSuccess,
}: BatchScholarImportModalProps) {
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
    if (droppedFile) {
      await handleFileSelect(droppedFile);
    }
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
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDownloadTemplate = () => {
    downloadScholarTemplate(undefined, "basic");
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.data.length === 0) return;

    setIsImporting(true);
    console.log("开始导入，解析到的数据行数:", parseResult.data.length);
    console.log("原始数据:", parseResult.data);

    try {
      // Parse scholars from data
      const scholars: BatchScholarCreate[] = parseResult.data.map((row) => {
        const r = row as Record<string, string>;
        return {
          name: (r.name || r.姓名 || "").trim(),
          name_en:
            (r.nameEn || r.name_en || r.英文名 || "").trim() || undefined,
          position: (r.title || r.position || r.职称 || "").trim() || undefined,
          university:
            (r.university || r.institution || r.院校 || "").trim() || undefined,
          department: (r.department || r.院系 || "").trim() || undefined,
          email: (r.email || r.邮箱 || "").trim() || undefined,
          phone: (r.phone || r.电话 || "").trim() || undefined,
          profile_url:
            (r.homepage || r.profile_url || r.主页 || "").trim() || undefined,
          research_areas: (
            r.researchFields ||
            r.research_areas ||
            r.研究方向 ||
            ""
          )
            .toString()
            .split(/[,，、;；]/)
            .map((s: string) => s.trim())
            .filter(Boolean),
          bio: (r.bio || r.简介 || "").trim() || undefined,
        };
      });

      // Filter out invalid scholars (must have name)
      const validScholars = scholars.filter((s) => s.name);
      console.log("解析后的学者数据:", scholars);
      console.log("有效的学者数据:", validScholars);

      if (validScholars.length === 0) {
        setImportResult({
          success: false,
          successCount: 0,
          failedCount: scholars.length,
          errors: ["所有学者数据都缺少必填字段（姓名）"],
        });
        setIsImporting(false);
        return;
      }

      // Call API to batch create scholars
      console.log("准备调用API，学者数量:", validScholars.length);
      const result = await batchCreateScholars(validScholars);
      console.log("API返回结果:", result);

      setImportResult({
        success: result.success > 0,
        successCount: result.success,
        failedCount: result.failed,
        errors: result.errors.map((e) => `第 ${e.row} 行: ${e.error}`),
      });

      if (result.success > 0) {
        setTimeout(() => {
          handleClose();
          onSuccess?.();
        }, 2000);
      }
    } catch (err) {
      setImportResult({
        success: false,
        successCount: 0,
        failedCount: parseResult.data.length,
        errors: [err instanceof Error ? err.message : "导入失败"],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setIsProcessing(false);
    setIsImporting(false);
    setImportResult(null);
    onClose();
  };

  if (!isOpen) return null;

  const confidenceColor =
    parseResult && parseResult.confidence > 0.8
      ? "text-green-600"
      : parseResult && parseResult.confidence > 0.6
        ? "text-amber-600"
        : "text-red-600";

  const confidenceLabel =
    parseResult && parseResult.confidence > 0.8
      ? "高"
      : parseResult && parseResult.confidence > 0.6
        ? "中"
        : "低";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  批量添加学者
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  通过 Excel 文件快速导入多位学者信息
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Info Banner */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2 font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                使用说明
              </p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                <li>下载标准 Excel 模板并填写学者信息</li>
                <li>每行代表一位学者，必填字段：姓名、职称、院校、院系</li>
                <li>系统会自动识别并验证数据结构</li>
                <li>导入成功后，学者列表会自动刷新</li>
              </ul>
            </div>

            {/* Download Template Button */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-sm text-amber-800 font-medium hover:text-amber-900 transition-colors"
              >
                <Download className="w-4 h-4" />
                下载 Excel 模板
              </button>
              <p className="text-xs text-amber-700 mt-2">
                下载标准模板以确保数据格式正确
              </p>
            </div>

            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-6 ${
                isDragging
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                拖拽 Excel 文件到此处，或点击选择文件
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
                id="batch-scholar-import-input"
              />
              <label
                htmlFor="batch-scholar-import-input"
                className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
              >
                选择文件
              </label>
              {file && (
                <p className="mt-3 text-sm text-gray-500">
                  已选择: {file.name}
                </p>
              )}
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="mt-6 text-center">
                <div className="inline-block w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <p className="mt-2 text-sm text-gray-600">正在识别结构...</p>
              </div>
            )}

            {/* Parse Result */}
            {parseResult && !isProcessing && (
              <div className="mt-6 space-y-4">
                {/* Confidence Score */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      识别置信度
                    </span>
                    <span className={`text-sm font-bold ${confidenceColor}`}>
                      {confidenceLabel} (
                      {Math.round(parseResult.confidence * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        parseResult.confidence > 0.8
                          ? "bg-green-500"
                          : parseResult.confidence > 0.6
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${parseResult.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Success */}
                {parseResult.data.length > 0 &&
                  parseResult.errors.length === 0 && (
                    <>
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <p className="text-sm font-medium text-green-900">
                          成功解析 {parseResult.data.length} 位学者数据
                        </p>
                      </div>

                      {/* Data Preview */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          数据预览
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {parseResult.data.slice(0, 5).map((row, idx) => {
                            const r = row as Record<string, string>;
                            const name = r.name || r.姓名 || "未知";
                            const university = r.university || r.院校 || "-";
                            const department = r.department || r.院系 || "-";
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-gray-200"
                              >
                                <span className="font-medium text-gray-900 min-w-[80px]">
                                  {name}
                                </span>
                                <span className="text-gray-500">·</span>
                                <span className="text-gray-600">
                                  {university}
                                </span>
                                <span className="text-gray-500">·</span>
                                <span className="text-gray-600">
                                  {department}
                                </span>
                              </div>
                            );
                          })}
                          {parseResult.data.length > 5 && (
                            <p className="text-xs text-gray-500 text-center pt-1">
                              还有 {parseResult.data.length - 5} 条数据...
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                {/* Errors */}
                {parseResult.errors.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-sm font-medium text-red-900">
                        发现 {parseResult.errors.length} 个问题
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {parseResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          {error.row > 0 ? `第 ${error.row} 行: ` : ""}
                          {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Import Success */}
                {importResult?.success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="text-sm text-green-900">
                      <p className="font-medium">导入成功！</p>
                      <p className="text-xs mt-1">
                        成功导入 {importResult.successCount} 位学者
                        {importResult.failedCount > 0 &&
                          `，${importResult.failedCount} 位失败`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Import Errors */}
                {importResult && !importResult.success && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-900">
                      <p className="font-medium">导入失败</p>
                      <ul className="text-xs mt-1 space-y-0.5">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              disabled={isImporting}
            >
              取消
            </button>
            <button
              onClick={handleImport}
              disabled={
                !parseResult ||
                parseResult.data.length === 0 ||
                parseResult.errors.length > 0 ||
                isImporting ||
                importResult?.success
              }
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isImporting
                ? "导入中..."
                : parseResult
                  ? `导入 ${parseResult.data.length} 位学者`
                  : "导入"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
