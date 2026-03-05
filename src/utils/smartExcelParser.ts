import * as XLSX from "xlsx";

export interface SmartParseResult<T> {
  data: T[];
  detectedColumns: DetectedColumn[];
  errors: Array<{ row: number; error: string }>;
  confidence: number; // 0-1, how confident we are about the mapping
}

export interface DetectedColumn {
  excelHeader: string; // Original header from Excel
  mappedKey: string; // Mapped to our data model
  confidence: number; // 0-1
  sampleValues: string[]; // First few values for preview
}

// Common column name variations for different data types
const COLUMN_MAPPINGS = {
  // Scholar fields - basic info
  scholar: {
    name: ["姓名", "学者姓名", "名字", "name", "scholar_name"],
    nameEn: ["英文姓名", "英文名", "english_name", "name_en"],
    title: ["职称", "职务", "title", "position"],
    university: ["所属院校", "院校", "大学", "university", "institution"],
    department: ["所属院系", "院系", "系所", "department", "faculty"],
    email: ["电子邮箱", "邮箱", "email", "e-mail"],
    phone: ["联系电话", "电话", "手机", "phone", "mobile"],
    office: ["办公室", "office"],
    homepage: [
      "个人主页",
      "主页",
      "网站",
      "homepage",
      "website",
      "profile_url",
    ],
    researchFields: [
      "研究方向",
      "研究领域",
      "research_fields",
      "research_areas",
    ],
    // Education fields
    degree: ["学位", "degree"],
    institution: ["院校", "培养院校", "institution"],
    major: ["专业", "major"],
    startYear: ["起始年份", "入学年份", "start_year", "year"],
    endYear: ["结束年份", "毕业年份", "end_year"],
    // Publication fields
    title_pub: ["标题", "论文标题", "title"],
    venue: ["会议期刊", "期刊", "venue", "journal"],
    year: ["年份", "发表年份", "year"],
    authors: ["作者", "authors"],
    url: ["论文链接", "链接", "url"],
    citationCount: ["引用数", "引用次数", "citation_count"],
    // Patent fields
    patentTitle: ["专利名称", "专利标题", "title"],
    patentNo: ["专利号", "patent_no"],
    patentType: ["专利类型", "type"],
    inventors: ["发明人", "inventors"],
    patentStatus: ["状态", "status"],
    // Award fields
    awardTitle: ["奖项名称", "奖项标题", "title"],
    awardYear: ["年份", "year"],
    level: ["级别", "level"],
    grantor: ["授予机构", "颁奖单位", "grantor"],
    description: ["描述", "说明", "description"],
  },
  // Activity fields
  activity: {
    title: ["讲座标题", "活动标题", "标题", "title", "topic"],
    type: ["活动类型", "讲座类型", "类型", "type", "category"],
    date: ["活动日期", "讲座时间", "日期", "时间", "date", "time"],
    location: ["活动地点", "讲座地点", "地点", "location", "venue"],
    organizer: ["主办方", "组织方", "organizer", "host"],
    speakers: ["主讲人", "讲者", "speaker", "speakers"],
    speakerInstitutions: ["主讲人单位", "讲者单位", "speaker_institution"],
    description: ["活动简介", "讲座简介", "简介", "description", "abstract"],
  },
  // Institution fields
  institution: {
    name: ["机构名称", "院校名称", "名称", "name", "institution_name"],
    type: ["机构类型", "类型", "type"],
    location: ["所在地", "地址", "location", "address"],
    website: ["官网", "网站", "website", "url"],
    description: ["机构简介", "简介", "description"],
  },
  // Project fields
  project: {
    title: ["项目名称", "项目标题", "title", "project_name"],
    pi: ["项目负责人", "负责人", "PI", "principal_investigator"],
    piInstitution: ["负责人单位", "所属单位", "institution"],
    fundingAgency: ["资助机构", "资助单位", "funding_agency"],
    fundingAmount: ["资助金额", "经费", "funding_amount", "budget"],
    startYear: ["开始年份", "起始年份", "start_year"],
    endYear: ["结束年份", "终止年份", "end_year"],
    status: ["项目状态", "状态", "status"],
    category: ["项目类别", "类别", "category"],
    description: ["项目简介", "简介", "description"],
  },
  // Student fields
  student: {
    name: ["姓名", "学生姓名", "名字", "name"],
    degree: ["学位", "degree_type"],
    enrollmentYear: ["入学年份", "enrollment_year"],
    graduationYear: ["预计毕业", "毕业年份", "expected_graduation_year"],
    status: ["状态", "status"],
    university: ["所属高校", "home_university"],
    studentNo: ["学号", "student_no"],
    email: ["邮箱", "email", "e-mail"],
    phone: ["电话", "phone", "mobile"],
    notes: ["备注", "notes"],
  },
};

/**
 * Calculate similarity between two strings (case-insensitive)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Levenshtein distance for fuzzy matching
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  const maxLen = Math.max(s1.length, s2.length);
  return 1 - matrix[s1.length][s2.length] / maxLen;
}

/**
 * Detect the best matching key for an Excel header
 */
function detectColumnMapping(
  excelHeader: string,
  dataType: keyof typeof COLUMN_MAPPINGS,
): { key: string; confidence: number } | null {
  const mappings = COLUMN_MAPPINGS[dataType];
  let bestMatch: { key: string; confidence: number } | null = null;

  for (const [key, variations] of Object.entries(mappings)) {
    for (const variation of variations) {
      const similarity = calculateSimilarity(excelHeader, variation);
      if (
        similarity > 0.6 &&
        (!bestMatch || similarity > bestMatch.confidence)
      ) {
        bestMatch = { key, confidence: similarity };
      }
    }
  }

  return bestMatch;
}

/**
 * Auto-detect data type based on column headers
 */
function detectDataType(headers: string[]): keyof typeof COLUMN_MAPPINGS {
  const scores: Record<keyof typeof COLUMN_MAPPINGS, number> = {
    scholar: 0,
    activity: 0,
    institution: 0,
    project: 0,
    student: 0,
  };

  for (const header of headers) {
    for (const [dataType, mappings] of Object.entries(COLUMN_MAPPINGS)) {
      for (const variations of Object.values(mappings)) {
        for (const variation of variations) {
          if (calculateSimilarity(header, variation) > 0.7) {
            scores[dataType as keyof typeof COLUMN_MAPPINGS]++;
            break;
          }
        }
      }
    }
  }

  // Return the type with highest score
  let maxScore = 0;
  let detectedType: keyof typeof COLUMN_MAPPINGS = "scholar";

  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = type as keyof typeof COLUMN_MAPPINGS;
    }
  }

  return detectedType;
}

/**
 * Parse array fields (comma-separated values)
 */
function parseArrayField(value: unknown): string[] {
  if (!value) return [];
  const str = String(value);
  return str
    .split(/[,，、]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Parse numeric fields
 */
function parseNumericField(value: unknown): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Smart Excel parser that auto-detects structure
 */
export async function smartParseExcel<T>(
  file: File,
  expectedType?: keyof typeof COLUMN_MAPPINGS,
): Promise<SmartParseResult<T>> {
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
          { defval: "" },
        );

        if (rows.length === 0) {
          resolve({
            data: [],
            detectedColumns: [],
            errors: [{ row: 0, error: "Excel 文件为空" }],
            confidence: 0,
          });
          return;
        }

        // Get headers from first row
        const headers = Object.keys(rows[0]);

        // Auto-detect data type if not specified
        const dataType = expectedType || detectDataType(headers);

        // Detect column mappings
        const detectedColumns: DetectedColumn[] = [];
        const columnMap: Record<string, string> = {};
        let totalConfidence = 0;

        for (const header of headers) {
          const match = detectColumnMapping(header, dataType);
          if (match) {
            detectedColumns.push({
              excelHeader: header,
              mappedKey: match.key,
              confidence: match.confidence,
              sampleValues: rows
                .slice(0, 3)
                .map((row) => String(row[header] || "")),
            });
            columnMap[header] = match.key;
            totalConfidence += match.confidence;
          } else {
            // Unknown column, keep original header as key
            detectedColumns.push({
              excelHeader: header,
              mappedKey: header,
              confidence: 0.3,
              sampleValues: rows
                .slice(0, 3)
                .map((row) => String(row[header] || "")),
            });
            columnMap[header] = header;
            totalConfidence += 0.3;
          }
        }

        const overallConfidence = totalConfidence / headers.length;

        // Parse data with detected mappings
        const parsedData: T[] = [];
        const errors: Array<{ row: number; error: string }> = [];

        rows.forEach((row, index) => {
          const rowNumber = index + 2;
          const item: Record<string, unknown> = {};

          try {
            for (const [excelHeader, mappedKey] of Object.entries(columnMap)) {
              const value = row[excelHeader];

              // Handle array fields (research fields, speakers, etc.)
              if (
                mappedKey.includes("Fields") ||
                mappedKey === "speakers" ||
                mappedKey === "speakerInstitutions"
              ) {
                item[mappedKey] = parseArrayField(value);
              }
              // Handle numeric fields
              else if (
                mappedKey.includes("Amount") ||
                mappedKey.includes("Year") ||
                mappedKey.includes("Count")
              ) {
                item[mappedKey] = parseNumericField(value);
              }
              // Handle regular fields
              else {
                item[mappedKey] = value || "";
              }
            }

            parsedData.push(item as T);
          } catch (err) {
            errors.push({
              row: rowNumber,
              error: err instanceof Error ? err.message : "解析行数据失败",
            });
          }
        });

        resolve({
          data: parsedData,
          detectedColumns,
          errors,
          confidence: overallConfidence,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("解析 Excel 文件失败"));
      }
    };

    reader.onerror = () => {
      reject(new Error("读取文件失败"));
    };

    reader.readAsBinaryString(file);
  });
}
