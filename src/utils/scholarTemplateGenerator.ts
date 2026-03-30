import * as XLSX from "xlsx";
import type { ScholarDetail } from "@/services/scholarApi";

/**
 * Generate Excel template for scholar data import/update
 * Can be used to create blank templates or populate with existing scholar data
 */
export function generateScholarTemplate(
  scholar?: ScholarDetail,
  templateType: "basic" | "education" | "achievements" | "all" = "all",
): File {
  const workbook = XLSX.utils.book_new();

  if (templateType === "basic" || templateType === "all") {
    const basicData = [
      {
        姓名: scholar?.name || "",
        英文名: scholar?.name_en || "",
        职称: scholar?.position || "",
        所属机构: scholar?.university || "",
        "院系/部门": scholar?.department || "",
        邮箱: scholar?.email || "",
        电话: scholar?.phone || "",
        办公室: scholar?.office || "",
        主页: scholar?.profile_url || "",
        谷歌学术: scholar?.google_scholar_url || "",
        DBLP: scholar?.dblp_url || "",
        研究方向: (scholar?.research_areas || []).join(";"),
        简介: scholar?.bio || "",
      },
    ];

    const basicSheet = XLSX.utils.json_to_sheet(basicData);
    basicSheet["!cols"] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
      { wch: 22 },
      { wch: 30 },
      { wch: 36 },
    ];

    XLSX.utils.book_append_sheet(workbook, basicSheet, "基本信息");
  }

  if (templateType === "education" || templateType === "all") {
    const educationData = (scholar?.education || []).map((edu) => ({
      学位: edu.degree || "",
      院校: edu.institution || "",
      专业: edu.major || "",
      起始年份: edu.year || "",
      结束年份: edu.end_year || "",
    }));

    // Add empty row for new entries
    if (educationData.length === 0 || scholar) {
      educationData.push({
        学位: "",
        院校: "",
        专业: "",
        起始年份: "",
        结束年份: "",
      });
    }

    const educationSheet = XLSX.utils.json_to_sheet(educationData);
    educationSheet["!cols"] = [
      { wch: 10 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(workbook, educationSheet, "教育经历");
  }

  if (templateType === "achievements" || templateType === "all") {
    // Publications
    const publicationsData = (scholar?.representative_publications || []).map(
      (pub) => ({
        标题: pub.title || "",
        会议期刊: pub.venue || "",
        年份: pub.year || "",
        作者: pub.authors || "",
        论文链接: pub.url || "",
        引用数: pub.citation_count || "",
      }),
    );

    if (publicationsData.length === 0) {
      publicationsData.push({
        标题: "",
        会议期刊: "",
        年份: "",
        作者: "",
        论文链接: "",
        引用数: "",
      });
    }

    const publicationsSheet = XLSX.utils.json_to_sheet(publicationsData);
    publicationsSheet["!cols"] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 8 },
      { wch: 20 },
      { wch: 25 },
      { wch: 8 },
    ];

    XLSX.utils.book_append_sheet(workbook, publicationsSheet, "论文");

    // Patents
    const patentsData = (scholar?.patents || []).map((patent) => ({
      专利名称: patent.title || "",
      专利号: patent.patent_no || "",
      年份: patent.year || "",
      发明人: patent.inventors || "",
      专利类型: patent.patent_type || "",
      状态: patent.status || "",
    }));

    if (patentsData.length === 0) {
      patentsData.push({
        专利名称: "",
        专利号: "",
        年份: "",
        发明人: "",
        专利类型: "",
        状态: "",
      });
    }

    const patentsSheet = XLSX.utils.json_to_sheet(patentsData);
    patentsSheet["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 8 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(workbook, patentsSheet, "专利");

    // Awards
    const awardsData = (scholar?.awards || []).map((award) => ({
      奖项名称: award.title || "",
      年份: award.year || "",
      级别: award.level || "",
      授予机构: award.grantor || "",
      描述: award.description || "",
    }));

    if (awardsData.length === 0) {
      awardsData.push({
        奖项名称: "",
        年份: "",
        级别: "",
        授予机构: "",
        描述: "",
      });
    }

    const awardsSheet = XLSX.utils.json_to_sheet(awardsData);
    awardsSheet["!cols"] = [
      { wch: 20 },
      { wch: 8 },
      { wch: 10 },
      { wch: 15 },
      { wch: 25 },
    ];

    XLSX.utils.book_append_sheet(workbook, awardsSheet, "奖项");
  }

  // Generate file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const timestamp = new Date().toISOString().split("T")[0];
  return new File([blob], `学者导入模板_${timestamp}.xlsx`, {
    type: blob.type,
  });
}

/**
 * Download template as file
 */
export function downloadScholarTemplate(
  scholar?: ScholarDetail,
  templateType: "basic" | "education" | "achievements" | "all" = "all",
): void {
  const file = generateScholarTemplate(scholar, templateType);
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
