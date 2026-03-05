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

export function ScholarImportModal({
  isOpen,
  onClose,
  urlHash,
  scholarName,
  onSuccess,
}: ScholarImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<SmartParseResult<
    Record<string, unknown>
  > | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ScholarImportResult | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<ImportType>("all");

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
    downloadScholarTemplate(undefined, selectedType);
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.data.length === 0) return;

    setIsImporting(true);

    try {
      // Parse data based on selected sheets
      const importedData: Parameters<typeof importScholarData>[1] = {};

      // Simple implementation - treat all data as the selected type
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
        importedData.publications = parseResult.data as Record<
          string,
          string
        >[];
        importedData.patents = parseResult.data as Record<string, string>[];
        importedData.awards = parseResult.data as Record<string, string>[];
      }

      const result = await importScholarData(urlHash, importedData);
      setImportResult(result);

      if (result.success) {
        setTimeout(() => {
          handleClose();
          onSuccess?.();
        }, 1500);
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
    setFile(null);
    setParseResult(null);
    setIsProcessing(false);
    setIsImporting(false);
    setImportResult(null);
    setSelectedType("all");
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  导入学者数据
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">{scholarName}</p>
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
                <Sparkles className="w-4 h-4" />
                导入指南
              </p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                <li>选择要导入的数据类型（基本信息、教育背景、成就等）</li>
                <li>下载对应的 Excel 模板或使用已有的文件</li>
                <li>系统会自动识别并验证数据结构</li>
                <li>导入成功后，学者信息会自动更新</li>
              </ul>
            </div>

            {/* Import Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                选择导入类型
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      value: "basic",
                      label: "基本信息",
                      desc: "姓名、邮箱、部门等",
                    },
                    {
                      value: "education",
                      label: "教育背景",
                      desc: "学位、院校、专业等",
                    },
                    {
                      value: "achievements",
                      label: "成就数据",
                      desc: "论文、专利、奖项等",
                    },
                    { value: "all", label: "全部数据", desc: "导入所有类型" },
                  ] as const
                ).map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      selectedType === type.value
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300 bg-white"
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${
                        selectedType === type.value
                          ? "text-primary-900"
                          : "text-gray-900"
                      }`}
                    >
                      {type.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {type.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Download Template Button */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-sm text-amber-800 font-medium hover:text-amber-900 transition-colors"
              >
                <Download className="w-4 h-4" />
                下载 {selectedType === "all" ? "完整" : ""}模板
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
                id="scholar-import-input"
              />
              <label
                htmlFor="scholar-import-input"
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
                {importResult?.success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="text-sm text-green-900">
                      <p className="font-medium">导入成功！</p>
                      <ul className="text-xs mt-1 space-y-0.5">
                        {importResult.basicInfoUpdated && (
                          <li>✓ 基本信息已更新</li>
                        )}
                        {importResult.educationUpdated && (
                          <li>✓ 教育背景已更新</li>
                        )}
                        {importResult.achievementsUpdated && (
                          <li>✓ 成就数据已更新</li>
                        )}
                      </ul>
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
                isImporting ||
                importResult?.success
              }
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
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
