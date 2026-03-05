import * as XLSX from "xlsx";
import type { ExcelColumn, ImportError } from "@/types/import";

export interface ParsedExcelData<T> {
  data: T[];
  errors: ImportError[];
}

export function parseExcelFile<T>(
  file: File,
  columns: ExcelColumn[],
): Promise<ParsedExcelData<T>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("Failed to read file"));
          return;
        }

        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          firstSheet,
          { defval: "" }
        );

        const parsedData: T[] = [];
        const errors: ImportError[] = [];

        rows.forEach((row, index) => {
          const rowNumber = index + 2; // +2 because Excel is 1-indexed and has header row
          const item: Record<string, unknown> = {};
          let hasError = false;

          // Validate and map columns
          for (const column of columns) {
            const value = row[column.label];

            // Check required fields
            if (column.required && (!value || value === "")) {
              errors.push({
                row: rowNumber,
                data: row,
                error: `缺少必填字段: ${column.label}`,
              });
              hasError = true;
              break;
            }

            // Validate field
            if (column.validator && value && !column.validator(value)) {
              errors.push({
                row: rowNumber,
                data: row,
                error: `字段格式错误: ${column.label}`,
              });
              hasError = true;
              break;
            }

            item[column.key] = value;
          }

          if (!hasError) {
            parsedData.push(item as T);
          }
        });

        resolve({ data: parsedData, errors });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("解析Excel文件失败"));
      }
    };

    reader.onerror = () => {
      reject(new Error("读取文件失败"));
    };

    reader.readAsBinaryString(file);
  });
}

export function downloadExcelTemplate(columns: ExcelColumn[], filename: string) {
  const headers = columns.map((col) => col.label);
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, filename);
}
