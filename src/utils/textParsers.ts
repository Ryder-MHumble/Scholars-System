import type {
  PublicationRecord,
  EducationRecord,
  PatentRecord,
  AwardRecord,
} from "@/services/scholarApi";

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
  }): PublicationRecord => ({
    title: data.title?.trim() || "",
    authors: data.authors?.trim() || undefined,
    venue: data.venue?.trim() || undefined,
    year: data.year?.trim() || undefined,
    citation_count: 0,
    is_corresponding: false,
    added_by: "user",
  });

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line): PublicationRecord => {
    // Remove citation index [1], [2] / 1. / •
    const raw = line
      .replace(/^\[\d+\]\s*/, "")
      .replace(/^\d+[.)]\s+/, "")
      .replace(/^[•·]\s*/, "");

    // Extract title in quotes — handle ASCII " " and Unicode " "
    const titleMatch = raw.match(/[\u201c""]([^\u201d""]+)[\u201d""]/);
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
    if (raw.includes("|")) {
      const p = raw.split("|").map((s) => s.trim());
      return buildPublication({
        title: p[0] ?? "",
        venue: p[1] ?? "",
        year: p[2] ?? "",
        authors: p[3] ?? "",
      });
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
//   1. "2006/11 to 2009/10  Bonn University  PhD in Mathematical Physics"
//   2. "2006-2009  MIT  PhD, Computer Science"
//   3. "PhD in Computer Science, MIT, 2015-2020"
//   4. Degree | Institution | Major | StartYear | EndYear   — pipe fallback
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
    { re: /\bPostdoc(?:toral)?\b|\b博士后\b/i, label: "博士后" },
    { re: /\bPh\.?D\.?\b|\bDoctor(?:al|ate)?\b|\b博士\b/i, label: "博士" },
    { re: /\bM\.?Sc?\.?\b|\bMaster\b|\b硕士\b/i, label: "硕士" },
    { re: /\bB\.?Sc?\.?\b|\bBachelor\b|\b学士\b|\b本科\b/i, label: "学士" },
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

  // ── Group lines into entries ──────────────────────────────────────────────
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let cur = "";
  for (const line of lines) {
    const beginsNewEntry = /^\d{4}/.test(line) || line.includes("|");
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
      // Pipe fallback
      if (chunk.includes("|")) {
        const p = chunk.split("|").map((s) => s.trim());
        return {
          degree: p[0] ?? "",
          institution: p[1] ?? "",
          major: p[2] ?? "",
          year: p[3] ?? "",
          end_year: p[4] ?? "",
        };
      }

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
        let parts = [...commaParts];
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

// ─── Management Role Parser ──────────────────────────────────────────────────
//
// Parses each non-empty line as a plain string role entry.
//
export function parseManagementRolesFromText(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
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

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines
    .map((line): PatentRecord => {
      const raw = stripListPrefix(line);

      // Keep legacy pipe format fully compatible.
      if (raw.includes("|")) {
        const p = raw.split("|").map((s) => s.trim());
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

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines
    .map((line): AwardRecord => {
      const raw = stripListPrefix(line);

      // Keep legacy pipe format fully compatible.
      if (raw.includes("|")) {
        const p = raw.split("|").map((s) => s.trim());
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
