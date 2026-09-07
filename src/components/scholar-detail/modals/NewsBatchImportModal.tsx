import { useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";
import { BaseModal } from "@/components/common/BaseModal";
import { batchScholarNews } from "@/services/scholarResourcesApi";
import type {
  BatchImportResponse,
  BatchRowResult,
  ScholarNewsBatchRow,
} from "@/services/scholarApi/types";
import {
  downloadNewsImportTemplate,
  parseNewsRows,
  prepareNewsImportRows,
  type NewsImportError,
} from "@/utils/scholarNewsImport";

interface NewsBatchImportModalProps {
  isOpen: boolean;
  scholarRef: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PreviewRow {
  worksheetRow: number;
  data: ScholarNewsBatchRow;
  result?: BatchRowResult;
}

const STATUS_LABELS: Record<BatchRowResult["status"], string> = {
  created: "已新增",
  updated: "已更新",
  skipped: "已跳过",
  pending_match: "待匹配",
  failed: "失败",
};

export function NewsBatchImportModal({
  isOpen,
  scholarRef,
  onClose,
  onSuccess,
}: NewsBatchImportModalProps) {
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [parseErrors, setParseErrors] = useState<NewsImportError[]>([]);
  const [summary, setSummary] = useState<BatchImportResponse | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");

  const failedRows = previewRows.filter((row) => row.result?.status === "failed");

  const reset = () => {
    setFileName("");
    setPreviewRows([]);
    setParseErrors([]);
    setSummary(null);
    setIsParsing(false);
    setIsSubmitting(false);
    setRequestError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setIsParsing(true);
    setRequestError("");
    setSummary(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
      const parsed = parseNewsRows(workbook);
      setPreviewRows(
        parsed.rows.map((data, index) => ({
          worksheetRow: parsed.rowNumbers[index],
          data,
        })),
      );
      setParseErrors(parsed.errors);
    } catch (error) {
      setPreviewRows([]);
      setParseErrors([
        {
          row: 0,
          error: error instanceof Error ? error.message : "Excel 文件解析失败",
        },
      ]);
    } finally {
      setIsParsing(false);
    }
  };

  const submit = async (rowsToSubmit: PreviewRow[]) => {
    if (rowsToSubmit.length === 0) return;
    setIsSubmitting(true);
    setRequestError("");
    try {
      const response = await batchScholarNews(
        scholarRef,
        prepareNewsImportRows(rowsToSubmit.map((row) => row.data)),
      );
      const resultByWorksheetRow = new Map(
        response.rows.map((result) => [
          rowsToSubmit[result.row - 1]?.worksheetRow,
          result,
        ]),
      );
      setPreviewRows((current) =>
        current.map((row) => {
          const result = resultByWorksheetRow.get(row.worksheetRow);
          return result ? { ...row, result } : row;
        }),
      );
      setSummary(response);
      if (response.created + response.updated > 0) onSuccess();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "批量导入失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="批量导入学者 News"
      maxWidth="3xl"
      maxHeight="88vh"
      closeOnBackdropClick={!isSubmitting}
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            关闭
          </button>
          {failedRows.length > 0 && (
            <button
              type="button"
              onClick={() => void submit(failedRows)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md border border-amber-200 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              重试失败行
            </button>
          )}
          <button
            type="button"
            onClick={() => void submit(previewRows)}
            disabled={previewRows.length === 0 || isSubmitting || isParsing}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            提交 {previewRows.length > 0 ? `${previewRows.length} 条` : ""}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <p className="text-sm font-medium text-gray-800">选择 Excel 文件</p>
            <p className="mt-1 text-xs text-gray-500">支持 .xlsx 和 .xls，上传后先预览再提交</p>
          </div>
          <button
            type="button"
            onClick={downloadNewsImportTemplate}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            下载模板
          </button>
        </div>

        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center hover:border-primary-400 hover:bg-primary-50/30">
          {isParsing ? (
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary-600" />
          ) : (
            <FileSpreadsheet className="mb-2 h-6 w-6 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {fileName || "点击选择文件"}
          </span>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            disabled={isParsing || isSubmitting}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void processFile(file);
              event.target.value = "";
            }}
          />
        </label>

        {parseErrors.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4" />
              {parseErrors.length} 条解析错误
            </div>
            <ul className="max-h-28 space-y-1 overflow-y-auto text-xs text-red-700">
              {parseErrors.map((error) => (
                <li key={`${error.row}-${error.error}`}>
                  {error.row > 0 ? `第 ${error.row} 行：` : ""}{error.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {requestError && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{requestError}</span>
          </div>
        )}

        {summary && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-y border-gray-100 py-3 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              共 {summary.total} 条
            </span>
            <span className="text-green-700">新增 {summary.created}</span>
            <span className="text-blue-700">更新 {summary.updated}</span>
            <span className="text-gray-500">跳过 {summary.skipped}</span>
            <span className="text-amber-700">待匹配 {summary.pending_match}</span>
            <span className="text-red-700">失败 {summary.failed}</span>
          </div>
        )}

        {previewRows.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">行</th>
                  <th className="px-3 py-2 font-medium">学者</th>
                  <th className="px-3 py-2 font-medium">标题</th>
                  <th className="px-3 py-2 font-medium">发布日期</th>
                  <th className="px-3 py-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                {previewRows.map((row) => (
                  <tr key={row.worksheetRow}>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-400">{row.worksheetRow}</td>
                    <td className="max-w-40 px-3 py-2">
                      <span className="block truncate">{row.data.name || row.data.scholar_id}</span>
                      {row.data.institution && (
                        <span className="block truncate text-gray-400">{row.data.institution}</span>
                      )}
                    </td>
                    <td className="max-w-64 px-3 py-2"><span className="block truncate">{row.data.title}</span></td>
                    <td className="whitespace-nowrap px-3 py-2">{row.data.published_at}</td>
                    <td className="max-w-48 px-3 py-2">
                      <span className={row.result?.status === "failed" ? "text-red-700" : "text-gray-500"}>
                        {row.result ? STATUS_LABELS[row.result.status] : row.data.match_status === "pending_match" ? "待匹配" : "待提交"}
                      </span>
                      {row.result?.error && (
                        <span className="mt-0.5 block text-red-600">{row.result.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
