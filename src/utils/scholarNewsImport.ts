import * as XLSX from "xlsx";
import type { ScholarNewsBatchRow } from "@/services/scholarApi/types";

export interface NewsImportError {
  row: number;
  error: string;
}

export interface ParsedNewsRows {
  rows: ScholarNewsBatchRow[];
  rowNumbers: number[];
  errors: NewsImportError[];
}

type NewsField =
  | "scholar_id"
  | "name"
  | "institution"
  | "title"
  | "news_type"
  | "summary"
  | "content"
  | "published_at"
  | "source_url";

export const NEWS_IMPORT_COLUMNS: ReadonlyArray<{
  field: NewsField;
  label: string;
  aliases: readonly string[];
}> = [
  { field: "scholar_id", label: "学者ID", aliases: ["scholar id", "scholar_id"] },
  { field: "name", label: "姓名", aliases: ["name", "scholar name"] },
  { field: "institution", label: "机构", aliases: ["institution", "organization"] },
  { field: "title", label: "标题", aliases: ["title"] },
  { field: "news_type", label: "类型", aliases: ["type", "news type", "news_type"] },
  { field: "summary", label: "摘要", aliases: ["summary"] },
  { field: "content", label: "正文", aliases: ["content"] },
  {
    field: "published_at",
    label: "发布日期",
    aliases: ["published at", "published_at", "published date"],
  },
  { field: "source_url", label: "来源URL", aliases: ["source url", "source_url"] },
];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase();
}

function cleanText(value: unknown): string {
  return String(value ?? "").normalize("NFKC").trim();
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function validDateParts(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function formatDateParts(year: number, month: number, day: number): string | null {
  return validDateParts(year, month, day)
    ? `${year}-${pad(month)}-${pad(day)}`
    : null;
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateParts(
      value.getUTCFullYear(),
      value.getUTCMonth() + 1,
      value.getUTCDate(),
    );
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    return parsed ? formatDateParts(parsed.y, parsed.m, parsed.d) : null;
  }
  const text = cleanText(value);
  const match = text.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})(?:日|(?:[T\s].*)?)$/);
  if (!match) return null;
  return formatDateParts(Number(match[1]), Number(match[2]), Number(match[3]));
}

function isHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function rowIsBlank(row: unknown[]): boolean {
  return row.every((value) => cleanText(value) === "");
}

function duplicateKey(row: ScholarNewsBatchRow): string {
  const identity = row.scholar_id || `${row.name ?? ""}|${row.institution ?? ""}`;
  const title = row.title?.toLocaleLowerCase().replace(/\s+/g, " ") ?? "";
  return [identity.toLocaleLowerCase(), title, row.published_at, row.source_url ?? ""].join("|");
}

export function parseNewsRows(workbook: XLSX.WorkBook): ParsedNewsRows {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], rowNumbers: [], errors: [{ row: 1, error: "Excel 文件没有工作表" }] };
  }
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: true,
    raw: true,
  });
  const headers = data[0] ?? [];
  const indexes = new Map<NewsField, number>();
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    const column = NEWS_IMPORT_COLUMNS.find(
      (candidate) =>
        normalizeHeader(candidate.label) === normalized ||
        candidate.aliases.some((alias) => normalizeHeader(alias) === normalized),
    );
    if (column && !indexes.has(column.field)) indexes.set(column.field, index);
  });

  const rows: ScholarNewsBatchRow[] = [];
  const rowNumbers: number[] = [];
  const errors: NewsImportError[] = [];
  const seen = new Set<string>();
  const value = (row: unknown[], field: NewsField): unknown => {
    const index = indexes.get(field);
    return index === undefined ? "" : row[index];
  };

  data.slice(1).forEach((rawRow, offset) => {
    const worksheetRow = offset + 2;
    if (rowIsBlank(rawRow)) return;

    const scholarId = cleanText(value(rawRow, "scholar_id"));
    const name = cleanText(value(rawRow, "name"));
    const institution = cleanText(value(rawRow, "institution"));
    const title = cleanText(value(rawRow, "title"));
    const publishedAt = normalizeDate(value(rawRow, "published_at"));
    const sourceUrl = cleanText(value(rawRow, "source_url"));
    const rowErrors: string[] = [];

    if (!title) rowErrors.push("标题不能为空");
    if (!publishedAt) rowErrors.push("发布日期格式无效");
    if (!isHttpUrl(sourceUrl)) rowErrors.push("来源 URL 必须使用 http 或 https");
    if (!scholarId && !(name && institution)) {
      rowErrors.push("必须提供学者 ID，或同时提供姓名和机构");
    }
    if (rowErrors.length > 0) {
      errors.push({ row: worksheetRow, error: rowErrors.join("；") });
      return;
    }

    const parsed: ScholarNewsBatchRow = {
      title,
      published_at: publishedAt!,
      match_status: scholarId ? "matched" : "pending_match",
      match_method: scholarId ? "scholar_id" : "name_institution",
    };
    if (scholarId) parsed.scholar_id = scholarId;
    if (name) parsed.name = name;
    if (institution) parsed.institution = institution;
    const optionalFields = ["news_type", "summary", "content"] as const;
    for (const field of optionalFields) {
      const text = cleanText(value(rawRow, field));
      if (text) parsed[field] = text;
    }
    if (sourceUrl) parsed.source_url = sourceUrl;

    const key = duplicateKey(parsed);
    if (seen.has(key)) {
      errors.push({ row: worksheetRow, error: "与文件中的上一条 News 重复" });
      return;
    }
    seen.add(key);
    rows.push(parsed);
    rowNumbers.push(worksheetRow);
  });

  return { rows, rowNumbers, errors };
}

export function prepareNewsImportRows(
  rows: ScholarNewsBatchRow[],
): ScholarNewsBatchRow[] {
  return rows.map((row) => ({
    ...row,
    published_at: /^\d{4}-\d{2}-\d{2}$/.test(row.published_at ?? "")
      ? `${row.published_at}T00:00:00Z`
      : row.published_at,
  }));
}

export function downloadNewsImportTemplate(): void {
  const worksheet = XLSX.utils.aoa_to_sheet([
    NEWS_IMPORT_COLUMNS.map((column) => column.label),
    [
      "scholar-id",
      "张三",
      "示例机构",
      "获批重点项目",
      "科研动态",
      "简要说明",
      "详细内容",
      "2026-09-07",
      "https://example.com/news",
    ],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "学者News");
  XLSX.writeFile(workbook, "学者News导入模板.xlsx");
}
