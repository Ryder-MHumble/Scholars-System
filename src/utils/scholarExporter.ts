import * as XLSX from "xlsx";
import type {
  AwardRecord,
  PatentRecord,
  PublicationRecord,
  ScholarListItem,
} from "@/services/scholarApi";
import { extractAchievementTags } from "@/utils/scholarAchievementTags";
import { readProfileFlag } from "@/utils/scholarIdentity";

function formatBoolean(value: boolean | null | undefined): string {
  if (value === true) return "是";
  if (value === false) return "否";
  return "";
}

function formatList(value: unknown): string {
  return Array.isArray(value)
    ? value.map((item) => String(item ?? "").trim()).filter(Boolean).join("; ")
    : "";
}

function compactParts(parts: Array<string | number | undefined>): string {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" | ");
}

function formatPublications(publications: PublicationRecord[] = []): string {
  return publications
    .map((publication) =>
      compactParts([
        publication.title,
        publication.venue,
        publication.year,
        publication.authors,
        publication.url,
      ]),
    )
    .filter(Boolean)
    .join("\n");
}

function formatPatents(patents: PatentRecord[] = []): string {
  return patents
    .map((patent) =>
      compactParts([
        patent.title,
        patent.patent_no,
        patent.year,
        patent.inventors,
        patent.patent_type,
        patent.status,
      ]),
    )
    .filter(Boolean)
    .join("\n");
}

function formatAwards(awards: AwardRecord[] = []): string {
  return awards
    .map((award) =>
      compactParts([
        award.title,
        award.year,
        award.level,
        award.grantor,
        award.description,
      ]),
    )
    .filter(Boolean)
    .join("\n");
}

function transformScholarForExport(scholar: ScholarListItem): Record<string, string> {
  const row: Record<string, string> = {
    学者ID: scholar.url_hash || "",
    姓名: scholar.name || "",
    英文名: scholar.name_en || "",
    院校: scholar.university || "",
    院系: scholar.department || "",
    职称: scholar.position || "",
    学术头衔: formatList(scholar.academic_titles),
    是否院士: formatBoolean(scholar.is_academician),
    研究方向: formatList(scholar.research_areas),
    邮箱: scholar.email || "",
    主页链接: scholar.profile_links?.homepage || scholar.profile_url || "",
    实验室主页: scholar.profile_links?.lab || "",
    GitHub: scholar.profile_links?.github || "",
    LinkedIn: scholar.profile_links?.linkedin || "",
    "Google Scholar": scholar.profile_links?.google_scholar || "",
    ORCID: scholar.profile_links?.orcid || "",
    DBLP: scholar.profile_links?.dblp || "",
    其他链接: formatList(scholar.profile_links?.other),
    是否为华人: formatBoolean(readProfileFlag(scholar.custom_fields, "is_chinese")),
    是否为学生: formatBoolean(readProfileFlag(scholar.custom_fields, "is_student")),
  };

  row.学术标签 = extractAchievementTags(scholar).join("; ");
  row.学术成果 = formatPublications(scholar.representative_publications);
  row.专利 = formatPatents(scholar.patents);
  row.奖项 = formatAwards(scholar.awards);

  return row;
}

function widthForHeader(header: string): number {
  if (["学术成果", "专利", "奖项"].includes(header)) return 50;
  if (["研究方向", "主页链接", "实验室主页", "Google Scholar", "其他链接"].includes(header)) {
    return 30;
  }
  if (["学者ID", "邮箱"].includes(header)) return 28;
  return 14;
}

/**
 * Export scholars to Excel file
 */
export function exportScholarsToExcel(
  scholars: ScholarListItem[],
  filename?: string,
): void {
  const exportData = scholars.map(transformScholarForExport);
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const headers = exportData.length > 0 ? Object.keys(exportData[0]) : [];

  worksheet["!cols"] = headers.map((header) => ({ wch: widthForHeader(header) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "学者列表");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

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
