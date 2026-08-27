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
    name_en: "name_en",
    职称: "position",
    position: "position",
    所属机构: "university",
    院校: "university",
    university: "university",
    institution: "university",
    "院系/部门": "department",
    所属院系: "department",
    院系: "department",
    部门: "department",
    department: "department",
    邮箱: "email",
    email: "email",
    电话: "phone",
    phone: "phone",
    办公室: "office",
    office: "office",
    主页: "profile_url",
    个人主页: "profile_url",
    homepage: "profile_url",
    profile_url: "profile_url",
    谷歌学术: "google_scholar_url",
    google_scholar: "google_scholar_url",
    google_scholar_url: "google_scholar_url",
    googlescholar: "google_scholar_url",
    "google scholar": "google_scholar_url",
    dblp: "dblp_url",
    dblp_url: "dblp_url",
    简介: "bio",
    个人简介: "bio",
    bio: "bio",
  };

  for (const [key, value] of Object.entries(data)) {
    const textValue = Array.isArray(value)
      ? value.map((item) => String(item ?? "")).join("；")
      : String(value ?? "");
    if (textValue.trim()) {
      const patchKey = mapping[key.toLowerCase().trim()];
      if (patchKey === "name_en") {
        patch.name_en = textValue.trim();
      } else if (
        patchKey === "name" ||
        patchKey === "position" ||
        patchKey === "university" ||
        patchKey === "department" ||
        patchKey === "email" ||
        patchKey === "phone" ||
        patchKey === "office" ||
        patchKey === "profile_url" ||
        patchKey === "google_scholar_url" ||
        patchKey === "dblp_url" ||
        patchKey === "bio"
      ) {
        (patch as Record<string, unknown>)[patchKey] = textValue.trim();
      }
    }
  }

  // Handle research areas (comma/semicolon separated)
  if (data["研究方向"] || data["research_areas"] || data["researchFields"]) {
    const rawAreas =
      data["研究方向"] || data["research_areas"] || data["researchFields"] || "";
    const areasStr = Array.isArray(rawAreas)
      ? rawAreas.map((item) => String(item ?? "")).join("；")
      : String(rawAreas);
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

function getCell(
  row: Record<string, string>,
  aliases: string[],
): string | undefined {
  for (const alias of aliases) {
    const direct = row[alias];
    if (direct !== undefined && String(direct).trim()) {
      return String(direct).trim();
    }
    const matchedKey = Object.keys(row).find(
      (key) => key.toLowerCase().trim() === alias.toLowerCase().trim(),
    );
    if (matchedKey && String(row[matchedKey] ?? "").trim()) {
      return String(row[matchedKey]).trim();
    }
  }
  return undefined;
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.match(/\d+/);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Parse education records from imported data
 */
function parseEducationRecords(
  data: Record<string, string>[],
): EducationRecord[] {
  return data
    .map((row) => ({
      degree: getCell(row, ["学位", "学历", "degree"]),
      institution: getCell(row, [
        "院校",
        "学校",
        "毕业院校",
        "培养院校",
        "institution",
        "school",
        "university",
      ]),
      major: getCell(row, ["专业", "研究方向", "学科", "major", "field"]),
      year: getCell(row, [
        "起始年份",
        "开始年份",
        "入学年份",
        "开始时间",
        "startYear",
        "start_year",
        "year",
      ]),
      end_year: getCell(row, [
        "结束年份",
        "毕业年份",
        "结束时间",
        "endYear",
        "end_year",
      ]),
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
      title: getCell(row, ["论文标题", "标题", "题名", "title"]),
      venue: getCell(row, [
        "会议期刊",
        "会议/期刊",
        "期刊会议",
        "期刊",
        "会议",
        "venue",
        "journal",
        "conference",
      ]),
      year: getCell(row, ["年份", "发表年份", "出版年份", "year"]),
      authors: getCell(row, ["作者", "论文作者", "authors"]),
      url: getCell(row, ["论文链接", "链接", "url", "doi"]),
      citation_count: parseOptionalInt(
        getCell(row, ["引用数", "引用次数", "被引次数", "citationCount", "citation_count"]),
      ),
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
