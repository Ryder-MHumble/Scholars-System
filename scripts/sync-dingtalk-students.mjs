#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const API_BASE = process.env.API_BASE_URL || "http://127.0.0.1:8001";
const SOURCE_DIR = path.join(process.cwd(), ".codex", "student-sync-sources");
const REPORT_DIR = path.join(process.cwd(), ".codex", "student-sync-reports");
const ALLOWED_YEARS = new Set(["2024", "2025", "2026"]);
const SOURCE_TAG = "dingtalk_student_sync_20260827";
const WRITE_DELAY_MS = 25;
const REQUEST_TIMEOUT_MS = 60_000;

function parseArgs(argv) {
  const args = {
    apply: false,
    includeDelete: false,
    papersOnly: false,
    limit: 0,
    reportOnly: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--apply") args.apply = true;
    else if (token === "--include-delete") args.includeDelete = true;
    else if (token === "--papers-only") args.papersOnly = true;
    else if (token === "--report-only") args.reportOnly = true;
    else if (token === "--limit") args.limit = Number(argv[++i] ?? 0) || 0;
    else throw new Error(`Unknown argument: ${token}`);
  }
  return args;
}

function clean(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function compactObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }),
  );
}

function extractYear(...values) {
  for (const value of values) {
    const match = clean(value).match(/(20\d{2})/);
    if (match && ALLOWED_YEARS.has(match[1])) return match[1];
  }
  return "";
}

function normalizeKey(value) {
  return clean(value).toLowerCase().replace(/\s+/g, "");
}

function stripPersonCode(value) {
  return clean(value).replace(/[（(][^）)]*[）)]/g, "").trim();
}

function canonicalStudentKey(student) {
  const no = normalizeKey(student.student_no);
  if (no) return `no:${no}`;
  const year = clean(student.enrollment_year);
  const name = normalizeKey(student.name);
  const university = normalizeKey(student.home_university);
  if (name && year && university) return `nyu:${name}|${year}|${university}`;
  return `ny:${name}|${year}`;
}

function currentMatchKeys(student) {
  const keys = new Set();
  const no = normalizeKey(student.student_no);
  const year = clean(student.enrollment_year);
  const name = normalizeKey(student.name);
  const university = normalizeKey(student.home_university || student.institution);
  if (no) keys.add(`no:${no}`);
  if (name && year && university) keys.add(`nyu:${name}|${year}|${university}`);
  if (name && year) keys.add(`ny:${name}|${year}`);
  return keys;
}

function rowsFromWorkbook(fileName, sheetIndex = 0, headerRow = 0) {
  const wb = XLSX.readFile(path.join(SOURCE_DIR, fileName));
  const ws = wb.Sheets[wb.SheetNames[sheetIndex]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", blankrows: false });
  const headers = rows[headerRow].map(clean);
  return rows.slice(headerRow + 1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      if (header) item[header] = clean(row[index]);
    });
    return item;
  });
}

function load2425Students() {
  return rowsFromWorkbook("24-25-students.xls")
    .map((row) => {
      const year = extractYear(row["学生类别"]);
      if (!year || year === "2026") return null;
      if (/测试/.test(`${row["学生类别"]}${row["姓名"]}`)) return null;
      return {
        student_no: row["学号"],
        name: row["姓名"],
        gender: row["性别"],
        status: row["在院状态"] || "在读",
        degree_type: row["学生类别"],
        training_plan: row["方案类别"],
        discipline_type: row["学科类型"],
        mentor_name: row["学院导师"],
        home_university: row["学籍学校"],
        department: row["学籍学校院系"],
        major: row["学籍学校专业"],
        email: row["学院邮箱"],
        enrollment_year: year,
        source_doc: "24-25级学生学院导师信息",
      };
    })
    .filter(Boolean);
}

function load26Students() {
  const raw = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, "26-students-sheet.json"), "utf8"));
  const rows = raw.displayValues ?? raw.values ?? [];
  const headers = rows[0].map(clean);
  return rows.slice(1)
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        if (header) record[header] = clean(row[index]);
      });
      const year = extractYear(record["信息确认学生类别"]);
      if (year !== "2026") return null;
      return {
        student_no: record["学号"],
        admission_no: record["报名号"],
        name: record["姓名"],
        gender: record["性别"],
        status: "在读",
        degree_type: record["信息确认学生类别"],
        mentor_name: record["博士拟录取导师姓名"],
        home_university: record["博士拟录取高校"] || record["硕士高校名称"] || record["本科高校名称"],
        department: record["博士拟录取院系"],
        major: record["博士拟录取专业"] || record["硕士专业名称"] || record["本科专业名称"],
        email: record["邮箱"],
        phone: record["电话号码"],
        enrollment_year: year,
        source_doc: "26级录取学生信息",
        source_fields: record,
      };
    })
    .filter(Boolean);
}

function dedupeStudents(students) {
  const byKey = new Map();
  for (const student of students) {
    const key = canonicalStudentKey(student);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, student);
      continue;
    }
    byKey.set(key, compactObject({ ...existing, ...student }));
  }
  return [...byKey.values()].sort((a, b) => (
    clean(a.enrollment_year).localeCompare(clean(b.enrollment_year)) ||
    clean(a.home_university).localeCompare(clean(b.home_university), "zh-Hans-CN") ||
    clean(a.name).localeCompare(clean(b.name), "zh-Hans-CN")
  ));
}

function extractNamedStudents(text, targetByName, fallbackYear = "") {
  const hits = [];
  const source = clean(text);
  if (!source) return hits;
  for (const part of source.split(/[;；,，、\n]+/)) {
    const name = clean(part.replace(/[（(].*?[）)]/g, ""));
    if (!name) continue;
    const candidates = targetByName.get(normalizeKey(name)) ?? [];
    for (const candidate of candidates) {
      if (fallbackYear && candidate.enrollment_year !== fallbackYear) continue;
      hits.push(candidate);
    }
  }
  return hits;
}

function loadProjectMembership(targetByName) {
  const wb = XLSX.readFile(path.join(SOURCE_DIR, "project-groups.xlsx"));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", blankrows: false }).slice(2);
  const groups = new Map();
  for (const row of rows) {
    const name = stripPersonCode(row[5]);
    if (!name) continue;
    const students = targetByName.get(normalizeKey(name)) ?? [];
    for (const student of students) {
      const key = canonicalStudentKey(student);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(compactObject({
        project_no: clean(row[1]),
        project_name: clean(row[2]),
        project_type: clean(row[3]),
        project_owner: clean(row[4]),
        direction: clean(row[6]),
        direction_owner: clean(row[7]),
        entry_date: clean(row[9]),
        exit_date: clean(row[10]),
        department: clean(row[16]),
      }));
    }
  }
  return groups;
}

function loadAchievementRows(targetByName) {
  const wb = XLSX.readFile(path.join(SOURCE_DIR, "academic-achievements.xlsx"));
  const results = [];

  const beforeRows = XLSX.utils.sheet_to_json(wb.Sheets["论文至2026年3月"], {
    header: 1,
    defval: "",
    blankrows: false,
  });
  const beforeHeaders = beforeRows[1].map(clean);
  for (const raw of beforeRows.slice(2)) {
    const row = {};
    beforeHeaders.forEach((header, index) => {
      if (header) row[header] = clean(raw[index]);
    });
    if (!row["投稿文章题目（完整题目）"]) continue;
    const studentHits = extractNamedStudents(row["有署名的学院学生作者\n示例:姓名（学号）；姓名（学号）"], targetByName);
    for (const student of studentHits) {
      results.push({
        student_key: canonicalStudentKey(student),
        title: row["投稿文章题目（完整题目）"],
        venue: row["投稿期刊名称"],
        authors: row["作者"] ? row["作者"].split(/[;,；，]/).map(clean).filter(Boolean) : [],
        abstract: row["论文摘要（如有）"],
        source: row["文章链接"],
        publication_date: "",
        source_sheet: "论文至2026年3月",
        project_name: row["项目名称"],
        status: row["论文状态"],
      });
    }
  }

  const recentRows = XLSX.utils.sheet_to_json(wb.Sheets["论文2026年3-6月"], {
    header: 1,
    defval: "",
    blankrows: false,
  });
  const recentHeaders = recentRows[0].map(clean);
  for (const raw of recentRows.slice(1)) {
    const row = {};
    recentHeaders.forEach((header, index) => {
      if (header) row[header] = clean(raw[index]);
    });
    if (!row["文章名称"]) continue;
    const studentHits = extractNamedStudents(row["匹配到的作者"], targetByName);
    for (const student of studentHits) {
      results.push({
        student_key: canonicalStudentKey(student),
        title: row["文章名称"],
        venue: row["期刊/会议名称"],
        authors: row["全部作者信息"] ? row["全部作者信息"].split(/[;；]/).map(clean).filter(Boolean) : [],
        abstract: row["补充信息"],
        source: row["链接"],
        publication_date: row["日期"],
        source_sheet: "论文2026年3-6月",
        project_name: row["匹配项目"],
        status: "",
      });
    }
  }

  const seen = new Set();
  return results.filter((item) => {
    const key = `${item.student_key}|${normalizeKey(item.title)}|${normalizeKey(item.source)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  let text = "";
  try {
    response = await fetch(url, { ...options, signal: controller.signal });
    text = await response.text();
  } finally {
    clearTimeout(timeout);
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${url} failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function fetchAllStudents() {
  const first = await fetchJson(`${API_BASE}/api/students?page=1&page_size=500`);
  const items = [...(first.items ?? [])];
  for (let page = 2; page <= (first.total_pages || 1); page += 1) {
    const next = await fetchJson(`${API_BASE}/api/students?page=${page}&page_size=500`);
    items.push(...(next.items ?? []));
  }
  return items;
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPaperPayload(row) {
  return compactObject({
    title: row.title,
    venue: row.venue,
    authors: row.authors,
    abstract: row.abstract,
    source: row.source,
    publication_date: row.publication_date,
    affiliations: [row.project_name, row.status, row.source_sheet].filter(Boolean),
  });
}

function buildMinimalPaperPayload(row) {
  return compactObject({
    title: row.title,
  });
}

function buildTargetIndexes(targetStudents) {
  const byKey = new Map();
  const byName = new Map();
  for (const student of targetStudents) {
    const key = canonicalStudentKey(student);
    byKey.set(key, student);
    const nameKey = normalizeKey(student.name);
    if (!byName.has(nameKey)) byName.set(nameKey, []);
    byName.get(nameKey).push(student);
  }
  return { byKey, byName };
}

function buildCurrentIndex(currentStudents) {
  const index = new Map();
  const byNameUniversity = new Map();
  const byName = new Map();
  for (const student of currentStudents) {
    for (const key of currentMatchKeys(student)) {
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(student);
    }
    const name = normalizeKey(student.name);
    const university = normalizeKey(student.home_university || student.institution);
    if (name && university) {
      const key = `nu:${name}|${university}`;
      if (!byNameUniversity.has(key)) byNameUniversity.set(key, []);
      byNameUniversity.get(key).push(student);
    }
    if (name) {
      const key = `n:${name}`;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(student);
    }
  }
  return { byStrict: index, byNameUniversity, byName };
}

function buildStudentPayload(student, projectsByKey) {
  const projects = projectsByKey.get(canonicalStudentKey(student)) ?? [];
  void projects;
  return compactObject({
    student_no: student.student_no,
    name: student.name,
    home_university: student.home_university,
    institution: student.home_university,
    major: student.major,
    degree_type: student.degree_type,
    enrollment_year: student.enrollment_year,
    status: student.status === "在院" ? "在读" : student.status,
    email: student.email,
    phone: student.phone,
    mentor_name: student.mentor_name || "待匹配导师",
    added_by: SOURCE_TAG,
    updated_by: SOURCE_TAG,
  });
}

function diffPayload(current, payload) {
  const patch = {};
  for (const [key, nextValue] of Object.entries(payload)) {
    if (key === "added_by" || key === "updated_by") continue;
    const currentValue = clean(current[key]);
    const normalizedNext = clean(nextValue);
    if (currentValue !== normalizedNext) patch[key] = nextValue;
  }
  return patch;
}

function planSync(targetStudents, currentStudents, projectsByKey) {
  const currentIndex = buildCurrentIndex(currentStudents);
  const matchedCurrentIds = new Set();
  const creates = [];
  const patches = [];
  const duplicates = [];

  for (const target of targetStudents) {
    const keys = [
      canonicalStudentKey(target),
      ...currentMatchKeys(target),
    ];
    const matches = [];
    for (const key of keys) {
      for (const item of currentIndex.byStrict.get(key) ?? []) {
        if (!matches.some((m) => m.id === item.id)) matches.push(item);
      }
      if (matches.length) break;
    }
    if (!matches.length) {
      const name = normalizeKey(target.name);
      const university = normalizeKey(target.home_university);
      const looseByUniversity = currentIndex.byNameUniversity.get(`nu:${name}|${university}`) ?? [];
      if (looseByUniversity.length === 1) matches.push(looseByUniversity[0]);
    }
    if (!matches.length) {
      const looseByName = currentIndex.byName.get(`n:${normalizeKey(target.name)}`) ?? [];
      if (looseByName.length === 1) matches.push(looseByName[0]);
    }

    const payload = buildStudentPayload(target, projectsByKey);
    if (!matches.length) {
      creates.push(payload);
      continue;
    }
    matches.sort((a, b) => {
      const aSameYear = clean(a.enrollment_year) === clean(target.enrollment_year) ? 0 : 1;
      const bSameYear = clean(b.enrollment_year) === clean(target.enrollment_year) ? 0 : 1;
      return aSameYear - bSameYear;
    });
    const primary = matches[0];
    matchedCurrentIds.add(primary.id);
    if (matches.length > 1) {
      duplicates.push({ target, current_ids: matches.map((item) => item.id) });
    }
    const patch = diffPayload(primary, payload);
    if (Object.keys(patch).length) patches.push({ id: primary.id, name: primary.name, patch });
  }

  const duplicateDeleteIds = new Set(
    duplicates.flatMap((item) => item.current_ids.slice(1)),
  );

  const deletes = currentStudents.filter((student) => (
    !matchedCurrentIds.has(student.id) || duplicateDeleteIds.has(student.id)
  ));

  const notInTargetAllowedYears = currentStudents.filter((student) => (
    ALLOWED_YEARS.has(clean(student.enrollment_year)) && !matchedCurrentIds.has(student.id)
  ));

  return { creates, patches, deletes, duplicates, notInTargetAllowedYears };
}

async function applyStudentPlan(plan, limit) {
  const applied = { created: 0, patched: 0, deleted: 0, paper_created: 0, paper_updated: 0, failures: [] };
  const limitedCreates = limit ? plan.creates.slice(0, limit) : plan.creates;
  const limitedPatches = limit ? plan.patches.slice(0, limit) : plan.patches;
  const limitedDeletes = limit ? plan.deletes.slice(0, limit) : plan.deletes;

  for (let index = 0; index < limitedCreates.length; index += 1) {
    const payload = limitedCreates[index];
    console.error(`[create] ${index + 1}/${limitedCreates.length} ${payload.name}`);
    try {
      await fetchJson(`${API_BASE}/api/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      applied.created += 1;
    } catch (error) {
      applied.failures.push({ op: "create", name: payload.name, error: error.message });
    }
    await delay(WRITE_DELAY_MS);
  }

  for (let index = 0; index < limitedPatches.length; index += 1) {
    const item = limitedPatches[index];
    if (index % 25 === 0) console.error(`[patch] ${index + 1}/${limitedPatches.length}`);
    try {
      await fetchJson(`${API_BASE}/api/students/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.patch),
      });
      applied.patched += 1;
    } catch (error) {
      applied.failures.push({ op: "patch", id: item.id, name: item.name, error: error.message });
    }
    await delay(WRITE_DELAY_MS);
  }

  for (let index = 0; index < limitedDeletes.length; index += 1) {
    const item = limitedDeletes[index];
    if (index % 10 === 0) console.error(`[delete] ${index + 1}/${limitedDeletes.length}`);
    try {
      await fetchJson(`${API_BASE}/api/students/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      applied.deleted += 1;
    } catch (error) {
      applied.failures.push({ op: "delete", id: item.id, name: item.name, error: error.message });
    }
    await delay(WRITE_DELAY_MS);
  }

  return applied;
}

async function upsertPapers(currentStudents, targetStudents, achievementRows, limit = 0) {
  const byKey = new Map();
  for (const current of currentStudents) {
    for (const key of currentMatchKeys(current)) byKey.set(key, current);
  }

  const targetByCanonical = new Map(targetStudents.map((item) => [canonicalStudentKey(item), item]));
  const tasks = [];
  for (const row of achievementRows) {
    const target = targetByCanonical.get(row.student_key);
    if (!target) continue;
    const current = byKey.get(canonicalStudentKey(target)) ?? [...currentStudents].find((item) => (
      normalizeKey(item.name) === normalizeKey(target.name) &&
      clean(item.enrollment_year) === clean(target.enrollment_year)
    ));
    if (!current) continue;
    tasks.push({ current, row });
  }

  const selected = limit ? tasks.slice(0, limit) : tasks;
  const result = {
    paper_created: 0,
    paper_updated: 0,
    paper_existing_update_skipped: 0,
    paper_created_minimal: 0,
    failures: [],
    attempted: selected.length,
  };
  for (let index = 0; index < selected.length; index += 1) {
    const { current, row } = selected[index];
    if (index % 10 === 0) console.error(`[paper] ${index + 1}/${selected.length}`);
    try {
      const existing = await fetchJson(`${API_BASE}/api/students/${encodeURIComponent(current.id)}/papers`);
      const papers = Array.isArray(existing) ? existing : existing.items ?? [];
      const found = papers.find((paper) => normalizeKey(paper.title) === normalizeKey(row.title));
      const payload = buildPaperPayload(row);
      const minimalPayload = buildMinimalPaperPayload(row);
      if (found?.paper_uid) {
        try {
          await fetchJson(`${API_BASE}/api/students/${encodeURIComponent(current.id)}/papers/${encodeURIComponent(found.paper_uid)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          result.paper_updated += 1;
        } catch (error) {
          result.paper_existing_update_skipped += 1;
          result.failures.push({
            op: "paper_update",
            student: current.name,
            title: row.title,
            error: error.message,
          });
        }
      } else {
        try {
          await fetchJson(`${API_BASE}/api/students/${encodeURIComponent(current.id)}/papers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          result.paper_created += 1;
        } catch (error) {
          try {
            await fetchJson(`${API_BASE}/api/students/${encodeURIComponent(current.id)}/papers`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(minimalPayload),
            });
            result.paper_created_minimal += 1;
          } catch (minimalError) {
            result.failures.push({
              op: "paper_create",
              student: current.name,
              title: row.title,
              error: `${error.message}; fallback: ${minimalError.message}`,
            });
          }
        }
      }
    } catch (error) {
      result.failures.push({ op: "paper", student: current.name, title: row.title, error: error.message });
    }
    await delay(WRITE_DELAY_MS);
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const targetStudents = dedupeStudents([...load2425Students(), ...load26Students()]);
  const { byName } = buildTargetIndexes(targetStudents);
  const projectsByKey = loadProjectMembership(byName);
  const achievements = loadAchievementRows(byName);
  const currentStudents = await fetchAllStudents();
  const plan = planSync(targetStudents, currentStudents, projectsByKey);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const report = {
    generated_at: new Date().toISOString(),
    api_base: API_BASE,
    dry_run: !args.apply,
    target_counts: {
      students: targetStudents.length,
      by_year: Object.fromEntries(["2024", "2025", "2026"].map((year) => [
        year,
        targetStudents.filter((item) => item.enrollment_year === year).length,
      ])),
      students_with_project_groups: [...projectsByKey.keys()].length,
      achievement_links: achievements.length,
    },
    current_counts: {
      students: currentStudents.length,
      by_year: currentStudents.reduce((acc, item) => {
        const year = clean(item.enrollment_year) || "(empty)";
        acc[year] = (acc[year] ?? 0) + 1;
        return acc;
      }, {}),
    },
    plan_counts: {
      creates: plan.creates.length,
      patches: plan.patches.length,
      deletes: args.includeDelete ? plan.deletes.length : 0,
      delete_candidates_total: plan.deletes.length,
      duplicates: plan.duplicates.length,
      allowed_year_current_not_in_target: plan.notInTargetAllowedYears.length,
    },
    samples: {
      creates: plan.creates.slice(0, 10),
      patches: plan.patches.slice(0, 10),
      deletes: plan.deletes.slice(0, 20),
      allowed_year_current_not_in_target: plan.notInTargetAllowedYears.slice(0, 20),
      achievements: achievements.slice(0, 10),
      duplicates: plan.duplicates.slice(0, 10),
    },
  };

  fs.writeFileSync(path.join(REPORT_DIR, `${timestamp}-report.json`), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(REPORT_DIR, `${timestamp}-current-students-backup.json`), JSON.stringify(currentStudents, null, 2));
  fs.writeFileSync(path.join(REPORT_DIR, `${timestamp}-target-students.json`), JSON.stringify(targetStudents, null, 2));
  fs.writeFileSync(path.join(REPORT_DIR, `${timestamp}-achievements.json`), JSON.stringify(achievements, null, 2));

  if (!args.apply || args.reportOnly) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const effectivePlan = args.includeDelete ? plan : { ...plan, deletes: [] };
  const studentApply = args.papersOnly
    ? { created: 0, patched: 0, deleted: 0, paper_created: 0, paper_updated: 0, failures: [] }
    : await applyStudentPlan(effectivePlan, args.limit);
  const refreshedStudents = await fetchAllStudents();
  const paperApply = await upsertPapers(refreshedStudents, targetStudents, achievements, args.limit);
  const finalStudents = await fetchAllStudents();

  const applyReport = {
    ...report,
    dry_run: false,
    applied: {
      ...studentApply,
      ...paperApply,
      failures: [...studentApply.failures, ...paperApply.failures],
    },
    final_counts: {
      students: finalStudents.length,
      by_year: finalStudents.reduce((acc, item) => {
        const year = clean(item.enrollment_year) || "(empty)";
        acc[year] = (acc[year] ?? 0) + 1;
        return acc;
      }, {}),
    },
  };
  fs.writeFileSync(path.join(REPORT_DIR, `${timestamp}-apply-report.json`), JSON.stringify(applyReport, null, 2));
  console.log(JSON.stringify(applyReport, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
