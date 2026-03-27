import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { BaseModal } from "@/components/common/BaseModal";
import { createStudent } from "@/services/studentApi";
import {
  STUDENT_TEMPLATE_FIELDS,
  downloadStudentTemplate,
  parseStudentExcel,
  type ParsedStudentRow,
} from "@/utils/studentExcel";

interface BatchStudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultEnrollmentYear?: string;
}

export function BatchStudentImportModal({
  isOpen,
  onClose,
  onSuccess,
  defaultEnrollmentYear,
}: BatchStudentImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedStudentRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const previewRows = useMemo(() => rows.slice(0, 8), [rows]);

  const resetState = () => {
    setFile(null);
    setRows([]);
    setParseErrors([]);
    setResult(null);
    setIsParsing(false);
    setIsImporting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSelectFile = async (selected: File) => {
    setFile(selected);
    setIsParsing(true);
    setRows([]);
    setParseErrors([]);
    setResult(null);
    try {
      const parsed = await parseStudentExcel(selected);
      setRows(parsed.rows);
      setParseErrors(parsed.errors);
    } catch (err) {
      setParseErrors([err instanceof Error ? err.message : "文件解析失败"]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setIsImporting(true);
    const errors: string[] = [];
    let success = 0;

    for (const row of rows) {
      try {
        await createStudent({
          ...row.payload,
          enrollment_year: row.payload.enrollment_year || defaultEnrollmentYear,
          status: row.payload.status || "在读",
          added_by: "excel_import",
        });
        success += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "导入失败";
        errors.push(`第 ${row.rowNumber} 行：${msg}`);
      }
    }

    const failed = rows.length - success;
    setResult({ success, failed, errors });
    setIsImporting(false);
    if (success > 0) onSuccess?.();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="批量添加学生"
      maxWidth="3xl"
      footer={
        <>
          <button
            onClick={handleClose}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
          >
            关闭
          </button>
          <button
            onClick={handleImport}
            disabled={rows.length === 0 || isImporting || isParsing}
            className="h-9 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium inline-flex items-center gap-1.5"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isImporting ? "导入中..." : `开始导入（${rows.length} 条）`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold text-gray-800">导入说明</p>
          <p className="text-xs text-gray-600 mt-1 leading-5">
            模板字段基于学生 API Schema（`name` 必填，其余按需填写）。
            {defaultEnrollmentYear
              ? ` 空年级会自动使用当前筛选年级 ${defaultEnrollmentYear}。`
              : " 若年级为空，将按后端默认规则处理。"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={downloadStudentTemplate}
              className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              下载 Excel 模板
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-2.5 rounded-lg bg-primary-600 text-white text-xs hover:bg-primary-700 inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              选择文件
            </button>
            {file && (
              <button
                onClick={() => {
                  setFile(null);
                  setRows([]);
                  setParseErrors([]);
                  setResult(null);
                }}
                className="h-8 px-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleSelectFile(selected);
              e.target.value = "";
            }}
          />
          {file && (
            <p className="mt-2 text-xs text-gray-500">
              当前文件：{file.name}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-700 inline-flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            模板字段解释（API Schema）
          </div>
          <div className="max-h-48 overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-3 py-2">Excel列名</th>
                  <th className="text-left px-3 py-2">API字段</th>
                  <th className="text-left px-3 py-2">必填</th>
                  <th className="text-left px-3 py-2">说明</th>
                </tr>
              </thead>
              <tbody>
                {STUDENT_TEMPLATE_FIELDS.map((field) => (
                  <tr key={field.key} className="border-t border-gray-100">
                    <td className="px-3 py-2">{field.header}</td>
                    <td className="px-3 py-2 text-gray-500">{field.key}</td>
                    <td className="px-3 py-2">{field.required}</td>
                    <td className="px-3 py-2 text-gray-600">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-700">解析结果</p>
            {isParsing ? (
              <p className="text-xs text-gray-500 mt-2 inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                解析中...
              </p>
            ) : (
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p>可导入记录：{rows.length}</p>
                <p>解析问题：{parseErrors.length}</p>
              </div>
            )}

            {parseErrors.length > 0 && (
              <div className="mt-3 max-h-28 overflow-auto rounded border border-red-100 bg-red-50 p-2">
                {parseErrors.slice(0, 20).map((err) => (
                  <p key={err} className="text-[11px] text-red-600 leading-5">
                    {err}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-700">预览（前 8 条）</p>
            <div className="mt-2 max-h-40 overflow-auto space-y-1.5">
              {previewRows.length === 0 ? (
                <p className="text-xs text-gray-400">暂无预览数据</p>
              ) : (
                previewRows.map((row) => (
                  <div key={row.rowNumber} className="rounded border border-gray-100 px-2 py-1.5">
                    <p className="text-xs text-gray-700">
                      第 {row.rowNumber} 行 · {row.payload.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {row.payload.enrollment_year || defaultEnrollmentYear || "-"} ·{" "}
                      {row.payload.home_university || "-"} · {row.payload.mentor_name || "-"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {result && (
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              result.failed === 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            )}
          >
            <p className="inline-flex items-center gap-1.5 font-medium">
              {result.failed === 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              导入完成：成功 {result.success} 条，失败 {result.failed} 条
            </p>
            {result.errors.length > 0 && (
              <div className="mt-2 max-h-24 overflow-auto space-y-1">
                {result.errors.map((err) => (
                  <p key={err} className="text-xs">
                    {err}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

