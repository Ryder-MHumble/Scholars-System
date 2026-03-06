import type {
  PublicationRecord,
  EducationRecord,
  ManagementRole,
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
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line): PublicationRecord => {
    // Remove citation index [1], [2] …
    const raw = line.replace(/^\[\d+\]\s*/, "");

    // Extract title in quotes — handle ASCII " " and Unicode " "
    const titleMatch = raw.match(/[\u201c""]([^\u201d""]+)[\u201d""]/);
    const yearEndMatch = raw.match(/\((\d{4})\)[,.]?\s*$/);
    const year = yearEndMatch?.[1] ?? "";

    if (titleMatch) {
      const title = titleMatch[1].trim().replace(/,$/, "");
      const qStart = raw.indexOf(titleMatch[0]);
      const qEnd = qStart + titleMatch[0].length;

      // Authors = text before the opening quote (minus trailing comma/space)
      const authors = raw
        .slice(0, qStart)
        .replace(/,\s*$/, "")
        .trim();

      // Venue = text after closing quote, before "(year)"
      let venue = raw.slice(qEnd);
      if (yearEndMatch) {
        const yIdx = venue.lastIndexOf(`(${year})`);
        if (yIdx >= 0) venue = venue.slice(0, yIdx);
      }
      venue = venue.replace(/^[,.\s]+/, "").replace(/[,.\s]+$/, "").trim();

      return {
        title,
        authors: authors || undefined,
        venue: venue || undefined,
        year: year || undefined,
        citation_count: 0,
        is_corresponding: false,
        added_by: "user",
      } as PublicationRecord;
    }

    // Pipe-delimited fallback
    if (line.includes("|")) {
      const p = line.split("|").map((s) => s.trim());
      return {
        title: p[0] ?? "",
        venue: p[1] ?? "",
        year: p[2] ?? "",
        authors: p[3] ?? "",
        citation_count: 0,
        is_corresponding: false,
        added_by: "user",
      } as PublicationRecord;
    }

    // Last resort: whole line is the title
    return {
      title: line,
      year: year || undefined,
      citation_count: 0,
      is_corresponding: false,
      added_by: "user",
    } as PublicationRecord;
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
  const DATE_RANGE_RE =
    /(\d{4}(?:\/\d{2})?)\s*(?:to|[-–至])\s*(\d{4}(?:\/\d{2})?|present|now|至今)/i;

  const DEGREE_PATTERNS = [
    { re: /\bPostdoc(?:toral)?\b|\b博士后\b/i, label: "Postdoc" },
    { re: /\bPh\.?D\.?\b|\bDoctor(?:al|ate)?\b|\b博士\b/i, label: "PhD" },
    { re: /\bM\.?Sc?\.?\b|\bMaster\b|\b硕士\b/i, label: "Master" },
    {
      re: /\bB\.?Sc?\.?\b|\bBachelor\b|\b学士\b|\b本科\b/i,
      label: "Bachelor",
    },
  ];

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
        year = rangeMatch[1].split("/")[0];
        const rawEnd = rangeMatch[2].toLowerCase();
        end_year =
          rawEnd === "present" || rawEnd === "now" || rawEnd === "至今"
            ? "至今"
            : rangeMatch[2].split("/")[0];
        remaining = remaining.replace(rangeMatch[0], " ").trim();
      }

      // Find degree keyword
      let degree = "";
      let degreePos = -1;
      let degreeLen = 0;
      for (const { re, label } of DEGREE_PATTERNS) {
        const m = remaining.match(re);
        if (m && m.index !== undefined) {
          degree = label;
          degreePos = m.index;
          degreeLen = m[0].length;
          break;
        }
      }

      let institution = "";
      let major = "";

      if (degreePos >= 0) {
        // Text before degree keyword → institution
        institution = remaining.slice(0, degreePos).replace(/[,\s]+$/, "").trim();
        // Text after degree keyword: look for "in/of <major>"
        const afterDegree = remaining.slice(degreePos + degreeLen).trim();
        const inMatch = afterDegree.match(/^[\s,]*(?:in|of|and|degree\s+in)\s+(.+)/i);
        if (inMatch) {
          major = inMatch[1].replace(/[,.\s]+$/, "").trim();
        } else if (afterDegree && !institution) {
          // No "in", just use what's there as institution
          institution = afterDegree.replace(/^[,\s]+/, "").trim();
        }
        // If no institution found before degree, check after major
        if (!institution && major) {
          const commaIdx = major.lastIndexOf(",");
          if (commaIdx > 0) {
            institution = major.slice(commaIdx + 1).trim();
            major = major.slice(0, commaIdx).trim();
          }
        }
      } else {
        // No degree keyword found — whole text is institution
        institution = remaining.trim();
      }

      // Fallback year from remaining text
      if (!year) {
        const singleYear = remaining.match(/\b(\d{4})\b/);
        if (singleYear) year = singleYear[1];
      }

      return { degree, institution, major, year, end_year };
    })
    .filter((r) => r.degree || r.institution || r.year);
}

// ─── Management Role Parser ──────────────────────────────────────────────────
//
// Supports:
//   1. "2015/01 to 2020/12  IEEE  Technical Committee Member"
//   2. "2015 - 2020  Visiting Professor, Bonn University"
//   3. Role | Organization | StartYear | EndYear    — pipe fallback
//
//   Multi-line entries are auto-merged (same logic as education).
//
export function parseManagementRolesFromText(text: string): ManagementRole[] {
  const DATE_RANGE_RE =
    /(\d{4}(?:\/\d{2})?)\s*(?:to|[-–至])\s*(\d{4}(?:\/\d{2})?|present|now|至今)/i;

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

  return chunks
    .map((chunk): ManagementRole => {
      // Pipe fallback
      if (chunk.includes("|")) {
        const p = chunk.split("|").map((s) => s.trim());
        return {
          role: p[0] ?? "",
          organization: p[1] ?? "",
          start_year: p[2] ?? "",
          end_year: p[3] ?? "",
        };
      }

      let remaining = chunk;
      let start_year = "";
      let end_year = "";

      const rangeMatch = remaining.match(DATE_RANGE_RE);
      if (rangeMatch) {
        start_year = rangeMatch[1].split("/")[0];
        const rawEnd = rangeMatch[2].toLowerCase();
        end_year =
          rawEnd === "present" || rawEnd === "now" || rawEnd === "至今"
            ? "至今"
            : rangeMatch[2].split("/")[0];
        remaining = remaining.replace(rangeMatch[0], " ").trim();
      }

      // Split remaining by 2+ spaces — common field separator in CV text
      const parts = remaining
        .split(/\s{2,}/)
        .map((s) => s.trim())
        .filter(Boolean);

      let organization = "";
      let role = "";

      if (parts.length >= 2) {
        // Heuristic: first part = organization, rest = role
        organization = parts[0];
        role = parts.slice(1).join(" ");
      } else if (parts.length === 1) {
        const commaIdx = parts[0].indexOf(",");
        if (commaIdx > 0) {
          role = parts[0].slice(0, commaIdx).trim();
          organization = parts[0].slice(commaIdx + 1).trim();
        } else {
          role = parts[0];
        }
      }

      return { role, organization, start_year, end_year };
    })
    .filter((r) => r.role || r.organization || r.start_year);
}
