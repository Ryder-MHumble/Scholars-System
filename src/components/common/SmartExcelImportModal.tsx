import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import {
  smartParseExcel,
  type SmartParseResult,
} from "@/utils/smartExcelParser";

interface SmartExcelImportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: T[]) => Promise<void>;
  title: string;
  expectedType?: "scholar" | "activity" | "institution" | "project";
}

export function SmartExcelImportModal<T>({
  isOpen,
  onClose,
  onImport,
  title,
  expectedType,
}: SmartExcelImportModalProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<SmartParseResult<T> | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setIsProcessing(true);
      setParseResult(null);
      setImportSuccess(false);

      try {
        const result = await smartParseExcel<T>(selectedFile, expectedType);
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
    },
    [expectedType],
  );

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
    [handleFileSelect],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.data.length === 0) return;

    setIsImporting(true);

    try {
      await onImport(parseResult.data);
      setImportSuccess(true);

      // Close modal after successful import
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setParseResult({
        ...parseResult,
        errors: [
          ...parseResult.errors,
          { row: 0, error: err instanceof Error ? err.message : "导入失败" },
        ],
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
    setImportSuccess(false);
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
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
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
                <Sparkles className="w-4 h-4" />
                智能识别说明
              </p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                <li>系统会自动识别 Excel 文件的列结构并映射到对应字段</li>
                <li>支持多种列名变体（中文、英文、简写等）</li>
                <li>识别置信度越高，数据映射越准确</li>
                <li>请确保 Excel 文件第一行为列标题</li>
              </ul>
            </div>

            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
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
                id="smart-excel-input"
              />
              <label
                htmlFor="smart-excel-input"
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
                <p className="mt-2 text-sm text-gray-600">
                  正在智能识别结构...
                </p>
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

                {/* Detected Columns */}
                {parseResult.detectedColumns.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      检测到的列映射
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {parseResult.detectedColumns.map((col, index) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {col.excelHeader}
                            </span>
                            <span className="text-xs text-gray-500">
                              → {col.mappedKey}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded px-2 py-1">
                              <p className="text-xs text-gray-600 truncate">
                                示例: {col.sampleValues[0] || "空"}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                col.confidence > 0.8
                                  ? "bg-green-100 text-green-700"
                                  : col.confidence > 0.6
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {Math.round(col.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {parseResult.data.length > 0 &&
                  parseResult.errors.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-medium text-green-900">
                        成功解析 {parseResult.data.length} 条数据
                      </p>
                    </div>
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
                {importSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="text-sm font-medium text-green-900">
                      导入成功！
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
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
                isImporting
              }
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting
                ? "导入中..."
                : parseResult
                  ? `导入 ${parseResult.data.length} 条数据`
                  : "导入"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
