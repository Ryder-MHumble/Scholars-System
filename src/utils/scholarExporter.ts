import * as XLSX from "xlsx";
import type { ScholarListItem } from "@/services/scholarApi";

/**
 * Field mapping from API schema to Chinese column names
 */
const FIELD_MAPPING: Record<keyof ScholarListItem | string, string> = {
  name: "姓名",
  name_en: "英文名",
  university: "院校",
  department: "院系",
  position: "职称",
  research_areas: "研究方向",
  email: "邮箱",
  profile_url: "主页链接",
  is_potential_recruit: "是否潜在招募对象",
  is_advisor_committee: "是否导师委员会成员",
};

/**
 * Transform scholar data to Excel-friendly format with Chinese headers
 */
function transformScholarForExport(
  scholar: ScholarListItem,
): Record<string, string> {
  return {
    [FIELD_MAPPING.name]: scholar.name || "",
    [FIELD_MAPPING.name_en]: scholar.name_en || "",
    [FIELD_MAPPING.university]: scholar.university || "",
    [FIELD_MAPPING.department]: scholar.department || "",
    [FIELD_MAPPING.position]: scholar.position || "",
    [FIELD_MAPPING.research_areas]: Array.isArray(scholar.research_areas)
      ? scholar.research_areas.join("; ")
      : "",
    [FIELD_MAPPING.email]: scholar.email || "",
    [FIELD_MAPPING.profile_url]: scholar.profile_url || "",
    [FIELD_MAPPING.is_potential_recruit]: scholar.is_potential_recruit
      ? "是"
      : "否",
    [FIELD_MAPPING.is_advisor_committee]: scholar.is_advisor_committee
      ? "是"
      : "否",
  };
}

/**
 * Export scholars to Excel file
 */
export function exportScholarsToExcel(
  scholars: ScholarListItem[],
  filename?: string,
): void {
  // Transform data
  const exportData = scholars.map(transformScholarForExport);

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 12 }, // 姓名
    { wch: 15 }, // 英文名
    { wch: 20 }, // 院校
    { wch: 15 }, // 院系
    { wch: 12 }, // 职称
    { wch: 30 }, // 研究方向
    { wch: 20 }, // 邮箱
    { wch: 30 }, // 主页链接
    { wch: 15 }, // 是否潜在招募对象
    { wch: 18 }, // 是否导师委员会成员
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "学者列表");

  // Generate file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Download file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const defaultFilename = `学者列表_${timestamp}.xlsx`;
  const file = new File([blob], filename || defaultFilename, {
    type: blob.type,
  });

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
