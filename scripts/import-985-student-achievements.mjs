#!/usr/bin/env node

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const SOURCE_TAG = "mainland_student_top_papers_competitions_import";
const DEFAULT_API_BASE = "http://127.0.0.1:8001";
const DEFAULT_DATA_DIR = "985学生清单_2026-04-30";

function parseArgs(argv) {
  const args = {
    apiBase: DEFAULT_API_BASE,
    dataDir: DEFAULT_DATA_DIR,
    apply: false,
    createMissing: false,
    selfTest: false,
    verifyTargets: false,
    limit: 0,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") args.apply = true;
    else if (arg === "--create-missing") args.createMissing = true;
    else if (arg === "--self-test") args.selfTest = true;
    else if (arg === "--verify-targets") args.verifyTargets = true;
    else if (arg === "--api-base") args.apiBase = argv[++i] ?? args.apiBase;
    else if (arg === "--data-dir") args.dataDir = argv[++i] ?? args.dataDir;
    else if (arg === "--limit") args.limit = Number(argv[++i] ?? 0) || 0;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function nameCandidates(name) {
  const raw = cleanText(name);
  const candidates = new Set([raw]);
  for (const match of raw.matchAll(/\(([^)]+)\)|（([^）]+)）/g)) {
    const inside = cleanText(match[1] || match[2]);
    if (inside) candidates.add(inside);
  }
  const withoutParen = cleanText(raw.replace(/\([^)]*\)|（[^）]*）/g, ""));
  if (withoutParen) candidates.add(withoutParen);
  return [...candidates].filter(Boolean);
}

function extractYear(...values) {
  for (const value of values) {
    const text = cleanText(value);
    const fullYear = text.match(/\b(20\d{2}|19\d{2})\b/);
    if (fullYear) return fullYear[1];
    const arxivYear = text.match(/arxiv\.org\/abs\/(\d{2})\d{2}\./i);
    if (arxivYear) return `20${arxivYear[1]}`;
  }
  return "";
}

function stripUrl(text) {
  return cleanText(text)
    .replace(/[（(]\s*https?:\/\/[^）)]+[）)]\s*$/i, "")
    .trim();
}

function extractUrl(text) {
  const match = cleanText(text).match(/https?:\/\/[^）)\s]+/i);
  return match ? match[0].replace(/&amp;/g, "&") : "";
}

function splitVenueLabel(label) {
  const clean = cleanText(label);
  const year = extractYear(clean);
  const venue = year ? clean.replace(year, "").trim() : clean;
  return { venue, year };
}

function parsePublicationLine(line, scholarName) {
  const match = cleanText(line).match(/^【([^】]+)】(.+)$/);
  if (!match) return null;
  const label = cleanText(match[1]);
  const body = cleanText(match[2]);
  const url = extractUrl(body);
  const bodyWithoutUrl = stripUrl(body);
  const { venue: labelVenue, year: labelYear } = splitVenueLabel(label);

  let title = bodyWithoutUrl;
  let venue = labelVenue;
  let year = labelYear;
  const bracketAt = bodyWithoutUrl.lastIndexOf("[");
  if (bracketAt > 0 && !bodyWithoutUrl.slice(bracketAt).includes("]")) {
    title = cleanText(bodyWithoutUrl.slice(0, bracketAt));
    const bracketVenue = cleanText(bodyWithoutUrl.slice(bracketAt + 1));
    if (bracketVenue) {
      venue =
        labelVenue === "顶刊/顶会" || /^arxiv$/i.test(labelVenue)
          ? bracketVenue
          : labelVenue || bracketVenue;
      year = year || extractYear(bracketVenue);
    }
  }

  if (!year) year = extractYear(url, bodyWithoutUrl, label);
  if (!venue && /arxiv/i.test(label)) venue = "arXiv";
  if (!title) return null;
  if (/标题待核实|原数据残缺/.test(title)) return null;

  return {
    title,
    venue,
    year,
    authors: scholarName,
    url,
    doi: "",
    abstract: "",
    publication_date: "",
    project_group_name: "",
    source_type: "",
    citation_count: 0,
    is_corresponding: false,
    added_by: SOURCE_TAG,
  };
}

function awardGrantor(title) {
  if (/ICPC/i.test(title)) return "ICPC";
  if (/\bISC\b|ISC Student Cluster/i.test(title)) return "ISC";
  if (/\bSC\b|Student Cluster/i.test(title)) return "SC";
  return "";
}

function parseAwardLine(line, university) {
  const match = cleanText(line).match(/^【([^】]+)】(.+)$/);
  if (!match) return null;
  const level = cleanText(match[1]);
  const body = cleanText(match[2]);
  const url = extractUrl(body);
  const title = stripUrl(body);
  if (!title) return null;
  const year = extractYear(title, body);
  const source = url ? `；来源：${url}` : "";
  return {
    title,
    year,
    level,
    grantor: awardGrantor(title),
    description: `${university}在读期间，于 ${title} 获 ${level}${source}`,
    added_by: SOURCE_TAG,
  };
}

function parseRecommendation(text, scholarName, university) {
  const publications = [];
  const awards = [];
  let section = "";
  for (const rawLine of String(text ?? "").split(/\r?\n/)) {
    const line = cleanText(rawLine);
    if (!line) continue;
    if (/^论文[:：]/.test(line)) {
      section = "publication";
      continue;
    }
    if (/^竞赛[:：]/.test(line)) {
      section = "award";
      continue;
    }
    if (section === "publication") {
      const publication = parsePublicationLine(line, scholarName);
      if (publication) publications.push(publication);
    } else if (section === "award") {
      const award = parseAwardLine(line, university);
      if (award) awards.push(award);
    }
  }
  return {
    publications: dedupeBy(publications, (item) => `${normalizeKey(item.title)}|${normalizeKey(item.url)}`),
    awards: dedupeBy(awards, (item) => `${normalizeKey(item.title)}|${item.year}|${normalizeKey(item.level)}`),
  };
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function readWorkbookRows(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const headerIndex = rows.findIndex((row) => cleanText(row[0]) === "序号" && cleanText(row[1]) === "姓名");
  if (headerIndex < 0) throw new Error(`Header row not found in ${filePath}`);
  const headers = rows[headerIndex].map(cleanText);
  return rows.slice(headerIndex + 1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (header) record[header] = row[index];
    });
    return record;
  });
}

function parseExcelDirectory(dataDir) {
  const records = [];
  const files = fs.readdirSync(dataDir).filter((file) => file.endsWith(".xlsx")).sort();
  for (const file of files) {
    const universityFromFile = file.replace(/\.xlsx$/i, "");
    for (const row of readWorkbookRows(path.join(dataDir, file))) {
      const name = cleanText(row["姓名"]);
      const university = cleanText(row["机构"]) || universityFromFile;
      if (!name || !university) continue;
      const parsed = parseRecommendation(row["推荐理由"], name, university);
      records.push({
        name,
        university,
        publications: parsed.publications,
        awards: parsed.awards,
        email: cleanText(row["邮箱"]),
        profileUrl: cleanText(row["个人主页"]),
        googleScholarUrl: cleanText(row["Google Scholar"]),
        linkedinUrl: cleanText(row["LinkedIn"]),
      });
    }
  }
  return dedupeBy(records, (item) => `${normalizeKey(item.university)}|${normalizeKey(item.name)}`);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    const detail =
      typeof data === "object" && data
        ? JSON.stringify(data.detail ?? data)
        : text;
    throw new Error(`${options.method || "GET"} ${url} failed: ${response.status} ${detail || ""}`.trim());
  }
  return data;
}

async function fetchAllScholars(apiBase) {
  const pageSize = 200;
  const first = await fetchJson(`${apiBase}/api/scholars?page=1&page_size=${pageSize}`);
  const items = [...(first.items ?? [])];
  for (let page = 2; page <= (first.total_pages || 1); page += 1) {
    const next = await fetchJson(`${apiBase}/api/scholars?page=${page}&page_size=${pageSize}`);
    items.push(...(next.items ?? []));
  }
  return items;
}

function buildScholarIndex(scholars) {
  const index = { byName: new Map(), byLink: new Map() };
  for (const scholar of scholars) {
    for (const name of nameCandidates(scholar.name)) {
      index.byName.set(`${normalizeKey(scholar.university)}|${normalizeKey(name)}`, scholar);
    }
    if (scholar.name_en) {
      for (const name of nameCandidates(scholar.name_en)) {
        index.byName.set(`${normalizeKey(scholar.university)}|${normalizeKey(name)}`, scholar);
      }
    }
    const links = [
      scholar.profile_url,
      scholar.google_scholar_url,
      scholar.linkedin_url,
      scholar.profile_links?.homepage,
      scholar.profile_links?.google_scholar,
      scholar.profile_links?.linkedin,
    ];
    for (const link of links) {
      const key = normalizeLink(link);
      if (key) index.byLink.set(key, scholar);
    }
  }
  return index;
}

function normalizeLink(value) {
  return cleanText(value)
    .replace(/\/$/, "")
    .replace(/([?&])hl=[^&]+&?/i, "$1")
    .replace(/[?&]$/, "")
    .toLowerCase();
}

function findScholar(record, index) {
  for (const name of nameCandidates(record.name)) {
    const scholar = index.byName.get(`${normalizeKey(record.university)}|${normalizeKey(name)}`);
    if (scholar) return scholar;
  }
  for (const link of [record.profileUrl, record.googleScholarUrl, record.linkedinUrl]) {
    const scholar = index.byLink.get(normalizeLink(link));
    if (scholar) return scholar;
  }
  return null;
}

function isSourceItem(item) {
  return cleanText(item?.added_by) === SOURCE_TAG;
}

function mergeAchievements(existing, imported) {
  const preserved = (existing ?? []).filter((item) => !isSourceItem(item));
  return [...preserved, ...imported];
}

function mergeMatchedByScholar(matched) {
  const grouped = new Map();
  for (const item of matched) {
    const hash = item.scholar.url_hash;
    const existing = grouped.get(hash);
    if (!existing) {
      grouped.set(hash, {
        scholar: item.scholar,
        record: {
          ...item.record,
          publications: [...item.record.publications],
          awards: [...item.record.awards],
        },
        sourceRecords: 1,
      });
      continue;
    }
    existing.sourceRecords += 1;
    existing.record.publications = dedupeBy(
      [...existing.record.publications, ...item.record.publications],
      (publication) => `${normalizeKey(publication.title)}|${normalizeKey(publication.url)}`,
    );
    existing.record.awards = dedupeBy(
      [...existing.record.awards, ...item.record.awards],
      (award) => `${normalizeKey(award.title)}|${award.year}|${normalizeKey(award.level)}`,
    );
    for (const field of ["email", "profileUrl", "googleScholarUrl", "linkedinUrl"]) {
      if (!existing.record[field] && item.record[field]) {
        existing.record[field] = item.record[field];
      }
    }
  }
  return [...grouped.values()];
}

function buildBasicPatch(detail, record) {
  const patch = {};
  const currentLinks = detail.profile_links ?? {};
  const nextLinks = {
    homepage: cleanText(currentLinks.homepage),
    lab: cleanText(currentLinks.lab),
    github: cleanText(currentLinks.github),
    linkedin: cleanText(currentLinks.linkedin),
    google_scholar: cleanText(currentLinks.google_scholar),
    orcid: cleanText(currentLinks.orcid),
    dblp: cleanText(currentLinks.dblp),
    other: Array.isArray(currentLinks.other) ? currentLinks.other : [],
  };
  if (record.email && !cleanText(detail.email)) patch.email = record.email;
  if (record.profileUrl && !cleanText(detail.profile_url) && !nextLinks.homepage) {
    patch.profile_url = record.profileUrl;
    nextLinks.homepage = record.profileUrl;
  }
  if (record.googleScholarUrl && !cleanText(detail.google_scholar_url) && !nextLinks.google_scholar) {
    patch.google_scholar_url = record.googleScholarUrl;
    nextLinks.google_scholar = record.googleScholarUrl;
  }
  if (record.linkedinUrl && !nextLinks.linkedin) {
    nextLinks.linkedin = record.linkedinUrl;
  }
  if (Object.keys(patch).length > 0 || nextLinks.linkedin || nextLinks.homepage || nextLinks.google_scholar) {
    patch.profile_links = nextLinks;
  }
  return patch;
}

function hasBasicPatch(patch) {
  return Object.keys(patch).some((key) => {
    if (key !== "profile_links") return true;
    const links = patch.profile_links;
    return Boolean(links.homepage || links.google_scholar || links.linkedin);
  });
}

async function createScholar(apiBase, record) {
  const profileLinks = {
    homepage: record.profileUrl,
    lab: "",
    github: "",
    linkedin: record.linkedinUrl,
    google_scholar: record.googleScholarUrl,
    orcid: "",
    dblp: "",
    other: [],
  };
  return fetchJson(`${apiBase}/api/scholars`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: record.name,
      name_en: record.name,
      university: record.university,
      position: "学生",
      email: record.email,
      profile_url: record.profileUrl,
      google_scholar_url: record.googleScholarUrl,
      profile_links: profileLinks,
      added_by: SOURCE_TAG,
    }),
  });
}

async function applyRecord(apiBase, scholar, record) {
  const detail = await fetchJson(`${apiBase}/api/scholars/${encodeURIComponent(scholar.url_hash)}`);
  const basicPatch = buildBasicPatch(detail, record);
  if (hasBasicPatch(basicPatch)) {
    await fetchJson(`${apiBase}/api/scholars/${encodeURIComponent(scholar.url_hash)}/basic`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(basicPatch),
    });
  }
  const importedPublications = record.publications.map((publication) => ({
    ...publication,
    authors: cleanText(detail.name) || cleanText(scholar.name) || publication.authors,
  }));
  const representativePublications = mergeAchievements(
    detail.representative_publications,
    importedPublications,
  );
  const awards = mergeAchievements(detail.awards, record.awards);
  await fetchJson(`${apiBase}/api/scholars/${encodeURIComponent(scholar.url_hash)}/achievements`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      representative_publications: representativePublications,
      awards,
      publications_count: representativePublications.length,
    }),
  });
}

async function mapConcurrent(items, concurrency, worker) {
  const results = [];
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  });
  await Promise.all(runners);
  return results;
}

async function verifyMatchedTargets(apiBase, groupedMatched) {
  let sourcePublications = 0;
  let sourceAwards = 0;
  let dirtyTitleHits = 0;
  const failures = [];
  await mapConcurrent(groupedMatched, 20, async ({ scholar }) => {
    try {
      const detail = await fetchJson(`${apiBase}/api/scholars/${encodeURIComponent(scholar.url_hash)}`);
      for (const publication of detail.representative_publications ?? []) {
        if (publication.added_by !== SOURCE_TAG) continue;
        sourcePublications += 1;
        if (/^\d{4}\]$|标题待核实|原数据残缺/.test(publication.title || "")) {
          dirtyTitleHits += 1;
        }
      }
      for (const award of detail.awards ?? []) {
        if (award.added_by === SOURCE_TAG) sourceAwards += 1;
      }
    } catch (error) {
      failures.push(`${scholar.name} ${scholar.university}: ${error.message}`);
    }
  });
  return {
    target_scholars: groupedMatched.length,
    source_publications: sourcePublications,
    source_awards: sourceAwards,
    dirty_title_hits: dirtyTitleHits,
    failures: failures.slice(0, 10),
    failure_count: failures.length,
  };
}

function assertSelfTests(records) {
  const anyi = records.find((item) => item.name === "Anyi Xu" && item.university === "北京大学");
  if (!anyi) throw new Error("Self-test failed: Anyi Xu source row not found");
  if (anyi.publications[0]?.title !== "AutoSOTA: An End-to-End Automated Research System for State-of-the-Art AI Model Discovery") {
    throw new Error(`Self-test failed: Anyi Xu title parsed as ${anyi.publications[0]?.title}`);
  }
  if (anyi.publications[0]?.url !== "https://arxiv.org/abs/2604.05550") {
    throw new Error(`Self-test failed: Anyi Xu URL parsed as ${anyi.publications[0]?.url}`);
  }
  if (anyi.awards[0]?.title !== "ICPC 2024 World Finals" || anyi.awards[0]?.level !== "金奖") {
    throw new Error("Self-test failed: Anyi Xu ICPC award parsed incorrectly");
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const records = parseExcelDirectory(args.dataDir);
  assertSelfTests(records);
  if (args.selfTest) {
    console.log(JSON.stringify({ ok: true, records: records.length }, null, 2));
    return;
  }

  const scholars = await fetchAllScholars(args.apiBase);
  const index = buildScholarIndex(scholars);
  const matched = [];
  const missing = [];
  for (const record of records) {
    const scholar = findScholar(record, index);
    if (scholar) matched.push({ record, scholar });
    else missing.push(record);
  }

  const totals = {
    source_records: records.length,
    matched: matched.length,
    missing: missing.length,
    source_publications: records.reduce((sum, item) => sum + item.publications.length, 0),
    source_awards: records.reduce((sum, item) => sum + item.awards.length, 0),
    target_scholars: mergeMatchedByScholar(matched).length,
    target_publications_after_merge: mergeMatchedByScholar(matched).reduce(
      (sum, item) => sum + item.record.publications.length,
      0,
    ),
    target_awards_after_merge: mergeMatchedByScholar(matched).reduce(
      (sum, item) => sum + item.record.awards.length,
      0,
    ),
    mode: args.apply ? "apply" : "dry-run",
    create_missing: args.createMissing,
  };
  console.log(JSON.stringify(totals, null, 2));
  if (args.verifyTargets) {
    console.log(JSON.stringify(await verifyMatchedTargets(args.apiBase, mergeMatchedByScholar(matched)), null, 2));
    return;
  }
  if (missing.length > 0) {
    console.log("Missing sample:");
    for (const item of missing.slice(0, 20)) {
      console.log(`- ${item.university} | ${item.name} | pubs=${item.publications.length} awards=${item.awards.length}`);
    }
  }
  if (!args.apply) return;

  let updated = 0;
  let created = 0;
  let failed = 0;
  const groupedMatched = mergeMatchedByScholar(matched);
  const toApply = args.limit > 0 ? groupedMatched.slice(0, args.limit) : groupedMatched;
  for (const { record, scholar } of toApply) {
    try {
      await applyRecord(args.apiBase, scholar, record);
      updated += 1;
      if (updated % 50 === 0) console.log(`updated ${updated}/${toApply.length}`);
    } catch (error) {
      failed += 1;
      console.error(`FAILED update ${record.university} ${record.name}: ${error.message}`);
    }
  }

  if (args.createMissing) {
    const toCreate = args.limit > 0 ? missing.slice(0, Math.max(0, args.limit - updated)) : missing;
    for (const record of toCreate) {
      try {
        const createdScholar = await createScholar(args.apiBase, record);
        await applyRecord(args.apiBase, createdScholar, record);
        created += 1;
        if (created % 20 === 0) console.log(`created ${created}/${toCreate.length}`);
      } catch (error) {
        failed += 1;
        console.error(`FAILED create ${record.university} ${record.name}: ${error.message}`);
      }
    }
  }

  console.log(JSON.stringify({ updated, created, failed }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
