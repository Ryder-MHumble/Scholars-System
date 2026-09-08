import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
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
  parseNewsRowsFromText,
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
  const [text, setText] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [parseErrors, setParseErrors] = useState<NewsImportError[]>([]);
  const [summary, setSummary] = useState<BatchImportResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");

  const failedRows = previewRows.filter((row) => row.result?.status === "failed");

  const reset = () => {
    setText("");
    setPreviewRows([]);
    setParseErrors([]);
    setSummary(null);
    setIsSubmitting(false);
    setRequestError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processText = (value: string) => {
    setText(value);
    setRequestError("");
    setSummary(null);
    const parsed = parseNewsRowsFromText(value, scholarRef);
    setPreviewRows(
      parsed.rows.map((data, index) => ({
        worksheetRow: parsed.rowNumbers[index],
        data,
      })),
    );
    setParseErrors(parsed.errors);
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
      title="批量识别学者活动"
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
            disabled={previewRows.length === 0 || isSubmitting}
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
            <p className="text-sm font-medium text-gray-800">粘贴学者活动文本</p>
            <p className="mt-1 text-xs text-gray-500">
              每行一条，支持“标题 | 日期 | 类型 | 摘要 | 来源URL”和“标题：...；日期：...”格式
            </p>
          </div>
        </div>

        <textarea
          aria-label="粘贴学者活动文本"
          value={text}
          rows={8}
          disabled={isSubmitting}
          onChange={(event) => processText(event.target.value)}
          placeholder={
            "论文接收 | 2026-09-08 | 论文动态 | 论文被 NeurIPS 接收 | https://example.com/news\n标题：获奖通知；日期：2026/09/09；类型：获奖；摘要：获得最佳论文奖；来源：https://example.com/award"
          }
          className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
        />

        {parseErrors.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4" />
              {parseErrors.length} 条识别错误
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

        <div className="text-xs font-medium text-blue-700">
          自动识别预览 {previewRows.length} 条
        </div>

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
