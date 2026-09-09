import type {
  PublicationRecord,
  EducationRecord,
  PatentRecord,
  AwardRecord,
  ManagementRole,
  JointProject,
} from "@/services/scholarApi";
import type { ActivityCreateRequest } from "@/services/activityApi";
import { DOMAIN_MAP } from "@/utils/institutionLogoUtils";
import {
  mergeAcademicAffiliations as mergeAcademicAffiliationsCore,
  parseAcademicAffiliationsFromText as parseAcademicAffiliationsFromTextCore,
} from "@/utils/academicAffiliationParser";

// ─── Publication Parser ──────────────────────────────────────────────────────
//
// Supports (in order of priority):
//   1. [N] Authors, "Title," Venue (Year)   — standard academic citation
//   2. Authors, "Title", Venue (Year)        — no index
//   3. Title | Venue | Year | Authors        — pipe fallback
//   4. Plain line                            — treated as title only
//
export function parsePublicationsFromText(text: string): PublicationRecord[] {
  const extractYear = (input: string): string | undefined => {
    const matches = Array.from(input.matchAll(/\b(19|20)\d{2}\b/g));
    if (matches.length === 0) return undefined;
    return matches[matches.length - 1][0];
  };

  const buildPublication = (data: {
    title?: string;
    authors?: string;
    venue?: string;
    year?: string;
    url?: string;
  }): PublicationRecord => ({
    title: data.title?.trim() || "",
    authors: data.authors?.trim() || undefined,
    venue: data.venue?.trim() || undefined,
    year: data.year?.trim() || undefined,
    url: data.url?.trim() || undefined,
    citation_count: 0,
    is_corresponding: false,
    added_by: "user",
  });

  const stripListPrefix = (line: string): string =>
    line
      .replace(/^\s*\[\d+\]\s*/, "")
      .replace(/^\s*\d{1,3}[.)、]\s*/, "")
      .replace(/^[•·]\s*/, "")
      .trim();

  const splitDelimited = (value: string): string[] =>
    value
      .split(/[|｜\t]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const parseLabeledFields = (value: string): PublicationRecord | null => {
    const pairs = value
      .split(/[；;]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (pairs.length < 2) return null;

    const mapped: Record<string, string> = {};
    for (const pair of pairs) {
      const match = pair.match(/^([^:：]+)[:：]\s*(.+)$/);
      if (!match) continue;
      const key = match[1].trim().toLowerCase();
      const val = match[2].trim();
      if (/^(标题|论文标题|题名|title)$/.test(key)) mapped.title = val;
      if (/^(作者|论文作者|authors?)$/.test(key)) mapped.authors = val;
      if (/^(会议|期刊|会议期刊|会议\/期刊|venue|journal|conference)$/.test(key)) {
        mapped.venue = val;
      }
      if (/^(年份|发表年份|出版年份|year)$/.test(key)) mapped.year = val;
      if (/^(链接|论文链接|url|doi)$/.test(key)) mapped.url = val;
    }

    if (!mapped.title && !mapped.venue) return null;
    return {
      ...buildPublication(mapped),
      url: mapped.url,
    };
  };

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line): PublicationRecord => {
    // Remove citation index [1], [2] / 1. / •
    const raw = stripListPrefix(line);

    const labeled = parseLabeledFields(raw);
    if (labeled) return labeled;

    // Extract title in quotes — handle ASCII " " and Unicode " "
    const titleMatch = raw.match(/[“"《]([^”"》]+)[”"》]/);
    const yearEndMatch = raw.match(/\((\d{4})\)[,.]?\s*$/);
    const year = yearEndMatch?.[1] ?? "";

    if (titleMatch) {
      const title = titleMatch[1].trim().replace(/,$/, "");
      const qStart = raw.indexOf(titleMatch[0]);
      const qEnd = qStart + titleMatch[0].length;

      // Authors = text before the opening quote (minus trailing comma/space)
      const authors = raw.slice(0, qStart).replace(/,\s*$/, "").trim();

      // Venue = text after closing quote, before "(year)"
      let venue = raw.slice(qEnd);
      if (yearEndMatch) {
        const yIdx = venue.lastIndexOf(`(${year})`);
        if (yIdx >= 0) venue = venue.slice(0, yIdx);
      }
      venue = venue
        .replace(/^[,.\s]+/, "")
        .replace(/[,.\s]+$/, "")
        .trim();

      return buildPublication({
        title,
        authors,
        venue,
        year: year || extractYear(raw),
      });
    }

    // Pipe-delimited fallback
    const delimitedParts = splitDelimited(raw);
    if (delimitedParts.length >= 2) {
      const p = delimitedParts;
      return buildPublication({
        title: p[0] ?? "",
        venue: p[1] ?? "",
        year: p[2] ?? "",
        authors: p[3] ?? "",
        url: p[4] ?? "",
      });
    }

    const dashParts = raw
      .split(/\s+[—–-]\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (dashParts.length >= 2) {
      const maybeYear = dashParts[dashParts.length - 1];
      const yearFromTail = extractYear(maybeYear);
      const bodyParts = yearFromTail ? dashParts.slice(0, -1) : dashParts;
      if (bodyParts.length >= 2) {
        return buildPublication({
          title: bodyParts[0],
          venue: bodyParts.slice(1).join(" - "),
          year: yearFromTail || extractYear(raw),
        });
      }
    }

    // Sentence citation fallback:
    // Authors. Title. Venue ... , 2022.
    const sentenceParts = raw
      .split(/\.\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentenceParts.length >= 3) {
      const authors = sentenceParts[0].replace(/\.$/, "").trim();
      const title = sentenceParts[1].replace(/\.$/, "").trim();
      const venue = sentenceParts
        .slice(2)
        .join(". ")
        .replace(/\.$/, "")
        .trim();
      if (title && venue) {
        return buildPublication({
          title,
          authors,
          venue,
          year: extractYear(raw),
        });
      }
    }

    // Comma citation fallback:
    // Title, Venue ... (2021) ...
    const commaParts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (commaParts.length >= 2) {
      const last = commaParts[commaParts.length - 1];
      const isYearOnlyTail = /^(19|20)\d{2}[.)]?$/i.test(
        last.replace(/\s+/g, ""),
      );

      if (isYearOnlyTail && commaParts.length >= 3) {
        const title = commaParts.slice(0, -2).join(", ");
        const venue = commaParts.slice(-2).join(", ");
        if (title && venue) {
          return buildPublication({
            title,
            venue,
            year: extractYear(raw),
          });
        }
      } else {
        const title = commaParts.slice(0, -1).join(", ");
        const venue = commaParts[commaParts.length - 1];
        if (title && venue) {
          return buildPublication({
            title,
            venue,
            year: extractYear(raw),
          });
        }
      }
    }

    // Last resort: whole line is the title
    return buildPublication({
      title: raw,
      year: year || extractYear(raw),
    });
  });
}

// ─── Education Parser ────────────────────────────────────────────────────────
//
// Supports:
//   1. "2015-2019 清华大学 本科 数学"
//   2. "2006/11 to 2009/10  Bonn University  PhD in Mathematical Physics"
//   3. "2006-2009  MIT  PhD, Computer Science"
//   4. "PhD in Computer Science, MIT, 2015-2020"
//   5. Degree | Institution | Major | StartYear | EndYear   — pipe fallback
//
//   Multi-line entries are auto-merged: a new entry only starts when a line
//   begins with a 4-digit year or a pipe character.
//
export function parseEducationFromText(text: string): EducationRecord[] {
  const DATE_TOKEN_RE =
    /(?:19|20)\d{2}(?:[./-]\d{1,2})?|(?:19|20)\d{2}年(?:\d{1,2}月?)?/;
  const DATE_RANGE_RE = new RegExp(
    `(${DATE_TOKEN_RE.source})\\s*(?:to|TO|至|—|–|-|~|～)\\s*(${DATE_TOKEN_RE.source}|present|now|至今)`,
    "i",
  );

  const DEGREE_PATTERNS = [
    { re: /\bPostdoc(?:toral)?\b|博士后/i, label: "博士后" },
    { re: /\bPh\.?D\.?\b|\bDoctor(?:al|ate)?\b|博士/i, label: "博士" },
    { re: /\bM\.?Sc?\.?\b|\bMaster\b|硕士/i, label: "硕士" },
    { re: /\bB\.?Sc?\.?\b|\bBachelor\b|学士/i, label: "学士" },
    { re: /本科/i, label: "本科" },
  ];

  const normalizeYear = (value: string): string => {
    if (!value) return "";
    const cleaned = value.trim();
    if (/^(present|now|至今)$/i.test(cleaned)) return "至今";
    const yearMatch = cleaned.match(/(19|20)\d{2}/);
    return yearMatch ? yearMatch[0] : "";
  };

  const detectDegree = (value: string): string => {
    for (const { re, label } of DEGREE_PATTERNS) {
      if (re.test(value)) return label;
    }
    return "";
  };

  const extractMajorAfterDegree = (value: string): string => {
    const match = value.match(/(?:in|of|and|degree\s+in|专业|方向)\s+(.+)$/i);
    if (match?.[1]) return match[1].replace(/^[,，\s]+|[,，.\s]+$/g, "").trim();
    return "";
  };

  const normalizeMajor = (value: string): string => {
    const major = value.trim();
    return /^(无专业信息|无专业|暂无专业信息|未提供专业)$/i.test(major)
      ? ""
      : major;
  };

  const splitChineseInstitution = (
    tokens: string[],
  ): { institution: string; department: string } => {
    const combined = tokens.join(" ").trim();
    if (!combined || !/^[\u3400-\u9fff\s]+$/.test(combined)) {
      return { institution: combined, department: "" };
    }

    const institutionNames = Object.keys(DOMAIN_MAP).sort(
      (a, b) => b.length - a.length,
    );
    const institution = institutionNames.find((name) =>
      combined.replace(/\s+/g, "").startsWith(name),
    );
    if (institution) {
      const compactCombined = combined.replace(/\s+/g, "");
      return {
        institution,
        department: compactCombined.slice(institution.length).trim(),
      };
    }

    const fallback = combined
      .replace(/\s+/g, "")
      .match(/^(.+?(?:大学|学院))(.+)$/);
    return fallback
      ? { institution: fallback[1], department: fallback[2] }
      : { institution: combined, department: "" };
  };

  const stripListPrefix = (line: string): string =>
    line
      .replace(/^\s*\[\d+\]\s*/, "")
      .replace(/^\s*\d{1,3}[.)、]\s*/, "")
      .replace(/^[•·]\s*/, "")
      .trim();

  const splitDelimited = (value: string): string[] =>
    value
      .split(/[|｜\t]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const parseDateToken = (
    value: string,
  ): { start: string; end: string } | null => {
    const token = value.trim();
    if (!token) return null;

    // Single year / year-month token.
    if (/^(?:19|20)\d{2}(?:[./-]\d{1,2})?$/.test(token)) {
      const y = normalizeYear(token);
      return y ? { start: y, end: "" } : null;
    }

    // Inline range token like "2003-2007" / "2003至2007".
    const inlineRange = token.match(
      /^((?:19|20)\d{2}(?:[./-]\d{1,2})?)\s*(?:to|TO|至|—|–|-|~|～)\s*((?:19|20)\d{2}(?:[./-]\d{1,2})?|present|now|至今)$/i,
    );
    if (!inlineRange) return null;

    const start = normalizeYear(inlineRange[1]);
    const end = normalizeYear(inlineRange[2]);
    if (!start && !end) return null;
    return { start, end };
  };

  const parseStandardEducationLine = (value: string): EducationRecord | null => {
    const rangeMatch = value.match(
      /^((?:19|20)\d{2}(?:[./]\d{1,2})?)\s*(?:to|TO|至|—|–|-|~|～)\s*((?:19|20)\d{2}(?:[./]\d{1,2})?|present|now|至今)\s+(.+)$/i,
    );
    const singleMatch = value.match(
      /^((?:19|20)\d{2}(?:[./]\d{1,2})?)\s+(.+)$/i,
    );
    if (!rangeMatch && !singleMatch) return null;

    const date = rangeMatch
      ? {
          start: normalizeYear(rangeMatch[1]),
          end: normalizeYear(rangeMatch[2]),
        }
      : parseDateToken(singleMatch?.[1] || "");
    if (!date) return null;

    const tokens = (rangeMatch?.[3] || singleMatch?.[2] || "")
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const degreeIndex = tokens.findIndex((token) => Boolean(detectDegree(token)));
    if (degreeIndex <= 0) return null;

    const degreeToken = tokens[degreeIndex];
    const beforeDegree = tokens.slice(0, degreeIndex);
    const afterDegree = tokens.slice(degreeIndex + 1);
    let institution = beforeDegree.join(" ").trim();
    let department = "";
    let major = normalizeMajor(afterDegree.join(" "));

    const compactInstitution = splitChineseInstitution(beforeDegree);
    if (beforeDegree.length === 1 && compactInstitution.department) {
      institution = compactInstitution.institution;
      department = compactInstitution.department;
    }

    // Chinese CVs commonly place school, department, major, and degree in order.
    // Preserve the old whitespace-based format for English or shorter entries.
    if (
      !department &&
      beforeDegree.length >= 3 &&
      beforeDegree.some((token) => /[\u3400-\u9fff]/.test(token))
    ) {
      institution = beforeDegree[0] || "";
      department = beforeDegree.slice(1, -1).join(" ").trim();
      major = normalizeMajor(
        [beforeDegree[beforeDegree.length - 1], ...afterDegree]
          .filter(Boolean)
          .join(" "),
      );
    }
    if (!institution) return null;

    return {
      year: date.start,
      end_year: date.end,
      institution,
      department,
      degree: detectDegree(degreeToken) || degreeToken,
      major,
    };
  };

  // ── Group lines into entries ──────────────────────────────────────────────
  const lines = text
    .split("\n")
    .map((l) => stripListPrefix(l.trim()))
    .filter(Boolean);

  const chunks: string[] = [];
  let cur = "";
  for (const line of lines) {
    const beginsWithDate = /^\s*(?:19|20)\d{2}/.test(line);
    const beginsWithDegree =
      Boolean(detectDegree(line)) && (DATE_RANGE_RE.test(line) || /[,，;；]/.test(line));
    const beginsNewEntry =
      beginsWithDate || beginsWithDegree || /[|｜\t]/.test(line);
    if (beginsNewEntry && cur) {
      chunks.push(cur);
      cur = line;
    } else {
      cur = cur ? `${cur} ${line}` : line;
    }
  }
  if (cur) chunks.push(cur);

  // ── Parse each chunk ──────────────────────────────────────────────────────
  return chunks
    .map((chunk): EducationRecord => {
      const labeledParts = chunk
        .split(/[；;]/)
        .map((part) => part.trim())
        .filter(Boolean);
      if (labeledParts.length >= 2 && labeledParts.some((part) => /[:：]/.test(part))) {
        const mapped: Record<string, string> = {};
        for (const part of labeledParts) {
          const match = part.match(/^([^:：]+)[:：]\s*(.+)$/);
          if (!match) continue;
          const key = match[1].trim().toLowerCase();
          const value = match[2].trim();
          if (/^(学位|学历|degree)$/.test(key)) mapped.degree = value;
          if (/^(院校|学校|毕业院校|培养院校|institution|school|university)$/.test(key)) {
            mapped.institution = value;
          }
          if (/^(专业|方向|学科|major|field|discipline)$/.test(key)) mapped.major = value;
          if (/^(起始年份|开始年份|入学年份|开始时间|start|start_year|year)$/.test(key)) {
            mapped.year = normalizeYear(value);
          }
          if (/^(结束年份|毕业年份|结束时间|end|end_year)$/.test(key)) {
            mapped.end_year = normalizeYear(value);
          }
          if (/^(时间|日期|period|date|duration)$/.test(key)) {
            const range = value.match(DATE_RANGE_RE);
            if (range) {
              mapped.year = normalizeYear(range[1]);
              mapped.end_year = normalizeYear(range[2]);
            } else {
              mapped.year = normalizeYear(value);
            }
          }
        }
        return {
          degree: mapped.degree || detectDegree(chunk),
          institution: mapped.institution || "",
          major: mapped.major || "",
          year: mapped.year || "",
          end_year: mapped.end_year || "",
        };
      }

      const delimitedParts = splitDelimited(chunk);
      if (delimitedParts.length >= 2) {
        const p = delimitedParts;
        const firstDate = parseDateToken(p[0] || "");
        if (firstDate) {
          const degreePart = p.find((part) => detectDegree(part)) || "";
          const institutionPart =
            p.find((part) => part !== p[0] && part !== degreePart) || "";
          return {
            degree: detectDegree(degreePart),
            institution: institutionPart,
            major:
              extractMajorAfterDegree(degreePart) ||
              p.find(
                (part) =>
                  part !== p[0] && part !== degreePart && part !== institutionPart,
              ) ||
              "",
            year: firstDate.start,
            end_year: firstDate.end,
          };
        }
        return {
          degree: p[0] ?? "",
          institution: p[1] ?? "",
          major: p[2] ?? "",
          year: p[3] ?? "",
          end_year: p[4] ?? "",
        };
      }

      const standard = parseStandardEducationLine(chunk);
      if (standard) return standard;

      let remaining = chunk;
      let year = "";
      let end_year = "";

      // Extract date range
      const rangeMatch = remaining.match(DATE_RANGE_RE);
      if (rangeMatch) {
        year = normalizeYear(rangeMatch[1]);
        end_year = normalizeYear(rangeMatch[2]);
        remaining = remaining
          .replace(rangeMatch[0], " ")
          .replace(/^[,，、;；\s]+/, "")
          .trim();
      }

      // Find degree keyword
      let degree = detectDegree(remaining);
      let degreePos = -1;
      let degreeLen = 0;
      for (const { re } of DEGREE_PATTERNS) {
        const m = remaining.match(re);
        if (m && m.index !== undefined) {
          degreePos = m.index;
          degreeLen = m[0].length;
          break;
        }
      }

      let institution = "";
      let major = "";

      // Chinese CV style:
      // "2015-02至2018-04, 学校, 专业, 博士"
      const commaParts = remaining
        .split(/[，,；;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (commaParts.length >= 2) {
        const parts = [...commaParts];
        const firstDegree = detectDegree(parts[0]);
        const lastDegree = detectDegree(parts[parts.length - 1]);

        if (lastDegree) {
          degree = degree || lastDegree;
          parts.pop();
        } else if (firstDegree) {
          degree = degree || firstDegree;
          const head = parts.shift() || "";
          major = extractMajorAfterDegree(head);
        }

        // If first token is date/date-range, map it to start/end year.
        const firstDate = parseDateToken(parts[0] || "");
        if (firstDate) {
          if (!year && firstDate.start) year = firstDate.start;
          if (!end_year && firstDate.end) end_year = firstDate.end;
          parts.shift();
        }

        if (!institution && parts.length > 0) {
          institution = parts[0];
        }
        if (!major && parts.length > 1) {
          major = parts.slice(1).join("，");
        }
      }

      if (degreePos >= 0 && !institution) {
        // Text before degree keyword → institution
        institution = remaining
          .slice(0, degreePos)
          .replace(/[，,\s]+$/, "")
          .trim();
        // Text after degree keyword: look for "in/of <major>"
        const afterDegree = remaining.slice(degreePos + degreeLen).trim();
        const extractedMajor = extractMajorAfterDegree(afterDegree);
        if (extractedMajor) {
          major = extractedMajor;
        } else if (afterDegree && !institution) {
          // No "in", just use what's there as institution
          institution = afterDegree.replace(/^[,，\s]+/, "").trim();
        }
        // If no institution found before degree, check after major
        if (!institution && major) {
          const commaIdx = Math.max(major.lastIndexOf(","), major.lastIndexOf("，"));
          if (commaIdx > 0) {
            institution = major.slice(commaIdx + 1).trim();
            major = major.slice(0, commaIdx).trim();
          }
        }
      } else {
        // No degree keyword found — whole text is institution
        if (!institution) institution = remaining.trim();
      }

      // Fallback year from remaining text
      if (!year) {
        const singleYear = remaining.match(/(19|20)\d{2}/);
        if (singleYear) year = singleYear[0];
      }

      return { degree, institution, major, year, end_year };
    })
    .filter((r) => r.degree || r.institution || r.year);
}

function stripListPrefix(line: string): string {
  return line
    .replace(/^\s*\[\d+\]\s*/, "")
    .replace(/^\s*\d{1,3}[.)、]\s*/, "")
    .replace(/^[•·]\s*/, "")
    .trim();
}

function extractYearToken(input: string): string {
  const match = input.match(/(?:19|20)\d{2}|至今|present|now/i);
  if (!match) return "";
  const value = match[0];
  return /^(present|now)$/i.test(value) ? "至今" : value;
}

// ─── Management Role Parser ──────────────────────────────────────────────────
//
// Supports:
//   1. "职务 | 机构 | 开始 | 结束"
//   2. "机构 | 职务 | 开始 | 结束" when the first column looks like an org
//   3. "机构 职务 2023-至今"
//   4. "职务：...；机构：...；开始：...；结束：..."
//
export function parseManagementRolesFromText(text: string): ManagementRole[] {
  const parseLabeledFields = (value: string): ManagementRole | null => {
    const pairs = value
      .split(/[；;]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (pairs.length < 2) return null;

    const mapped: Record<string, string> = {};
    for (const pair of pairs) {
      const match = pair.match(/^([^:：]+)[:：]\s*(.+)$/);
      if (!match) continue;
      const key = match[1].trim().toLowerCase();
      const val = match[2].trim();
      if (/^(职务|兼职|岗位|角色|role|position|title)$/.test(key)) mapped.role = val;
      if (/^(机构|兼职机构|单位|组织|organization|institution|org)$/.test(key)) mapped.organization = val;
      if (/^(开始|开始年份|起始|start|start_year)$/.test(key)) mapped.start_year = val;
      if (/^(结束|结束年份|终止|end|end_year)$/.test(key)) mapped.end_year = val;
    }

    if (!mapped.role && !mapped.organization) return null;
    return {
      role: mapped.role || "",
      organization: mapped.organization || "",
      start_year: mapped.start_year || "",
      end_year: mapped.end_year || "",
    };
  };

  const looksLikeOrganization = (value: string): boolean =>
    /(大学|学院|研究院|实验室|中心|协会|学会|委员会|University|Institute|College|School|Lab|Center|Association|Society)/i.test(value);

  return text
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((line) => {
      // A pasted homepage paragraph often separates appointments with semicolons.
      // Keep labeled rows intact, but split plain rows into independent records.
      const candidates = /[:：]/.test(line)
        ? [line]
        : line.split(/[；;]/).map((item) => item.trim()).filter(Boolean);
      return candidates.map((l) => {
      const raw = stripListPrefix(l);
      const labeled = parseLabeledFields(raw);
      if (labeled) return labeled;

      const parts = raw
        .split(/[|｜\t]|\s{2,}/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        const firstIsOrg = looksLikeOrganization(parts[0]);
        return {
          role: firstIsOrg ? parts[1] || "" : parts[0] || "",
          organization: firstIsOrg ? parts[0] || "" : parts[1] || "",
          start_year: parts[2] || "",
          end_year: parts[3] || "",
        };
      }

      const rangeMatch = raw.match(
        /((?:19|20)\d{2}(?:[./-]\d{1,2})?|至今|present|now)\s*(?:-|—|–|~|～|至|到)\s*((?:19|20)\d{2}(?:[./-]\d{1,2})?|至今|present|now)/i,
      );
      const start_year = rangeMatch ? extractYearToken(rangeMatch[1]) : "";
      const end_year = rangeMatch ? extractYearToken(rangeMatch[2]) : "";
      const withoutRange = rangeMatch
        ? raw.replace(rangeMatch[0], "").replace(/[，,；;()（）]+/g, " ").trim()
        : raw;
      const orgMatch = withoutRange.match(
        /^(.+?(?:大学|学院|研究院|实验室|中心|协会|学会|委员会|University|Institute|College|School|Lab|Center|Association|Society))\s+(.+)$/i,
      );
      if (orgMatch) {
        return {
          organization: orgMatch[1].trim(),
          role: orgMatch[2].trim(),
          start_year,
          end_year,
        };
      }

      return {
        role: withoutRange || raw,
        organization: "",
        start_year,
        end_year,
      };
      });
    })
    .filter((item) => item.role || item.organization);
}

/** Academic-service aliases share the same tolerant parser but stay out of employment fields. */
export function parseAcademicAffiliationsFromText(text: string): ManagementRole[] {
  return parseAcademicAffiliationsFromTextCore(text);
}

export function mergeAcademicAffiliations(
  existing: ManagementRole[],
  incoming: ManagementRole[],
): ManagementRole[] {
  return mergeAcademicAffiliationsCore(existing, incoming);
}

// ─── Scholar Activity Parser ─────────────────────────────────────────────────
//
// Supports:
//   1. "标题 | 日期 | 类型 | 分类 | 地点 | 摘要"
//   2. "标题：...；日期：2026-09-08；类型：讲座；分类：学术活动；地点：..."
//   3. "2026-09-08 标题 地点"
//
export function parseScholarActivitiesFromText(
  text: string,
): ActivityCreateRequest[] {
  const today = new Date().toISOString().slice(0, 10);
  const extractDate = (input: string): string => {
    const iso = input.match(/\b((?:19|20)\d{2})[-/.年](\d{1,2})(?:[-/.月](\d{1,2})日?)?\b/);
    if (!iso) return today;
    const year = iso[1];
    const month = String(Number(iso[2])).padStart(2, "0");
    const day = String(Number(iso[3] || "1")).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const extractTime = (input: string): string | undefined => {
    const match = input.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (!match) return undefined;
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  };

  const buildActivity = (data: Partial<ActivityCreateRequest>): ActivityCreateRequest => ({
    title: data.title?.trim() || "未命名学者活动",
    event_date: data.event_date?.trim() || today,
    event_time: data.event_time?.trim() || undefined,
    event_type: data.event_type?.trim() || "学者活动",
    category: data.category?.trim() || "学者活动",
    location: data.location?.trim() || "待定",
    abstract: data.abstract?.trim() || undefined,
    scholar_ids: data.scholar_ids,
  });

  const parseLabeledFields = (value: string): ActivityCreateRequest | null => {
    const pairs = value
      .split(/[；;]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (pairs.length < 2) return null;

    const mapped: Partial<ActivityCreateRequest> = {};
    for (const pair of pairs) {
      const match = pair.match(/^([^:：]+)[:：]\s*(.+)$/);
      if (!match) continue;
      const key = match[1].trim().toLowerCase();
      const val = match[2].trim();
      if (/^(标题|活动|活动标题|名称|title)$/.test(key)) mapped.title = val;
      if (/^(日期|活动日期|时间|date|event_date)$/.test(key)) {
        mapped.event_date = extractDate(val);
        mapped.event_time = extractTime(val);
      }
      if (/^(类型|活动类型|type|event_type)$/.test(key)) mapped.event_type = val;
      if (/^(分类|类别|category)$/.test(key)) mapped.category = val;
      if (/^(地点|位置|location|venue)$/.test(key)) mapped.location = val;
      if (/^(摘要|简介|内容|描述|abstract|description)$/.test(key)) mapped.abstract = val;
    }

    if (!mapped.title && !mapped.abstract) return null;
    return buildActivity(mapped);
  };

  const parsed = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line): ActivityCreateRequest => {
      const raw = stripListPrefix(line);
      const labeled = parseLabeledFields(raw);
      if (labeled) return labeled;

      const parts = raw.split(/[|｜\t]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return buildActivity({
          title: parts[0],
          event_date: extractDate(parts[1]),
          event_time: extractTime(parts[1]),
          event_type: parts[2],
          category: parts[3],
          location: parts[4],
          abstract: parts[5],
        });
      }

      const date = extractDate(raw);
      const time = extractTime(raw);
      const dateMatch = raw.match(/(?:19|20)\d{2}[-/.年]\d{1,2}(?:[-/.月]\d{1,2}日?)?/);
      const title = raw
        .replace(dateMatch?.[0] ?? "", "")
        .replace(/\b([01]?\d|2[0-3]):[0-5]\d\b/, "")
        .replace(/^[-–—•·\s]+|[-–—•·\s]+$/g, "")
        .replace(/[，,；;]+$/, "")
        .trim();

      return buildActivity({
        title: title || raw,
        event_date: date,
        event_time: time,
      });
    })
    .filter((item) => item.title || item.abstract);

  const seen = new Set<string>();
  return parsed.filter((item) => {
    const key = `${item.title.trim().toLocaleLowerCase()}|${item.event_date.trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Patent Parser ───────────────────────────────────────────────────────────
//
// Supports:
//   1. "标题 | 专利号 | 年份 | 发明人 | 类型 | 状态"
//   2. "[1]张三,李四.一种方法..., ZL202511129049.1"
//   3. "[10]A,B. Method ..., 2023-05-24, 英国, 2307784.5"
//
export function parsePatentsFromText(text: string): PatentRecord[] {
  const stripListPrefix = (line: string): string =>
    line.replace(/^\s*\[\d+\]\s*/, "").replace(/^\s*\d+[.)、]\s*/, "").trim();

  const patentNoRe = /\b(?:ZL)?\d{7,}\.\d\b|\b[A-Z]{2}\d{6,}[A-Z]?\b/g;
  const countryRe = /^(中国|美国|英国|日本|德国|法国|韩国|欧盟|欧洲|加拿大|澳大利亚)$/;

  const inferPatentType = (patentNo: string): string => {
    if (!patentNo) return "";
    if (/[.。]1$/i.test(patentNo)) return "发明专利";
    if (/[.。]2$/i.test(patentNo) || /U$/i.test(patentNo)) return "实用新型";
    if (/[.。]3$/i.test(patentNo) || /S$/i.test(patentNo)) return "外观设计";
    if (/^[A-Z]{2}\d+[ABC]$/i.test(patentNo)) return "发明专利";
    return "";
  };

  const inferStatus = (patentNo: string): string => {
    if (!patentNo) return "";
    if (/^ZL/i.test(patentNo) || /[BC]$/i.test(patentNo)) return "已授权";
    if (/A$/i.test(patentNo)) return "公开";
    return "";
  };

  const looksLikeMeta = (segment: string): boolean => {
    if (!segment) return true;
    const s = segment.trim();
    if (!s) return true;
    if (countryRe.test(s)) return true;
    if (/^\d{4}(?:[./-]\d{1,2}){1,2}$/.test(s)) return true;
    if (/^(19|20)\d{2}$/.test(s)) return true;
    patentNoRe.lastIndex = 0;
    return patentNoRe.test(s);
  };

  const parseLabeledFields = (value: string): PatentRecord | null => {
    const pairs = value
      .split(/[；;]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (pairs.length < 2) return null;

    const mapped: Record<string, string> = {};
    for (const pair of pairs) {
      const match = pair.match(/^([^:：]+)[:：]\s*(.+)$/);
      if (!match) continue;
      const key = match[1].trim().toLowerCase();
      const val = match[2].trim();
      if (/^(专利名称|专利标题|标题|名称|title)$/.test(key)) mapped.title = val;
      if (/^(专利号|申请号|公开号|授权号|patent_no|patent number)$/.test(key)) {
        mapped.patent_no = val;
      }
      if (/^(年份|申请年份|授权年份|year)$/.test(key)) mapped.year = val;
      if (/^(发明人|作者|inventors?)$/.test(key)) mapped.inventors = val;
      if (/^(类型|专利类型|patent_type|type)$/.test(key)) mapped.patent_type = val;
      if (/^(状态|法律状态|status)$/.test(key)) mapped.status = val;
    }

    if (!mapped.title && !mapped.patent_no && !mapped.inventors) return null;
    return {
      title: mapped.title || "",
      patent_no: mapped.patent_no || "",
      year: mapped.year || "",
      inventors: mapped.inventors || "",
      patent_type: mapped.patent_type || inferPatentType(mapped.patent_no || ""),
      status: mapped.status || inferStatus(mapped.patent_no || ""),
      added_by: "user",
    };
  };

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines
    .map((line): PatentRecord => {
      const raw = stripListPrefix(line);

      const labeled = parseLabeledFields(raw);
      if (labeled) return labeled;

      // Keep legacy pipe format fully compatible.
      if (raw.includes("|") || raw.includes("｜")) {
        const p = raw.split(/[|｜]/).map((s) => s.trim());
        return {
          title: p[0] || "",
          patent_no: p[1] || "",
          year: p[2] || "",
          inventors: p[3] || "",
          patent_type: p[4] || "",
          status: p[5] || "",
          added_by: "user",
        };
      }

      let remaining = raw.replace(/，/g, ",");

      const patentNoMatches = Array.from(remaining.matchAll(patentNoRe));
      const patent_no =
        patentNoMatches.length > 0
          ? patentNoMatches[patentNoMatches.length - 1][0]
          : "";
      if (patent_no) {
        remaining = remaining.replace(patent_no, " ").trim();
      }

      let year = "";
      const dateMatch = remaining.match(/((?:19|20)\d{2})[./-]\d{1,2}[./-]\d{1,2}/);
      if (dateMatch) year = dateMatch[1];
      if (!year) {
        const yearMatch = remaining.match(/(19|20)\d{2}/);
        if (yearMatch) year = yearMatch[0];
      }
      if (!year && patent_no) {
        const patentYear = patent_no.match(/(?:ZL)?((?:19|20)\d{2})\d+/i);
        if (patentYear) year = patentYear[1];
      }

      let inventors = "";
      const dotIndex = remaining.search(/[。.]/);
      if (dotIndex > 0) {
        const prefix = remaining.slice(0, dotIndex).trim();
        const tokens = prefix
          .split(/[，,;；]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (tokens.length >= 2) {
          inventors = tokens.join("; ");
          remaining = remaining.slice(dotIndex + 1).trim();
        }
      }

      const parts = remaining
        .split(/[，,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const titleParts: string[] = [];
      for (const part of parts) {
        if (looksLikeMeta(part)) {
          if (titleParts.length > 0) break;
          continue;
        }
        titleParts.push(part);
      }

      const title = (titleParts.join(", ") || remaining)
        .replace(/[，,\s]+$/, "")
        .trim();

      const patent_type = inferPatentType(patent_no);
      const status = inferStatus(patent_no);

      return {
        title,
        patent_no,
        year,
        inventors,
        patent_type,
        status,
        added_by: "user",
      };
    })
    .filter((item) => item.title || item.patent_no || item.inventors);
}

// ─── Award Parser ────────────────────────────────────────────────────────────
//
// Supports:
//   1. "奖项名称 | 年份 | 等级 | 颁发单位 | 描述"
//   2. "[1]2025年度中国自动化学会自然科学一等奖（排1）"
//   3. "[2]2025年度智源研究院“智源学者”"
//
export function parseAwardsFromText(text: string): AwardRecord[] {
  const stripListPrefix = (line: string): string =>
    line.replace(/^\s*\[\d+\]\s*/, "").replace(/^\s*\d+[.)、]\s*/, "").trim();

  const parseLabeledFields = (value: string): AwardRecord | null => {
    const pairs = value
      .split(/[；;]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (pairs.length < 2) return null;

    const mapped: Record<string, string> = {};
    for (const pair of pairs) {
      const match = pair.match(/^([^:：]+)[:：]\s*(.+)$/);
      if (!match) continue;
      const key = match[1].trim().toLowerCase();
      const val = match[2].trim();
      if (/^(奖项名称|奖项|标题|名称|title)$/.test(key)) mapped.title = val;
      if (/^(年份|获奖年份|year)$/.test(key)) mapped.year = val;
      if (/^(等级|级别|奖项等级|level)$/.test(key)) mapped.level = val;
      if (/^(颁发单位|授奖单位|主办单位|grantor|issuer)$/.test(key)) mapped.grantor = val;
      if (/^(描述|说明|备注|description|note)$/.test(key)) mapped.description = val;
    }

    if (!mapped.title && !mapped.year && !mapped.level) return null;
    return {
      title: mapped.title || "",
      year: mapped.year || "",
      level: mapped.level || "",
      grantor: mapped.grantor || "",
      description: mapped.description || "",
      added_by: "user",
    };
  };

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines
    .map((line): AwardRecord => {
      const raw = stripListPrefix(line);

      const labeled = parseLabeledFields(raw);
      if (labeled) return labeled;

      // Keep legacy pipe format fully compatible.
      if (raw.includes("|") || raw.includes("｜")) {
        const p = raw.split(/[|｜]/).map((s) => s.trim());
        return {
          title: p[0] || "",
          year: p[1] || "",
          level: p[2] || "",
          grantor: p[3] || "",
          description: p[4] || "",
          added_by: "user",
        };
      }

      let content = raw.replace(/[。；;]+$/, "").trim();

      // Keep bracket text in title (e.g. 《...（英文版）》), only strip trailing notes.
      const descriptions: string[] = [];
      while (true) {
        const tail = content.match(/[（(]([^（）()]+)[）)]\s*$/);
        if (!tail) break;
        const note = (tail[1] || "").trim();
        if (note) descriptions.unshift(note);
        const tailIndex = tail.index ?? -1;
        if (tailIndex < 0) break;
        content = content.slice(0, tailIndex).trim();
      }
      const description = descriptions.join("；");

      const yearMatch = content.match(/(19|20)\d{2}/);
      const year = yearMatch ? yearMatch[0] : "";

      const title = content.replace(/^(?:19|20)\d{2}\s*(?:年度|年)?/, "").trim() || content;
      const body = title;

      let level = "";
      let grantor = "";

      const quoted = body.match(/[“"]([^”"]+)[”"]/);
      if (quoted) {
        level = quoted[1].trim();
        const idx = quoted.index ?? 0;
        grantor = body
          .slice(0, idx)
          .replace(/[：:，,\s]+$/, "")
          .trim();
      } else {
        const levelMatch = body.match(
          /(特等奖|一等奖|二等奖|三等奖|金奖|银奖|铜奖|最佳[^，,；;]*奖|优秀[^，,；;]*奖|青年[^，,；;]*奖|[^，,；;]*论文奖|[^，,；;]*学者|[^，,；;]*人才项目|[^，,；;]*榜单)$/,
        );
        if (levelMatch) {
          level = levelMatch[1].trim();
          const idx = body.lastIndexOf(level);
          grantor = idx > 0 ? body.slice(0, idx).replace(/[：:，,\s]+$/, "").trim() : "";
        }
      }

      return {
        title,
        year,
        level,
        grantor,
        description,
        added_by: "user",
      };
    })
    .filter((item) => item.title || item.year || item.level);
}

// ─── Project Parser ──────────────────────────────────────────────────────────
//
// Supports:
//   1. "项目名称 | 年份 | 描述"
//   2. "项目名称：...；年份：2024；描述：..."
//   3. "2024 项目名称 描述"
//
export function parseProjectsFromText(text: string): JointProject[] {
  const stripListPrefix = (line: string): string =>
    line.replace(/^\s*\[\d+\]\s*/, "").replace(/^\s*\d+[.)、]\s*/, "").trim();

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines
    .map((line): JointProject => {
      const raw = stripListPrefix(line);

      const labeledParts = raw
        .split(/[；;]/)
        .map((part) => part.trim())
        .filter(Boolean);
      if (labeledParts.length >= 2 && labeledParts.some((part) => /[:：]/.test(part))) {
        const mapped: Record<string, string> = {};
        for (const part of labeledParts) {
          const match = part.match(/^([^:：]+)[:：]\s*(.+)$/);
          if (!match) continue;
          const key = match[1].trim().toLowerCase();
          const value = match[2].trim();
          if (/^(项目名称|项目|标题|名称|title)$/.test(key)) mapped.title = value;
          if (/^(年份|立项年份|year)$/.test(key)) mapped.year = value;
          if (/^(描述|说明|项目描述|description)$/.test(key)) mapped.description = value;
        }
        return {
          title: mapped.title || "",
          year: mapped.year || "",
          description: mapped.description || "",
        };
      }

      if (raw.includes("|") || raw.includes("｜")) {
        const parts = raw.split(/[|｜]/).map((s) => s.trim());
        return {
          title: parts[0] || "",
          year: parts[1] || "",
          description: parts[2] || "",
        };
      }

      const yearPrefix = raw.match(/^((?:19|20)\d{2})\s+(.+)$/);
      if (yearPrefix) {
        const rest = yearPrefix[2].trim();
        const parts = rest.split(/\s{2,}|[，,；;]/).map((s) => s.trim()).filter(Boolean);
        return {
          year: yearPrefix[1],
          title: parts[0] || rest,
          description: parts.slice(1).join("；"),
        };
      }

      const yearMatch = raw.match(/\b(19|20)\d{2}\b/);
      return {
        title: raw.replace(/\b(19|20)\d{2}\b/, "").trim() || raw,
        year: yearMatch?.[0] || "",
        description: "",
      };
    })
    .filter((item) => item.title || item.year || item.description);
}
