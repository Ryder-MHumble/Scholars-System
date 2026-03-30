import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  ArrowRight,
  ChevronLeft,
  Info,
  FileCheck2,
} from "lucide-react";
import { createActivity } from "@/services/activityApi";
import type { ActivityCreateRequest } from "@/services/activityApi";
import {
  getAllCategories,
  getCategoryByType,
} from "@/constants/activityCategories";

interface ActivityBatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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
              <div className={`h-px w-10 mx-2 transition-colors ${isDone ? "bg-primary-400" : "bg-gray-200"}`} />
            )}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isActive ? "bg-primary-600 text-white shadow-sm shadow-primary-200"
                  : isDone ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}>
                {isDone ? "✓" : num}
              </div>
              <span className={`text-xs font-medium transition-colors ${
                isActive ? "text-primary-700" : isDone ? "text-green-600" : "text-gray-400"
              }`}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ACTIVITY_FIELDS = [
  { label: "一级分类", required: true, hint: "教育培养 / 科研学术 / 人才引育" },
  { label: "活动类型", required: true, hint: "如 开学典礼 / 国际AI科学家大会 / 青年论坛" },
  { label: "活动系列", required: false, hint: "如 XAI智汇讲坛，可留空" },
  { label: "系列编号", required: false, hint: "如 42，可留空" },
  { label: "活动标题", required: true, hint: "完整活动名称" },
  { label: "摘要", required: false, hint: "活动内容简介，可留空" },
  { label: "活动日期", required: true, hint: "格式：2024-03-15T14:00" },
  { label: "时长", required: false, hint: "小时数，如 2，可留空" },
  { label: "活动地点", required: true, hint: "活动举办地点" },
  { label: "活动照片URL", required: false, hint: "活动照片 URL，可留空" },
  { label: "关联学者IDs", required: false, hint: "学者 url_hash，多个用 | 分隔" },
];

function parseCSV(text: string): string[][] {
  const lines = text.split("\n").filter((line) => line.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

interface ParsedRow {
  row: number;
  data: string[];
  error?: string;
}

export function ActivityBatchImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ActivityBatchImportModalProps) {
  const categoryNameToId = new Map(
    getAllCategories().map((cat) => [cat.name, cat.id]),
  );
  const categoryIdToName = new Map(
    getAllCategories().map((cat) => [cat.id, cat.name]),
  );

  const [step, setStep] = useState<ModalStep>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importSuccess, setImportSuccess] = useState(0);
  const [importFailed, setImportFailed] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const validRows = parsedRows.filter((r) => !r.error);
  const invalidRows = parsedRows.filter((r) => r.error);

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
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) await processFile(f);
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setParsedRows([]);
    setParseErrors([]);
    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      const dataRows = rows.slice(1); // skip header
      const errors: string[] = [];
      const parsed: ParsedRow[] = dataRows.map((data, i) => {
        const rowNum = i + 2;
        const [
          categoryName,
          eventType,
          ,
          ,
          title,
          ,
          eventDate,
          ,
          location,
          ,
          ,
        ] = data;
        if (!categoryName?.trim()) return { row: rowNum, data, error: "一级分类不能为空" };
        if (!eventType?.trim()) return { row: rowNum, data, error: "活动类型不能为空" };
        if (!title?.trim()) return { row: rowNum, data, error: "活动标题不能为空" };
        if (!eventDate?.trim()) return { row: rowNum, data, error: "活动日期不能为空" };
        if (!location?.trim()) return { row: rowNum, data, error: "活动地点不能为空" };
        const inputCategoryId = categoryNameToId.get(categoryName.trim());
        if (!inputCategoryId) {
          return { row: rowNum, data, error: `未知一级分类"${categoryName}"` };
        }
        const cat = getCategoryByType(eventType.trim());
        if (!cat) return { row: rowNum, data, error: `未知活动类型"${eventType}"` };
        if (cat.categoryId !== inputCategoryId) {
          const expectedCategoryName = categoryIdToName.get(cat.categoryId) ?? cat.categoryId;
          return {
            row: rowNum,
            data,
            error: `活动类型"${eventType}"应属于一级分类"${expectedCategoryName}"`,
          };
        }
        return { row: rowNum, data };
      });
      setParsedRows(parsed);
      setParseErrors(errors);
    } catch (err) {
      setParseErrors([err instanceof Error ? err.message : "文件解析失败"]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setIsImporting(true);
    let success = 0;
    const errors: string[] = [];
    for (const pr of validRows) {
      const [
        categoryName,
        eventType,
        series,
        seriesNumber,
        title,
        abstract,
        eventDate,
        duration,
        location,
        photoUrl,
        scholarIds,
      ] = pr.data;
      try {
        const cat = getCategoryByType(eventType.trim());
        if (!cat) {
          throw new Error(`未知活动类型"${eventType}"`);
        }
        const data: ActivityCreateRequest = {
          category:
            categoryName?.trim() ||
            categoryIdToName.get(cat.categoryId) ||
            cat.categoryId,
          event_type: eventType.trim(),
          series: series?.trim() || undefined,
          series_number: seriesNumber?.trim() || undefined,
          title: title.trim(),
          abstract: abstract?.trim() || undefined,
          event_date: eventDate.trim(),
          duration: duration ? parseFloat(duration) : 1,
          location: location.trim(),
          photo_url: photoUrl?.trim() || undefined,
          scholar_ids: scholarIds
            ? scholarIds
                .split("|")
                .map((id) => id.trim())
                .filter(Boolean)
            : undefined,
        };
        await createActivity(data);
        success++;
      } catch (err) {
        errors.push(`第 ${pr.row} 行：${err instanceof Error ? err.message : "未知错误"}`);
      }
    }
    setImportSuccess(success);
    setImportFailed(validRows.length - success);
    setImportErrors(errors);
    setImportDone(true);
    setIsImporting(false);
    if (success > 0) {
      onSuccess();
      setTimeout(() => handleClose(), 2500);
    }
  };

  const downloadTemplate = () => {
    const template = `一级分类,活动类型,活动系列,系列编号,活动标题,摘要,活动日期,时长,活动地点,活动照片URL,关联学者IDs
科研学术,XAI智汇讲坛,XAI智汇讲坛,42,人工智能前沿技术探讨,探讨最新的AI技术发展趋势,2024-03-15T14:00,2,清华大学主楼,https://example.com/activity.jpg,scholar_001|scholar_002`;
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "活动导入模板.csv";
    link.click();
  };

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setIsDragging(false);
    setIsProcessing(false);
    setParsedRows([]);
    setParseErrors([]);
    setIsImporting(false);
    setImportDone(false);
    setImportSuccess(0);
    setImportFailed(0);
    setImportErrors([]);
    onClose();
  };

  const canProceedToStep3 = parsedRows.length > 0 && !isProcessing;

  if (!isOpen) return null;

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
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">批量导入活动</h2>
                <p className="text-xs text-gray-500 mt-0.5">通过 CSV 文件批量导入学术活动</p>
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
                  {/* Left: steps + download */}
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Info className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-blue-900">操作步骤</span>
                      </div>
                      <ol className="space-y-3">
                        {[
                          { text: "下载右侧标准 CSV 模板文件", sub: "含所有字段与示例数据" },
                          { text: "按模板列序填写活动信息", sub: "每行一条活动记录" },
                          { text: "上传填写完成的 CSV 文件", sub: "系统自动校验必填项" },
                          { text: "预览无误后确认导入", sub: "操作完成" },
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-blue-200">
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-sm text-gray-800 font-medium leading-snug">{item.text}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
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
                          <p className="text-sm font-semibold text-gray-800 leading-tight">CSV 标准模板</p>
                          <p className="text-xs text-gray-400">含字段说明与示例数据</p>
                        </div>
                      </div>
                      <button
                        onClick={downloadTemplate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        下载模板
                      </button>
                    </div>
                  </div>

                  {/* Right: field hints + cautions */}
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-700">字段填写说明</p>
                        <span className="text-xs text-gray-400"><span className="text-red-400 font-bold">*</span> 为必填</span>
                      </div>
                      <div className="overflow-y-auto max-h-52">
                        <table className="w-full text-xs">
                          <tbody className="divide-y divide-gray-50">
                            {ACTIVITY_FIELDS.map((col) => (
                              <tr key={col.label} className={col.required ? "bg-red-50/30" : ""}>
                                <td className="pl-4 pr-2 py-2 w-24 shrink-0">
                                  <span className={`inline-flex items-center font-semibold whitespace-nowrap ${col.required ? "text-gray-800" : "text-gray-500"}`}>
                                    {col.label}
                                    {col.required && <span className="text-red-500 ml-0.5">*</span>}
                                  </span>
                                </td>
                                <td className="px-2 py-2">
                                  <span className={col.required ? "text-primary-600 bg-primary-50 border border-primary-100 rounded px-1.5 py-0.5 font-medium text-xs" : "text-gray-400 text-xs"}>
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
                        <span className="text-sm font-semibold text-amber-900">注意事项</span>
                      </div>
                      <ul className="space-y-2">
                        {[
                          "列顺序需与模板完全一致",
                          "一级分类与活动类型必须匹配",
                          "日期格式：2024-03-15T14:00",
                          "关联学者IDs 填学者 url_hash，多个用 | 分隔",
                          "导入后不可撤销，请核对后再提交",
                        ].map((text, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
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
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragging ? "bg-primary-100" : "bg-gray-100"}`}>
                        <Upload className={`w-8 h-8 transition-colors ${isDragging ? "text-primary-500" : "text-gray-400"}`} />
                      </div>
                      <p className="text-base font-medium text-gray-700 mb-1">拖拽 CSV 文件至此处</p>
                      <p className="text-sm text-gray-400 mb-5">或点击下方按钮选择文件</p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileInputChange}
                        className="hidden"
                        id="activity-csv-input"
                      />
                      <label
                        htmlFor="activity-csv-input"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        选择 CSV 文件
                      </label>
                      <p className="text-xs text-gray-400 mt-3">仅支持 .csv 格式</p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <FileCheck2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={() => { setFile(null); setParsedRows([]); setParseErrors([]); }}
                        className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
                      >
                        重新选择
                      </button>
                    </div>
                    <div className="p-4">
                      {isProcessing ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 text-primary-500 animate-spin flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">正在解析文件...</p>
                            <p className="text-xs text-gray-400 mt-0.5">校验必填字段</p>
                          </div>
                        </div>
                      ) : parsedRows.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">
                              解析完成，共识别到{" "}
                              <span className="font-bold text-gray-900">{parsedRows.length}</span> 条记录
                              {invalidRows.length > 0 && (
                                <span className="text-amber-600 ml-1">（{invalidRows.length} 条有错误）</span>
                              )}
                            </span>
                          </div>
                          {invalidRows.length > 0 && (
                            <div className="mt-2 bg-red-50 rounded-lg p-3 border border-red-100">
                              <p className="text-xs font-medium text-red-700 mb-2">以下行存在问题（将跳过）：</p>
                              <ul className="space-y-1">
                                {invalidRows.slice(0, 5).map((r, i) => (
                                  <li key={i} className="text-xs text-red-600">第 {r.row} 行：{r.error}</li>
                                ))}
                                {invalidRows.length > 5 && (
                                  <li className="text-xs text-red-400">...还有 {invalidRows.length - 5} 个错误</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : parseErrors.length > 0 ? (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                          <p className="text-xs font-medium text-red-700 mb-1">解析失败：</p>
                          {parseErrors.map((e, i) => (
                            <p key={i} className="text-xs text-red-600">{e}</p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──────────── STEP 3: 核对确认 ──────────── */}
            {step === 3 && (
              <div className="p-6 space-y-4">
                {importDone ? (
                  <div className={`rounded-xl p-4 border ${importFailed === 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${importFailed === 0 ? "bg-green-100" : "bg-amber-100"}`}>
                        <CheckCircle className={`w-5 h-5 ${importFailed === 0 ? "text-green-600" : "text-amber-600"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${importFailed === 0 ? "text-green-900" : "text-amber-900"}`}>
                          导入完成
                        </p>
                        <p className={`text-xs mt-0.5 ${importFailed === 0 ? "text-green-700" : "text-amber-700"}`}>
                          成功 <span className="font-bold">{importSuccess}</span> 条
                          {importFailed > 0 && <>，失败 <span className="font-bold">{importFailed}</span> 条</>}
                          {importSuccess > 0 && " · 窗口将自动关闭"}
                        </p>
                      </div>
                    </div>
                    {importErrors.length > 0 && (
                      <div className="mt-3 bg-red-50 rounded-lg p-3 border border-red-100">
                        <p className="text-xs font-medium text-red-700 mb-2">失败详情：</p>
                        <ul className="space-y-1 max-h-32 overflow-y-auto">
                          {importErrors.map((e, i) => (
                            <li key={i} className="text-xs text-red-600">{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : isImporting ? (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">正在导入数据...</p>
                      <p className="text-xs text-gray-400 mt-0.5">请勿关闭此窗口</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                        <p className="text-xl font-black text-gray-800">{parsedRows.length}</p>
                        <p className="text-xs text-gray-500 mt-0.5">总计行数</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                        <p className="text-xl font-black text-green-700">{validRows.length}</p>
                        <p className="text-xs text-green-600 mt-0.5">有效记录</p>
                      </div>
                      <div className={`rounded-xl p-3 text-center border ${invalidRows.length > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                        <p className={`text-xl font-black ${invalidRows.length > 0 ? "text-red-600" : "text-gray-400"}`}>{invalidRows.length}</p>
                        <p className={`text-xs mt-0.5 ${invalidRows.length > 0 ? "text-red-500" : "text-gray-400"}`}>将被跳过</p>
                      </div>
                    </div>
                    {invalidRows.length > 0 && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          <span className="font-medium">{invalidRows.length} 行</span>存在格式问题，将在导入时自动跳过。
                        </p>
                      </div>
                    )}
                    {validRows.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-800 mb-2">
                          数据预览
                          <span className="text-xs font-normal text-gray-400 ml-2">前 5 条有效记录</span>
                        </p>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  {["活动类型", "活动标题", "日期", "地点", "关联学者数"].map((h) => (
                                    <th key={h} className="px-3 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {validRows.slice(0, 5).map((pr, idx) => (
                                  <tr key={idx} className="hover:bg-blue-50/30">
                                    <td className="px-3 py-2 text-gray-700 max-w-[100px] truncate">{pr.data[1]}</td>
                                    <td className="px-3 py-2 text-gray-700 max-w-[160px] truncate">{pr.data[4]}</td>
                                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{pr.data[6]?.slice(0, 10)}</td>
                                    <td className="px-3 py-2 text-gray-700 max-w-[100px] truncate">{pr.data[8]}</td>
                                    <td className="px-3 py-2 text-gray-700 max-w-[100px] truncate">
                                      {pr.data[10]
                                        ? pr.data[10]
                                            .split("|")
                                            .map((id) => id.trim())
                                            .filter(Boolean).length
                                        : 0}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/80 flex-shrink-0">
            <div>
              {step === 1 && (
                <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
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
                  disabled={validRows.length === 0 || isImporting}
                  className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />导入中...</>
                  ) : (
                    <>确认导入 {validRows.length} 条数据<ArrowRight className="w-4 h-4" /></>
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
