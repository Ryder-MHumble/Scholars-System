import type {
  ScholarDetailPatch,
  EducationRecord,
  PublicationRecord,
  PatentRecord,
  AwardRecord,
} from "@/services/scholarApi";
import {
  patchScholarDetail,
  patchScholarAchievements,
} from "@/services/scholarApi";

export interface ScholarImportResult {
  success: boolean;
  basicInfoUpdated: boolean;
  educationUpdated: boolean;
  achievementsUpdated: boolean;
  errors: string[];
}

/**
 * Process imported scholar data and update via API
 */
export async function importScholarData(
  urlHash: string,
  importedData: {
    basicInfo?: Record<string, string>;
    education?: Record<string, string>[];
    publications?: Record<string, string>[];
    patents?: Record<string, string>[];
    awards?: Record<string, string>[];
  },
): Promise<ScholarImportResult> {
  const result: ScholarImportResult = {
    success: false,
    basicInfoUpdated: false,
    educationUpdated: false,
    achievementsUpdated: false,
    errors: [],
  };

  try {
    // Update basic info
    if (
      importedData.basicInfo &&
      Object.keys(importedData.basicInfo).length > 0
    ) {
      const basicPatch = parseBasicInfo(importedData.basicInfo);
      if (Object.keys(basicPatch).length > 0) {
        await patchScholarDetail(urlHash, basicPatch);
        result.basicInfoUpdated = true;
      }
    }

    // Update education
    if (importedData.education && importedData.education.length > 0) {
      const educationRecords = parseEducationRecords(importedData.education);
      if (educationRecords.length > 0) {
        await patchScholarDetail(urlHash, { education: educationRecords });
        result.educationUpdated = true;
      }
    }

    // Update achievements
    if (
      (importedData.publications && importedData.publications.length > 0) ||
      (importedData.patents && importedData.patents.length > 0) ||
      (importedData.awards && importedData.awards.length > 0)
    ) {
      const achievementsPatch = {
        representative_publications: importedData.publications
          ? parsePublicationRecords(importedData.publications)
          : undefined,
        patents: importedData.patents
          ? parsePatentRecords(importedData.patents)
          : undefined,
        awards: importedData.awards
          ? parseAwardRecords(importedData.awards)
          : undefined,
      };

      // Filter out undefined values
      const filtered = Object.fromEntries(
        Object.entries(achievementsPatch).filter(([, v]) => v !== undefined),
      );

      if (Object.keys(filtered).length > 0) {
        await patchScholarAchievements(urlHash, filtered);
        result.achievementsUpdated = true;
      }
    }

    result.success =
      result.basicInfoUpdated ||
      result.educationUpdated ||
      result.achievementsUpdated;
  } catch (err) {
    result.errors.push(
      err instanceof Error ? err.message : "Unknown error occurred",
    );
  }

  return result;
}

/**
 * Parse basic info from imported data
 */
function parseBasicInfo(data: Record<string, string>): ScholarDetailPatch {
  const patch: ScholarDetailPatch = {};

  const mapping: Record<string, string> = {
    姓名: "name",
    name: "name",
    英文名: "name_en",
    english_name: "name_en",
    职称: "position",
    position: "position",
    院系: "department",
    department: "department",
    邮箱: "email",
    email: "email",
    电话: "phone",
    phone: "phone",
    办公室: "office",
    office: "office",
    主页: "homepage",
    homepage: "homepage",
  };

  for (const [key, value] of Object.entries(data)) {
    if (value && value.trim()) {
      const patchKey = mapping[key.toLowerCase().trim()];
      if (patchKey === "name_en") {
        patch.name_en = value.trim();
      } else if (
        patchKey === "name" ||
        patchKey === "position" ||
        patchKey === "department" ||
        patchKey === "email" ||
        patchKey === "phone" ||
        patchKey === "office"
      ) {
        (patch as Record<string, unknown>)[patchKey] = value.trim();
      }
    }
  }

  // Handle research areas (comma/semicolon separated)
  if (data["研究方向"] || data["research_areas"]) {
    const areasStr = data["研究方向"] || data["research_areas"] || "";
    const areas = areasStr
      .split(/[;,，、]/)
      .map((a) => a.trim())
      .filter(Boolean);
    if (areas.length > 0) {
      patch.research_areas = areas;
    }
  }

  return patch;
}

/**
 * Parse education records from imported data
 */
function parseEducationRecords(
  data: Record<string, string>[],
): EducationRecord[] {
  return data
    .map((row) => ({
      degree: row["学位"] || row["degree"],
      institution: row["院校"] || row["institution"],
      major: row["专业"] || row["major"],
      year: row["起始年份"] || row["start_year"],
      end_year: row["结束年份"] || row["end_year"],
    }))
    .filter((edu) => edu.degree || edu.institution); // Filter out completely empty rows
}

/**
 * Parse publication records from imported data
 */
function parsePublicationRecords(
  data: Record<string, string>[],
): PublicationRecord[] {
  return data
    .map((row) => ({
      title: row["标题"] || row["title"],
      venue: row["会议期刊"] || row["venue"],
      year: row["年份"] || row["year"],
      authors: row["作者"] || row["authors"],
      url: row["论文链接"] || row["url"],
      citation_count: row["引用数"] ? parseInt(row["引用数"], 10) : undefined,
    }))
    .filter((pub) => pub.title || pub.venue); // Filter out completely empty rows
}

/**
 * Parse patent records from imported data
 */
function parsePatentRecords(data: Record<string, string>[]): PatentRecord[] {
  return data
    .map((row) => ({
      title: row["专利名称"] || row["title"],
      patent_no: row["专利号"] || row["patent_no"],
      year: row["年份"] || row["year"],
      inventors: row["发明人"] || row["inventors"],
      patent_type: row["专利类型"] || row["patent_type"],
      status: row["状态"] || row["status"],
    }))
    .filter((patent) => patent.title || patent.patent_no); // Filter out completely empty rows
}

/**
 * Parse award records from imported data
 */
function parseAwardRecords(data: Record<string, string>[]): AwardRecord[] {
  return data
    .map((row) => ({
      title: row["奖项名称"] || row["title"],
      year: row["年份"] || row["year"],
      level: row["级别"] || row["level"],
      grantor: row["授予机构"] || row["grantor"],
      description: row["描述"] || row["description"],
    }))
    .filter((award) => award.title); // Filter out completely empty rows
}
