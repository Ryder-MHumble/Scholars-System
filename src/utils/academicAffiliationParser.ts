export interface AcademicAffiliationRecord {
  role: string;
  organization: string;
  start_year: string;
  end_year: string;
}

export interface AcademicAffiliationInput {
  role?: string;
  organization?: string;
  start_year?: string | number;
  end_year?: string | number;
}

const ORGANIZATION_SUFFIX_RE =
  /(大学|学院|研究院|研究所|实验室|中心|协会|学会|委员会|University|Institute|College|School|Lab|Center|Association|Society)$/i;
const ORGANIZATION_MARKER_RE =
  /(大学|学院|研究院|研究所|实验室|中心|协会|学会|委员会|University|Institute|College|School|Lab|Center|Association|Society)/i;
function stripListPrefix(value: string): string {
  return value
    .replace(/^\s*\[\d+\]\s*/, "")
    .replace(/^\s*\d{1,3}[.)、]\s*/, "")
    .replace(/^[•·]\s*/, "")
    .trim();
}

function extractYearToken(value: string): string {
  const match = value.match(/(?:19|20)\d{2}(?:[./-]\d{1,2})?|至今|present|now/i);
  if (!match) return "";
  return /^(present|now)$/i.test(match[0]) ? "至今" : match[0];
}

function parseLabeledFields(value: string): AcademicAffiliationRecord | null {
  const mapped: Partial<AcademicAffiliationRecord> = {};
  for (const pair of value.split(/[；;]/).map((part) => part.trim()).filter(Boolean)) {
    const match = pair.match(/^([^:：]+)[:：]\s*(.+)$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    const val = match[2].trim();
    if (/^(职务|兼职|岗位|角色|role|position|title)$/.test(key)) mapped.role = val;
    if (/^(机构|兼职机构|单位|组织|organization|institution|org)$/.test(key)) {
      mapped.organization = val;
    }
    if (/^(开始|开始年份|起始|start|start_year)$/.test(key)) mapped.start_year = val;
    if (/^(结束|结束年份|终止|end|end_year)$/.test(key)) mapped.end_year = val;
  }
  if (!mapped.role && !mapped.organization) return null;
  return normalizeRecord(mapped);
}

function normalizeRecord(value: AcademicAffiliationInput): AcademicAffiliationRecord {
  return {
    role: String(value.role ?? "").trim() || "学术兼职",
    organization: String(value.organization ?? "").trim(),
    start_year: String(value.start_year ?? "").trim(),
    end_year: String(value.end_year ?? "").trim(),
  };
}

function parsePlainRecord(value: string): AcademicAffiliationRecord {
  const raw = stripListPrefix(value);
  const fields = raw
    .split(/[|｜\t]|\s{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (fields.length >= 2) {
    const firstIsOrganization = ORGANIZATION_SUFFIX_RE.test(fields[0]);
    return normalizeRecord({
      role: firstIsOrganization ? fields[1] : fields[0],
      organization: firstIsOrganization ? fields[0] : fields[1],
      start_year: fields[2],
      end_year: fields[3],
    });
  }

  const rangeMatch = raw.match(
    /((?:19|20)\d{2}(?:[./-]\d{1,2})?|至今|present|now)\s*(?:-|—|–|~|～|至|到)\s*((?:19|20)\d{2}(?:[./-]\d{1,2})?|至今|present|now)/i,
  );
  const start_year = rangeMatch ? extractYearToken(rangeMatch[1]) : "";
  const end_year = rangeMatch ? extractYearToken(rangeMatch[2]) : "";
  const withoutRange = rangeMatch
    ? raw.replace(rangeMatch[0], "").replace(/[，,；;()（）]+/g, " ").trim()
    : raw;

  const commaParts = withoutRange.split(/[，,、]/).map((part) => part.trim()).filter(Boolean);
  if (commaParts.length === 2 && ORGANIZATION_SUFFIX_RE.test(commaParts[0])) {
    return normalizeRecord({
      organization: commaParts[0],
      role: commaParts[1],
      start_year,
      end_year,
    });
  }

  const orgMatch = withoutRange.match(
    /^(.+?(?:大学|学院|研究院|研究所|实验室|中心|协会|学会|委员会|University|Institute|College|School|Lab|Center|Association|Society))\s*(.+)$/i,
  );
  if (orgMatch) {
    return normalizeRecord({
      organization: orgMatch[1],
      role: orgMatch[2],
      start_year,
      end_year,
    });
  }

  return normalizeRecord({ role: withoutRange || raw, start_year, end_year });
}

function splitCandidates(line: string): string[] {
  const hasLabeledField = /(?:职务|兼职|岗位|角色|机构|单位|组织|开始|结束|role|position|title|organization|institution)\s*[:：]/i.test(line);
  if (hasLabeledField) return [line];

  return line
    .split(/[；;]/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .flatMap((segment) => {
      const commaParts = segment.split(/[，,、]/).map((part) => part.trim()).filter(Boolean);
      if (commaParts.length > 1 && commaParts.every((part) => ORGANIZATION_MARKER_RE.test(part))) {
        return commaParts;
      }
      return [segment];
    });
}

export function parseAcademicAffiliationsFromText(text: string): AcademicAffiliationRecord[] {
  return text
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => splitCandidates(line))
    .map((candidate) => parseLabeledFields(candidate) ?? parsePlainRecord(candidate))
    .filter((record) => record.role || record.organization);
}

function affiliationKey(record: AcademicAffiliationRecord): string {
  return `${record.role.trim().toLocaleLowerCase()}\u0000${record.organization.trim().toLocaleLowerCase()}`;
}

export function mergeAcademicAffiliations(
  existing: AcademicAffiliationInput[],
  incoming: AcademicAffiliationInput[],
): AcademicAffiliationRecord[] {
  const result: AcademicAffiliationRecord[] = [];
  const indexByKey = new Map<string, number>();

  for (const raw of [...existing, ...incoming]) {
    const record = normalizeRecord(raw);
    const key = affiliationKey(record);
    const index = indexByKey.get(key);
    if (index === undefined) {
      indexByKey.set(key, result.length);
      result.push(record);
      continue;
    }
    result[index] = {
      ...result[index],
      organization: result[index].organization || record.organization,
      start_year: result[index].start_year || record.start_year,
      end_year: result[index].end_year || record.end_year,
    };
  }
  return result;
}
