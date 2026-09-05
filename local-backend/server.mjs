import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));
const snapshot = JSON.parse(await readFile(join(rootDir, "data", "snapshot.json"), "utf8"));
const port = Number(process.env.BACKEND_PORT || 8001);
const businessBackendUrl = String(process.env.BUSINESS_BACKEND_URL || "http://127.0.0.1:8002").replace(/\/$/, "");

function sendJson(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function isPortraitProxyPath(pathname) {
  return /^\/api\/portrait-assessments(?:\/[^/]+)?\/?$/.test(pathname) ||
    /^\/api\/subjects\/(?:scholar|student|academic_student)\/[^/]+\/(?:traits|portraits\/latest)\/?$/.test(pathname);
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

async function proxyPortraitRequest(req, res, url) {
  try {
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readRequestBody(req);
    const headers = { accept: req.headers.accept || "application/json" };
    if (req.headers["content-type"]) headers["content-type"] = req.headers["content-type"];
    if (req.headers["idempotency-key"]) headers["idempotency-key"] = req.headers["idempotency-key"];
    const upstream = await fetch(`${businessBackendUrl}${url.pathname}${url.search}`, {
      method: req.method,
      headers,
      body,
    });
    const responseBody = await upstream.arrayBuffer();
    res.writeHead(upstream.status, {
      "content-type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    });
    res.end(Buffer.from(responseBody));
  } catch (error) {
    sendJson(res, 502, { detail: `Portrait backend unavailable: ${error instanceof Error ? error.message : "unknown error"}` });
  }
}

function pageItems(items, url) {
  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
  const pageSize = Math.max(Math.min(Number(url.searchParams.get("page_size") || 20), 200), 1);
  const start = (page - 1) * pageSize;
  return { total: items.length, page, page_size: pageSize, total_pages: Math.max(Math.ceil(items.length / pageSize), 1), items: items.slice(start, start + pageSize) };
}

function matchText(value, query) {
  return !query || String(value || "").toLowerCase().includes(query.toLowerCase());
}

function filterItems(domain, items, url) {
  const query = url.searchParams;
  const keyword = query.get("keyword") || query.get("q") || "";
  return items.filter((item) => {
    if (domain === "institutions") {
      return matchText(item.name, keyword) && ["entity_type", "region", "org_type", "classification", "sub_classification"].every((key) => !query.get(key) || String(item[key] || "") === query.get(key));
    }
    if (domain === "scholars") {
      const searchable = [item.name, item.name_en, item.university, item.department, item.position, item.bio, ...(item.research_areas || [])].join(" ");
      return matchText(searchable, keyword) && (!query.get("region") || (query.get("region") === "国内" ? item.university && /[\u3400-\u9fff]/.test(item.university) : !/[\u3400-\u9fff]/.test(item.university))) && (!query.get("affiliation_type") || query.get("affiliation_type") === "其他" || String(item.university || "").includes(query.get("affiliation_type")));
    }
    if (domain === "students") {
      const searchable = [item.name, item.home_university, item.major, item.mentor_name].join(" ");
      return matchText(searchable, keyword) && (!query.get("enrollment_year") || String(item.enrollment_year) === query.get("enrollment_year")) && (!query.get("grade") || String(item.enrollment_year) === query.get("grade"));
    }
    if (domain === "projects") return matchText([item.title, item.summary, item.category, item.subcategory].join(" "), keyword) && (!query.get("category") || item.category === query.get("category")) && (!query.get("subcategory") || item.subcategory === query.get("subcategory"));
    if (domain === "events") return matchText([item.title, item.abstract, item.category, item.series, item.event_type].join(" "), keyword) && (!query.get("category") || item.category === query.get("category")) && (!query.get("series") || item.series === query.get("series")) && (!query.get("event_type") || item.event_type === query.get("event_type"));
    if (domain === "venues") return matchText([item.name, item.full_name, item.description].join(" "), keyword) && (!query.get("type") || item.type === query.get("type")) && (!query.get("rank") || item.rank === query.get("rank"));
    return true;
  });
}

function institutionTaxonomy(items) {
  const regions = {};
  for (const item of items) {
    const region = item.region || "其他";
    const type = item.org_type || "其他";
    regions[region] ??= { count: 0, org_types: {} };
    regions[region].count += 1;
    regions[region].org_types[type] ??= { count: 0, classifications: {} };
    regions[region].org_types[type].count += 1;
    if (item.classification) {
      const classifications = regions[region].org_types[type].classifications;
      classifications[item.classification] ??= { count: 0 };
      classifications[item.classification].count += 1;
    }
  }
  return { total: items.length, regions };
}

function institutionTree(items) {
  const groups = new Map();
  for (const item of items) {
    const group = item.classification || item.org_type || "其他";
    const category = item.sub_classification || item.category || "未分类";
    if (!groups.has(group)) groups.set(group, new Map());
    const categories = groups.get(group);
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push({ id: item.id, name: item.name, scholar_count: item.scholar_count || 0, departments: item.departments || [] });
  }
  return { total_scholar_count: items.reduce((sum, item) => sum + Number(item.scholar_count || 0), 0), groups: [...groups].map(([group, categories]) => ({ group, scholar_count: [...categories.values()].flat().reduce((sum, item) => sum + item.scholar_count, 0), categories: [...categories].map(([category, institutions]) => ({ category, scholar_count: institutions.reduce((sum, item) => sum + item.scholar_count, 0), institutions })) })) };
}

function scholarStats(items) {
  const countBy = (key) => Object.entries(items.reduce((counts, item) => {
    const value = String(item[key] || "未分类");
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {})).map(([name, count]) => ({ name, count }));
  const departments = {};
  for (const item of items) {
    const university = item.university || "未分类";
    const department = item.department || "未分类";
    const key = `${university}\u0000${department}`;
    departments[key] = (departments[key] || 0) + 1;
  }
  return {
    total: items.length,
    academicians: items.filter((item) => item.is_academician).length,
    potential_recruits: items.filter((item) => item.is_potential_recruit).length,
    advisor_committee: items.filter((item) => item.is_advisor_committee).length,
    adjunct_supervisors: items.filter((item) => item.adjunct_supervisor?.status).length,
    by_university: countBy("university").map(({ name: university, count }) => ({ university, count })),
    by_position: countBy("position").map(({ name: position, count }) => ({ position, count })),
    by_department: Object.entries(departments).map(([key, count]) => {
      const [university, department] = key.split("\u0000");
      return { university, department, count };
    }),
  };
}

function activityStats(items) {
  const group = (key, outputKey) => Object.entries(items.reduce((counts, item) => {
    const value = String(item[key] || "未分类");
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {})).map(([value, count]) => ({ [outputKey]: value, count }));
  return {
    total: items.length,
    by_category: group("category", "category"),
    by_type: group("event_type", "event_type"),
    by_month: group("event_date", "month").map((item) => ({ month: item.month.slice(0, 7), count: item.count })),
  };
}

function taxonomyTree(items, categoryKey, subcategoryKey, thirdKey) {
  const categories = new Map();
  for (const item of items) {
    const category = item[categoryKey] || "未分类";
    const subcategory = item[subcategoryKey] || "未分类";
    const third = thirdKey ? item[thirdKey] || "未分类" : null;
    if (!categories.has(category)) categories.set(category, new Map());
    const children = categories.get(category);
    if (!children.has(subcategory)) children.set(subcategory, new Set());
    if (third) children.get(subcategory).add(third);
  }
  const now = snapshot.meta.generated_at;
  const result = [...categories].map(([category, children], categoryIndex) => ({
    id: `local-l1-${categoryIndex + 1}`,
    level: 1,
    name: category,
    parent_id: null,
    sort_order: categoryIndex,
    created_at: now,
    children: [...children].map(([subcategory, grandchildren], subcategoryIndex) => ({
      id: `local-l2-${categoryIndex + 1}-${subcategoryIndex + 1}`,
      level: 2,
      name: subcategory,
      parent_id: `local-l1-${categoryIndex + 1}`,
      sort_order: subcategoryIndex,
      created_at: now,
      children: [...grandchildren].map((name, thirdIndex) => ({
        id: `local-l3-${categoryIndex + 1}-${subcategoryIndex + 1}-${thirdIndex + 1}`,
        level: 3,
        name,
        parent_id: `local-l2-${categoryIndex + 1}-${subcategoryIndex + 1}`,
        sort_order: thirdIndex,
        created_at: now,
      })),
    })),
  }));
  return {
    total_l1: result.length,
    total_l2: result.reduce((sum, item) => sum + item.children.length, 0),
    total_l3: result.reduce((sum, item) => sum + item.children.reduce((childSum, child) => childSum + child.children.length, 0), 0),
    items: result,
  };
}

function studentOptions(items, url) {
  const year = url.searchParams.get("enrollment_year");
  const filtered = year ? items.filter((item) => String(item.enrollment_year) === year) : items;
  const unique = (key) => [...new Set(filtered.map((item) => String(item[key] || "").trim()).filter(Boolean))].sort();
  return { grades: unique("enrollment_year"), universities: unique("home_university"), mentors: unique("mentor_name") };
}

function detailItem(items, id, key = "id") {
  return items.find((item) => String(item[key]) === decodeURIComponent(id));
}

const server = createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, PUT, POST, OPTIONS", "access-control-allow-headers": "Content-Type, Idempotency-Key" });
    res.end();
    return;
  }
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
  if (isPortraitProxyPath(url.pathname)) return void proxyPortraitRequest(req, res, url);
  if (url.pathname === "/api/health") return sendJson(res, 200, { status: "ok", mode: "local-snapshot", generated_at: snapshot.meta.generated_at });
  const match = url.pathname.match(/^\/api\/(institutions|scholars|students|projects|events|venues)(?:\/(.*))?\/?$/);
  if (!match || req.method !== "GET") return sendJson(res, 404, { detail: "Not Found" });
  const [, domain, suffix] = match;
  const items = snapshot[domain].items;
  if (domain === "institutions" && suffix === "taxonomy") return sendJson(res, 200, institutionTaxonomy(items));
  if (domain === "institutions" && suffix === "scholars/tree") return sendJson(res, 200, institutionTree(items));
  if (domain === "institutions" && suffix === "search") {
    const results = filterItems(domain, items, url).slice(0, Math.max(Number(url.searchParams.get("limit") || 10), 1));
    return sendJson(res, 200, { query: url.searchParams.get("q") || "", total: results.length, results });
  }
  if (domain === "institutions" && suffix === "suggest") {
    const university = url.searchParams.get("university") || "";
    const suggestions = items.filter((item) => matchText(item.name, university)).slice(0, 5);
    return sendJson(res, 200, { university, matched: suggestions.find((item) => item.name === university) || null, suggestions });
  }
  if (domain === "institutions" && suffix?.endsWith("/departments")) {
    const item = detailItem(items, suffix.replace(/\/departments$/, ""));
    return sendJson(res, item ? 200 : 404, { departments: item?.departments || [] });
  }
  if (domain === "institutions" && suffix) {
    const item = detailItem(items, suffix);
    return item ? sendJson(res, 200, { ...item, resident_leaders: [], degree_committee: [], teaching_committee: [], university_leaders: [], notable_scholars: [], key_departments: [], joint_labs: [], training_cooperation: [], academic_cooperation: [], talent_dual_appointment: [], recruitment_events: [], visit_exchanges: [], cooperation_focus: [], sources: [], last_updated: snapshot.meta.generated_at }) : sendJson(res, 404, { detail: "Not Found" });
  }
  if (domain === "scholars" && suffix === "stats") return sendJson(res, 200, scholarStats(items));
  if (domain === "scholars" && suffix?.endsWith("/publications")) {
    const item = detailItem(items, suffix.replace(/\/publications$/, ""), "url_hash");
    return item ? sendJson(res, 200, { items: item.representative_publications || [], total: (item.representative_publications || []).length }) : sendJson(res, 404, { detail: "Not Found" });
  }
  if (domain === "scholars" && suffix?.endsWith("/students")) {
    const item = detailItem(items, suffix.replace(/\/students$/, ""), "url_hash");
    const students = item ? snapshot.students.items.filter((student) => student.scholar_id === item.url_hash) : [];
    return item ? sendJson(res, 200, { total: students.length, items: students }) : sendJson(res, 404, { detail: "Not Found" });
  }
  if (domain === "scholars" && suffix) {
    const item = detailItem(items, suffix, "url_hash");
    return item ? sendJson(res, 200, item) : sendJson(res, 404, { detail: "Not Found" });
  }
  if (domain === "students" && suffix === "options") return sendJson(res, 200, studentOptions(items, url));
  if (domain === "students" && suffix?.endsWith("/papers")) return sendJson(res, 200, { items: [], total: 0 });
  if (domain === "students" && suffix?.endsWith("/publications")) return sendJson(res, 200, { items: [], total: 0 });
  if (domain === "students" && suffix?.endsWith("/publication-workspace")) return sendJson(res, 200, { counts: { confirmed: 0, pending_review: 0, rejected: 0 }, confirmed_publications: [], pending_candidates: [], rejected_candidates: [] });
  if (domain === "students" && suffix) {
    const item = detailItem(items, suffix);
    return item ? sendJson(res, 200, item) : sendJson(res, 404, { detail: "Not Found" });
  }
  if (domain === "projects" && suffix === "taxonomy") return sendJson(res, 200, taxonomyTree(items, "category", "subcategory"));
  if (domain === "projects" && suffix === "stats") return sendJson(res, 200, { total: items.length, by_category: [] });
  if (domain === "projects" && suffix) {
    const item = detailItem(items, suffix);
    return item ? sendJson(res, 200, item) : sendJson(res, 404, { detail: "Not Found" });
  }
  if (domain === "events" && suffix === "stats") return sendJson(res, 200, activityStats(items));
  if (domain === "events" && suffix === "taxonomy") return sendJson(res, 200, taxonomyTree(items, "category", "series", "event_type"));
  if (domain === "events" && suffix?.endsWith("/scholars")) return sendJson(res, 200, { items: [], total: 0 });
  if (domain === "events" && suffix) {
    const item = detailItem(items, suffix);
    return item ? sendJson(res, 200, { ...item, scholar_ids: item.scholar_ids || [] }) : sendJson(res, 404, { detail: "Not Found" });
  }
  if (domain === "venues" && suffix === "stats") return sendJson(res, 200, { total: items.length });
  if (domain === "venues" && suffix) {
    const item = detailItem(items, suffix);
    return item ? sendJson(res, 200, item) : sendJson(res, 404, { detail: "Not Found" });
  }
  if (domain === "institutions" && url.searchParams.get("view") === "hierarchy") return sendJson(res, 200, { organizations: filterItems(domain, items, url).map((item) => ({ ...item, departments: item.departments || [] })) });
  return sendJson(res, 200, pageItems(filterItems(domain, items, url), url));
});

server.listen(port, "127.0.0.1", () => console.log(`Local snapshot backend listening on http://127.0.0.1:${port}`));
