import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import type { ExcelColumn, ImportProgress } from "@/types/import";
import { parseExcelFile, downloadExcelTemplate } from "@/utils/excelParser";

interface ExcelImportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: T[]) => Promise<void>;
  columns: ExcelColumn[];
  title: string;
  templateFilename: string;
}

export function ExcelImportModal<T>({
  isOpen,
  onClose,
  onImport,
  columns,
  title,
  templateFilename,
}: ExcelImportModalProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<T[]>([]);
  const [errors, setErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
      if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
        await handleFileSelect(droppedFile);
      }
    },
    []
  );

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);
    setParsedData([]);

    try {
      const result = await parseExcelFile<T>(selectedFile, columns);
      setParsedData(result.data);
      setErrors(result.errors);
    } catch (err) {
      setErrors([{ row: 0, error: err instanceof Error ? err.message : "解析失败" }]);
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

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsProcessing(true);
    setProgress({
      total: parsedData.length,
      processed: 0,
      successful: 0,
      failed: 0,
      duplicates: 0,
    });

    try {
      await onImport(parsedData);
      setProgress((prev) => prev ? { ...prev, successful: parsedData.length, processed: parsedData.length } : null);

      // Close modal after successful import
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setErrors([{ row: 0, error: err instanceof Error ? err.message : "导入失败" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(columns, templateFilename);
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setProgress(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Download Template */}
            <div className="mb-6">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                下载Excel模板
              </button>
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
                拖拽Excel文件到此处，或点击选择文件
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
                id="excel-file-input"
              />
              <label
                htmlFor="excel-file-input"
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
            {isProcessing && !progress && (
              <div className="mt-6 text-center">
                <div className="inline-block w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <p className="mt-2 text-sm text-gray-600">正在处理...</p>
              </div>
            )}

            {/* Preview */}
            {parsedData.length > 0 && !progress && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="text-sm font-medium text-gray-900">
                    成功解析 {parsedData.length} 条数据
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-xs text-gray-500 mb-2">数据预览（前5条）:</p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(parsedData.slice(0, 5), null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm font-medium text-red-900">
                    发现 {errors.length} 个错误
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 mb-1">
                      {error.row > 0 ? `第 ${error.row} 行: ` : ""}
                      {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress */}
            {progress && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-600">导入进度</span>
                  <span className="font-medium text-gray-900">
                    {progress.processed} / {progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary-600 h-full transition-all duration-300"
                    style={{
                      width: `${(progress.processed / progress.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">成功</p>
                    <p className="text-lg font-semibold text-green-600">
                      {progress.successful}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">失败</p>
                    <p className="text-lg font-semibold text-red-600">
                      {progress.failed}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">重复</p>
                    <p className="text-lg font-semibold text-amber-600">
                      {progress.duplicates}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
              disabled={isProcessing}
            >
              取消
            </button>
            <button
              onClick={handleImport}
              disabled={parsedData.length === 0 || errors.length > 0 || isProcessing}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "导入中..." : `导入 ${parsedData.length} 条数据`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
