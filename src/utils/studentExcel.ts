import * as XLSX from "xlsx";
import type { StudentCreatePayload, StudentRecord } from "@/services/studentApi";

export interface StudentTemplateField {
  header: string;
  key: string;
  required: "是" | "否";
  example: string;
  description: string;
}

export const STUDENT_TEMPLATE_FIELDS: StudentTemplateField[] = [
  {
    header: "姓名",
    key: "name",
    required: "是",
    example: "张三",
    description: "学生姓名",
  },
  {
    header: "年级",
    key: "enrollment_year",
    required: "否",
    example: "2025",
    description: "支持 2025 或 2025级",
  },
  {
    header: "共建高校",
    key: "home_university",
    required: "否",
    example: "清华大学",
    description: "学生所属共建高校",
  },
  {
    header: "学号",
    key: "student_no",
    required: "否",
    example: "20250001",
    description: "学生学号",
  },
  {
    header: "指导导师",
    key: "mentor_name",
    required: "否",
    example: "王教授",
    description: "导师姓名",
  },
  {
    header: "邮箱",
    key: "email",
    required: "否",
    example: "student@example.com",
    description: "学生邮箱",
  },
  {
    header: "专业",
    key: "major",
    required: "否",
    example: "人工智能",
    description: "学生专业方向",
  },
  {
    header: "学位类型",
    key: "degree_type",
    required: "否",
    example: "硕士",
    description: "例如 硕士/博士",
  },
  {
    header: "预计毕业年份",
    key: "expected_graduation_year",
    required: "否",
    example: "2028",
    description: "支持四位年份",
  },
  {
    header: "状态",
    key: "status",
    required: "否",
    example: "在读",
    description: "推荐值：在读/实习/毕业",
  },
  {
    header: "电话",
    key: "phone",
    required: "否",
    example: "13800000000",
    description: "联系电话",
  },
  {
    header: "备注",
    key: "notes",
    required: "否",
    example: "可选备注",
    description: "自由填写",
  },
];

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["姓名", "name", "Name"],
  enrollment_year: ["年级", "enrollment_year", "入学年份", "enrollmentYear"],
  home_university: ["共建高校", "home_university", "高校", "学校"],
  student_no: ["学号", "student_no", "studentNo"],
  mentor_name: ["指导导师", "mentor_name", "导师", "mentor"],
  email: ["邮箱", "email", "Email"],
  major: ["专业", "major"],
  degree_type: ["学位类型", "degree_type", "degreeType"],
  expected_graduation_year: [
    "预计毕业年份",
    "expected_graduation_year",
    "毕业年份",
    "expectedGraduationYear",
  ],
  status: ["状态", "status"],
  phone: ["电话", "phone"],
  notes: ["备注", "notes"],
};

function getValue(
  row: Record<string, unknown>,
  aliases: string[],
): string {
  for (const key of aliases) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function parseYear(value: string): string | undefined {
  const match = value.match(/(\d{4})/);
  return match ? match[1] : undefined;
}

function downloadBlob(filename: string, blob: Blob) {
  const file = new File([blob], filename, { type: blob.type });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadStudentTemplate() {
  const headers = STUDENT_TEMPLATE_FIELDS.map((field) => field.header);
  const sampleRow = {
    姓名: "张三",
    年级: "2025",
    共建高校: "清华大学",
    学号: "20250001",
    指导导师: "王教授",
    邮箱: "zhangsan@example.com",
    专业: "人工智能",
    学位类型: "硕士",
    预计毕业年份: "2028",
    状态: "在读",
    电话: "13800000000",
    备注: "示例数据",
  };

  const dataSheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
  dataSheet["!cols"] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 24 },
  ];

  const explainRows = STUDENT_TEMPLATE_FIELDS.map((field) => ({
    Excel列名: field.header,
    API字段: field.key,
    是否必填: field.required,
    示例: field.example,
    说明: field.description,
  }));
  const explainSheet = XLSX.utils.json_to_sheet(explainRows);
  explainSheet["!cols"] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 10 },
    { wch: 20 },
    { wch: 36 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, dataSheet, "学生导入模板");
  XLSX.utils.book_append_sheet(wb, explainSheet, "字段说明");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    "学生批量导入模板.xlsx",
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
}

export interface ParsedStudentRow {
  rowNumber: number;
  payload: StudentCreatePayload;
}

export interface ParseStudentExcelResult {
  rows: ParsedStudentRow[];
  errors: string[];
}

export async function parseStudentExcel(
  file: File,
): Promise<ParseStudentExcelResult> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return { rows: [], errors: ["Excel 文件无可用工作表"] };

  const ws = wb.Sheets[firstSheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
  });

  const rows: ParsedStudentRow[] = [];
  const errors: string[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const name = getValue(record, HEADER_ALIASES.name);
    if (!name) {
      errors.push(`第 ${rowNumber} 行缺少必填字段「姓名」`);
      return;
    }

    const enrollmentRaw = getValue(record, HEADER_ALIASES.enrollment_year);
    const enrollmentYear = parseYear(enrollmentRaw);

    rows.push({
      rowNumber,
      payload: {
        name,
        enrollment_year: enrollmentYear,
        home_university: getValue(record, HEADER_ALIASES.home_university) || undefined,
        student_no: getValue(record, HEADER_ALIASES.student_no) || undefined,
        mentor_name: getValue(record, HEADER_ALIASES.mentor_name) || undefined,
        email: getValue(record, HEADER_ALIASES.email) || undefined,
        major: getValue(record, HEADER_ALIASES.major) || undefined,
        degree_type: getValue(record, HEADER_ALIASES.degree_type) || undefined,
        expected_graduation_year:
          parseYear(getValue(record, HEADER_ALIASES.expected_graduation_year)) ||
          undefined,
        status: getValue(record, HEADER_ALIASES.status) || undefined,
        phone: getValue(record, HEADER_ALIASES.phone) || undefined,
        notes: getValue(record, HEADER_ALIASES.notes) || undefined,
      },
    });
  });

  return { rows, errors };
}

export function exportStudentsToExcel(
  students: StudentRecord[],
  filename?: string,
) {
  const rows = students.map((item) => ({
    姓名: item.name || "",
    年级: item.enrollment_year || "",
    共建高校: item.home_university || "",
    学号: item.student_no || "",
    指导导师: item.mentor_name || "",
    邮箱: item.email || "",
    专业: item.major || "",
    学位类型: item.degree_type || "",
    状态: item.status || "",
    电话: item.phone || "",
    预计毕业年份: item.expected_graduation_year || "",
    备注: item.notes || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "学生列表");
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const defaultName = `学生列表_${timestamp}.xlsx`;
  downloadBlob(
    filename || defaultName,
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
}

