#!/usr/bin/env node

import fs from "node:fs/promises";
import process from "node:process";
import XLSX from "xlsx";

const workbookPath = process.argv[2] || ".tmp-two-institutes-achievements.xlsx";
const apply = process.argv.includes("--apply");
const apiBase = (process.env.SCHOLARS_API_BASE_URL || "http://127.0.0.1:8001").replace(/\/$/, "");
const twoInstitutesTag = "两院成果";
const sourceType = "两院论文表";
const addedBy = "two_institutes_workbook_2026";

function text(value) {
  return String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function splitNames(value) {
  return text(value)
    .replace(/[（(][^）)]*[）)]/g, "")
    .split(/[，,、;；|]/)
    .map(text)
    .filter(Boolean);
}

function firstUrl(value) {
  return text(value).split(/\s+/).find((item) => /^https?:\/\//i.test(item)) || "";
}

function yearFrom(value, fallback = "") {
  const match = text(value).match(/(?:19|20)\d{2}/);
  return match?.[0] || fallback;
}

async function getScholars(subcategory) {
  const url = new URL(`${apiBase}/api/scholars`);
  url.searchParams.set("page", "1");
  url.searchParams.set("page_size", "200");
  url.searchParams.set("project_subcategory", subcategory);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`读取${subcategory}失败: HTTP ${response.status}`);
  return (await response.json()).items || [];
}

function rowsFromSheet(workbook, sheetName, headerRow = 0) {
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
  const headers = rows[headerRow] || [];
  return rows.slice(headerRow + 1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

function publicationKey(publication) {
  return text(publication.url || publication.doi || publication.title).toLowerCase();
}

function makePublication({ title, venue, authors, url, year, fallbackYear, project, abstract, sheet, academicDivision, confidence, matchMethod }) {
  return {
    title: text(title),
    venue: text(venue),
    year: yearFrom(year, fallbackYear),
    authors: text(authors),
    url: firstUrl(url),
    abstract: text(abstract),
    project_group_name: text(project),
    source_type: `${sourceType}:${sheet}`,
    achievement_tags: [twoInstitutesTag],
    academic_division: text(academicDivision),
    match_confidence: text(confidence),
    match_method: text(matchMethod),
    source_sheet: sheet,
    added_by: addedBy,
  };
}

async function main() {
  const workbook = XLSX.readFile(workbookPath);
  const targetScholars = [...await getScholars("全职导师"), ...await getScholars("兼职导师")];
  const byName = new Map();
  for (const scholar of targetScholars) {
    if (scholar.name && scholar.name !== "导师姓名" && !byName.has(scholar.name)) byName.set(scholar.name, scholar);
  }

  const assignments = new Map();
  const assign = (scholar, publication) => {
    if (!scholar || !publication.title) return;
    if (!assignments.has(scholar.url_hash)) assignments.set(scholar.url_hash, { scholar, publications: [] });
    assignments.get(scholar.url_hash).publications.push(publication);
  };

  let currentLeader = "";
  let currentProject = "";
  for (const row of rowsFromSheet(workbook, "论文至2026年3月", 1)) {
    currentLeader = text(row["项目负责人"]) || currentLeader;
    currentProject = text(row["项目名称"]) || currentProject;
    for (const name of splitNames(currentLeader)) {
      assign(byName.get(name), makePublication({
        title: row["投稿文章题目（完整题目）"],
        venue: row["投稿期刊名称"],
        authors: row["作者"],
        url: row["文章链接"],
        year: row["论文状态"],
        project: currentProject,
        abstract: row["论文摘要（如有）"],
        sheet: "论文至2026年3月",
      }));
    }
  }

  for (const row of rowsFromSheet(workbook, "论文2026年3-6月")) {
    for (const name of splitNames(row["匹配到的作者"])) {
      assign(byName.get(name), makePublication({
        title: row["文章名称"],
        venue: row["期刊/会议名称"],
        authors: row["全部作者信息"],
        url: row["链接"],
        year: row["日期"],
        fallbackYear: "2026",
        project: row["匹配项目"],
        academicDivision: row["学部"],
        confidence: row["置信度"],
        matchMethod: row["匹配方式"],
        sheet: "论文2026年3-6月",
      }));
    }
  }

  const plan = [];
  for (const { scholar, publications } of assignments.values()) {
    const response = await fetch(`${apiBase}/api/scholars/${encodeURIComponent(scholar.url_hash)}`);
    if (!response.ok) throw new Error(`读取学者 ${scholar.name} 详情失败: HTTP ${response.status}`);
    const detail = await response.json();
    const merged = [...(detail.representative_publications || [])];
    const indexes = new Map(merged.map((publication, index) => [publicationKey(publication), index]).filter(([key]) => key));
    for (const publication of publications) {
      const key = publicationKey(publication);
      if (!key) continue;
      const existingIndex = indexes.get(key);
      if (existingIndex === undefined) {
        indexes.set(key, merged.length);
        merged.push(publication);
      } else {
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...publication,
          achievement_tags: [...new Set([...(merged[existingIndex].achievement_tags || []), twoInstitutesTag])],
        };
      }
    }
    const beforePublications = detail.representative_publications || [];
    plan.push({ url_hash: scholar.url_hash, name: scholar.name, matched_rows: publications.length, before_count: beforePublications.length, after_count: merged.length, before_publications: beforePublications, publications: merged });
  }

  const reportPath = `.tmp-two-institutes-import-${Date.now()}.json`;
  await fs.writeFile(reportPath, JSON.stringify({ workbookPath, apiBase, apply, generatedAt: new Date().toISOString(), plan }, null, 2));
  console.log(JSON.stringify({ targets: targetScholars.length, matched_scholars: plan.length, matched_rows: plan.reduce((sum, item) => sum + item.matched_rows, 0), report: reportPath, apply }, null, 2));
  if (!apply) return;

  for (const item of plan) {
    const response = await fetch(`${apiBase}/api/scholars/${encodeURIComponent(item.url_hash)}/achievements`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ representative_publications: item.publications, updated_by: addedBy }),
    });
    if (!response.ok) throw new Error(`写入 ${item.name} 失败: HTTP ${response.status}`);
    console.log(`写入成功: ${item.name} (${item.before_count} -> ${item.after_count})`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
