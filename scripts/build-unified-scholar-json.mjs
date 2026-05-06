import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const aminerScholarsDir = path.join(rootDir, "data", "aminer", "scholars");
const enrichedScholarsDir = path.join(rootDir, "data", "enriched", "scholars");
const aminerPapersDir = path.join(rootDir, "data", "aminer", "papers");
const outFile = path.join(rootDir, "data", "unified", "scholars-unified.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f));
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function norm(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function hasCjk(value) {
  return /[\u3400-\u9fff]/.test(norm(value));
}

function asIntOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function detectChineseLabel(extra) {
  const items = toArray(extra?.labels?.results);
  const hit = items.find((item) => norm(item?.name).toLowerCase() === "chinese");
  if (!hit) return null;
  if (hit.value === true) return true;
  if (hit.value === false) return false;
  return null;
}

function useChineseName(detail, extra) {
  const nameZh = norm(detail?.name_zh);
  if (!nameZh) return false;
  const chineseLabel = detectChineseLabel(extra);
  if (chineseLabel === true) return true;
  if (chineseLabel === false) return false;
  if (hasCjk(detail?.position_zh) || hasCjk(detail?.edu_zh)) return true;
  if (toArray(detail?.org_zhs).some((v) => hasCjk(v))) return true;
  return false;
}

function splitListItems(values) {
  const result = [];
  for (const value of toArray(values)) {
    for (const part of norm(value).split(/[;；\n]+/g)) {
      const cleaned = norm(part);
      if (cleaned) result.push(cleaned);
    }
  }
  return result;
}

function parseOrgLevelEn(orgEn) {
  const parts = orgEn
    .split(",")
    .map((v) => norm(v))
    .filter(Boolean);
  if (parts.length <= 1) {
    return { level1: parts[0] ?? orgEn, level2: null };
  }
  return {
    level1: parts.at(-1),
    level2: parts.slice(0, -1).join(", "),
  };
}

function parseOrgLevelZh(orgZh) {
  const zh = norm(orgZh);
  if (!zh) return { level1: null, level2: null };

  const commaParts = zh
    .split(/[，,]/g)
    .map((v) => norm(v))
    .filter(Boolean);
  if (commaParts.length > 1) {
    return {
      level1: commaParts.at(-1),
      level2: commaParts.slice(0, -1).join("，"),
    };
  }

  const byUniversity = zh.match(/^(.*?大学)(.+)$/);
  if (byUniversity) {
    return {
      level1: norm(byUniversity[1]),
      level2: norm(byUniversity[2]) || null,
    };
  }

  const byInstitute = zh.match(/^(.*?(?:研究院|研究所|学院|公司))(.*)$/);
  if (byInstitute) {
    return {
      level1: norm(byInstitute[1]),
      level2: norm(byInstitute[2]) || null,
    };
  }

  return { level1: zh, level2: null };
}

function buildOrgsStructured(orgs, orgZhs) {
  const orgEnList = splitListItems(orgs);
  const orgZhList = splitListItems(orgZhs);
  return orgEnList.map((orgEn, idx) => {
    const orgZh = orgZhList[idx] ?? null;
    const en = parseOrgLevelEn(orgEn);
    const zh = parseOrgLevelZh(orgZh);
    return {
      org_en: orgEn,
      org_zh: orgZh,
      level_1_en: en.level1 ?? null,
      level_2_en: en.level2 ?? null,
      level_1_zh: zh.level1 ?? null,
      level_2_zh: zh.level2 ?? null,
    };
  });
}

function parseYearRange(text) {
  const line = norm(text);
  if (!line) return { startYear: null, endYear: null };

  const rangePatterns = [
    /(\d{4})[./年-]\s*\d{0,2}\s*(?:月)?\s*(?:-|--|—|–|~|至|到)\s*(\d{4})[./年-]?\s*\d{0,2}\s*(?:月)?/,
    /(\d{4})\s*年\s*(?:-|--|—|–|~|至|到)\s*(\d{4})\s*年?/,
    /(\d{4})\s*(?:-|--|—|–|~|至|到)\s*(\d{4})/,
  ];
  for (const pattern of rangePatterns) {
    const match = line.match(pattern);
    if (match) {
      return {
        startYear: asIntOrNull(match[1]),
        endYear: asIntOrNull(match[2]),
      };
    }
  }

  const single = line.match(/(\d{4})\s*年/);
  if (single) {
    const y = asIntOrNull(single[1]);
    return { startYear: null, endYear: y };
  }

  return { startYear: null, endYear: null };
}

function parseDegree(text) {
  const line = norm(text);
  if (!line) return null;
  if (/博士|Ph\.?D/i.test(line)) return "博士";
  if (/硕士|Master|M\.Sc|MSc/i.test(line)) return "硕士";
  if (/学士|Bachelor|B\.Sc|BSc/i.test(line)) return "学士";
  return null;
}

function cleanupInstitutionName(value) {
  let inst = norm(value);
  if (!inst) return null;
  inst = inst.replace(/^\d{4}\s*年?/, "");
  inst = inst.replace(/^年+/, "");
  inst = inst.replace(/^(本科毕业于|硕士毕业于|博士毕业于|毕业于|就读于|在|于)/, "");
  inst = inst.replace(/(获|获得|毕业|学位|本科|硕士|博士).*$/, "");
  if (/大学/.test(inst)) {
    const m = inst.match(/^.*?大学/);
    if (m) inst = m[0];
  } else if (/学院/.test(inst)) {
    const m = inst.match(/^.*?学院/);
    if (m) inst = m[0];
  } else if (/(研究院|研究所|实验室)/.test(inst)) {
    const m = inst.match(/^.*?(研究院|研究所|实验室)/);
    if (m) inst = m[0];
  }
  inst = norm(inst);
  return inst || null;
}

function extractInstitution(line) {
  const text = norm(line);
  if (!text) return null;

  const patterns = [
    /([A-Za-z][A-Za-z&.\- ]*(?:University|Institute|College|School|Laboratory|Lab)[A-Za-z&.\- ]*)/i,
    /([\u4e00-\u9fffA-Za-z][^\s，,;；]*(?:大学|学院|研究院|研究所|实验室|中科院|中国科学院)[^\s，,;；]*)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = cleanupInstitutionName(match[1]);
      if (cleaned) return cleaned;
    }
  }

  return null;
}

function extractMajor(line, institution, degree) {
  let text = norm(line);
  if (!text) return null;
  if (institution) text = text.replace(institution, " ");
  if (degree) text = text.replace(new RegExp(degree, "g"), " ");
  text = text.replace(/\d{4}[./年-]?\s*\d{0,2}\s*(?:月)?/g, " ");
  text = text.replace(/\s+/g, " ").trim();

  const hit = text.match(/([^\s，,;；]*(?:专业|工程|科学|技术)[^\s，,;；]*)/);
  if (hit) return norm(hit[1]);
  return null;
}

function parseEduZh(eduZhRaw) {
  const raw = norm(eduZhRaw);
  if (!raw) return [];

  const cleaned = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/\t+/g, " ")
    .replace(/\r/g, "\n");

  const lines = cleaned
    .split(/\n+/g)
    .map((line) => norm(line))
    .filter(Boolean);

  const entries = [];
  for (const line of lines) {
    const degree = parseDegree(line);
    const { startYear, endYear } = parseYearRange(line);
    const lineNoRanges = line
      .replace(
        /(\d{4})[./年-]?\s*\d{0,2}\s*(?:月)?\s*(?:-|--|—|–|~|至|到)\s*(\d{4})[./年-]?\s*\d{0,2}\s*(?:月)?/g,
        " ",
      )
      .replace(/\d{4}\s*年/g, " ")
      .replace(/\d{4}/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const segments = lineNoRanges
      .split(/[，,]/g)
      .map((v) => norm(v))
      .filter(Boolean);

    let institution = extractInstitution(line);
    if (!institution && segments.length > 0) {
      institution = cleanupInstitutionName(segments[0]);
    }
    let major = extractMajor(line, institution, degree);
    if (!major) {
      for (const seg of segments) {
        if (institution && seg.includes(institution)) continue;
        if (degree && seg.includes(degree)) continue;
        if (/(专业|工程|科学|技术|计算机|自动化|信息|数学|物理|化学|生物)/.test(seg)) {
          major = seg;
          break;
        }
      }
    }

    entries.push({
      raw: line,
      institution,
      degree,
      major,
      start_year: startYear,
      end_year: endYear,
    });
  }

  return entries;
}

function buildScholars() {
  const aminerFiles = listJsonFiles(aminerScholarsDir);
  const enrichedFiles = listJsonFiles(enrichedScholarsDir);

  const byId = new Map();

  for (const file of aminerFiles) {
    const record = readJson(file);
    const id = String(record?.aminer_id || record?.detail?.id || path.basename(file, ".json"));
    byId.set(id, {
      aminer: record,
      enriched: null,
    });
  }

  for (const file of enrichedFiles) {
    const record = readJson(file);
    const id = String(record?.aminer_id || path.basename(file, ".json"));
    const existing = byId.get(id);
    if (existing) {
      existing.enriched = record;
    } else {
      byId.set(id, {
        aminer: null,
        enriched: record,
      });
    }
  }

  const scholars = [];
  for (const [aminerId, merged] of byId.entries()) {
    const base = merged.aminer ?? {};
    const detail = base.detail ?? {};
    const extra = merged.enriched ?? {};
    const indices = extra.indices ?? {};
    const name = useChineseName(detail, extra) ? norm(detail.name_zh) : norm(detail.name);

    scholars.push({
      scholar_id: aminerId,
      aminer_id: aminerId,
      source: extra.source ?? base.source ?? null,
      fetched_at: base.fetched_at ?? null,
      last_updated: extra.last_updated ?? null,

      name: name || null,
      bio: detail.bio ?? null,
      bio_zh: detail.bio_zh ?? null,
      edu: detail.edu ?? null,
      edu_zh_raw: detail.edu_zh ?? null,
      edu_zh: parseEduZh(detail.edu_zh),
      position: detail.position ?? null,
      position_zh: detail.position_zh ?? null,
      orgs: buildOrgsStructured(detail.orgs, detail.org_zhs),
      honor: toArray(detail.honor),

      email: extra.email ?? null,
      phone: extra.phone ?? null,
      homepage: extra.homepage ?? null,
      google_scholar: extra.google_scholar ?? null,
      dblp: extra.dblp ?? null,
      research_tags: toArray(extra.research_tags),

      hindex: Number.isFinite(indices.hindex) ? indices.hindex : null,
      gindex: Number.isFinite(indices.gindex) ? indices.gindex : null,
      citations: Number.isFinite(indices.citations) ? indices.citations : null,
      pubs: Number.isFinite(indices.pubs) ? indices.pubs : null,
      activity: Number.isFinite(indices.activity) ? indices.activity : null,
      diversity: Number.isFinite(indices.diversity) ? indices.diversity : null,
      sociability: Number.isFinite(indices.sociability) ? indices.sociability : null,
      new_star: Number.isFinite(indices.newStar) ? indices.newStar : null,
      rising_star: Number.isFinite(indices.risingStar) ? indices.risingStar : null,

      aminer_stats: extra.aminer_stats ?? null,

      // 按你的要求，头像字段统一留空，不带本地图片存储引用
      avatar: null,
      photo_url: null,
      avatar_aminer: null,
    });
  }

  scholars.sort((a, b) => a.scholar_id.localeCompare(b.scholar_id));
  return scholars;
}

function buildScholarPublications(validScholarIds) {
  const paperFiles = listJsonFiles(aminerPapersDir);
  const scholarPublications = [];
  let skippedNoAuthorId = 0;
  let skippedAuthorNotInScholars = 0;

  for (const file of paperFiles) {
    const paper = readJson(file);
    const detail = paper.detail ?? {};
    const paperId = String(paper?.aminer_id || detail?.id || path.basename(file, ".json"));
    const authors = toArray(detail.authors);
    const authorsStructured = authors.map((a, idx) => ({
      author_id: norm(a?.id) || null,
      author_name: norm(a?.name) || null,
      author_order: idx + 1,
    }));
    const authorsText = authorsStructured.map((a) => a.author_name).filter(Boolean).join(", ");
    const sourceFiles = toArray(paper.sources).map((s) => s?.file).filter(Boolean);

    for (let i = 0; i < authors.length; i += 1) {
      const author = authors[i] ?? {};
      const scholarId = author?.id ? String(author.id) : null;
      if (!scholarId) {
        skippedNoAuthorId += 1;
        continue;
      }
      if (!validScholarIds.has(scholarId)) {
        skippedAuthorNotInScholars += 1;
        continue;
      }

      scholarPublications.push({
        scholar_id: scholarId,
        publication_id: paperId,
        title: detail.title ?? null,
        abstract: detail.abstract ?? null,
        venue: detail.venue ?? null,
        year: asIntOrNull(detail.year),
        volume: detail.volume ?? null,
        issue: detail.issue ?? null,
        doi: detail.doi ?? null,
        issn: detail.issn ?? null,
        keywords: toArray(detail.keywords),
        author_order: i + 1,
        author_id: scholarId,
        author_name: author?.name ?? null,
        authors: authorsText || null,
        authors_structured: authorsStructured,
        source_type: "aminer",
        source_files: sourceFiles,
        fetched_at: paper.fetched_at ?? null,
      });
    }
  }

  // 去重，主键维度：scholar_id + publication_id
  const dedupMap = new Map();
  for (const row of scholarPublications) {
    const key = `${row.scholar_id}::${row.publication_id}`;
    const existing = dedupMap.get(key);
    if (!existing || row.author_order < existing.author_order) {
      dedupMap.set(key, row);
    }
  }

  const deduped = [...dedupMap.values()].sort((a, b) => {
    const byScholar = a.scholar_id.localeCompare(b.scholar_id);
    if (byScholar !== 0) return byScholar;
    return a.publication_id.localeCompare(b.publication_id);
  });

  return {
    scholarPublications: deduped,
    stats: {
      paper_files: paperFiles.length,
      relation_rows_before_dedup: scholarPublications.length,
      relation_rows_after_dedup: deduped.length,
      skipped_no_author_id: skippedNoAuthorId,
      skipped_author_not_in_scholars: skippedAuthorNotInScholars,
    },
  };
}

function main() {
  const scholars = buildScholars();
  const validScholarIds = new Set(scholars.map((s) => s.scholar_id));
  const { scholarPublications, stats } = buildScholarPublications(validScholarIds);

  const output = {
    meta: {
      generated_at: new Date().toISOString(),
      source_dirs: {
        aminer_scholars: path.relative(rootDir, aminerScholarsDir),
        enriched_scholars: path.relative(rootDir, enrichedScholarsDir),
        aminer_papers: path.relative(rootDir, aminerPapersDir),
      },
      counts: {
        scholars: scholars.length,
        scholar_publications: scholarPublications.length,
      },
      notes: [
        "avatar/photo_url/avatar_aminer 已统一置空",
        "name_zh 字段已删除；若判定为中国学者且 name_zh 非空，name 使用中文名",
        "labels 字段已删除",
        "orgs 字段已结构化为一二级机构并附带中英信息",
        "edu_zh 已结构化（并保留 edu_zh_raw）",
        "scholar_publications 仅保留可关联到 scholars 的作者记录",
      ],
      publication_extract_stats: stats,
    },
    scholars,
    scholar_publications: scholarPublications,
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Written: ${path.relative(rootDir, outFile)}`);
  console.log(`scholars: ${scholars.length}`);
  console.log(`scholar_publications: ${scholarPublications.length}`);
}

main();
