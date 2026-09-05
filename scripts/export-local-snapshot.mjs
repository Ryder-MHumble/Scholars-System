import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceBase = (process.env.SNAPSHOT_SOURCE_URL || "http://10.1.132.21:8001").replace(/\/$/, "");
const outputFile = path.join(rootDir, "local-backend", "data", "snapshot.json");
const limit = Math.min(Math.max(Number(process.env.SNAPSHOT_LIMIT || 10), 1), 10);

const sensitiveKeys = new Set([
  "email",
  "phone",
  "password",
  "token",
  "access_token",
  "client_secret",
  "api_key",
  "authorization",
  "custom_fields",
  "metadata",
]);

async function getJson(pathname, params = {}) {
  const url = new URL(`${sourceBase}${pathname}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`);
  return response.json();
}

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (sensitiveKeys.has(key.toLowerCase())) continue;
    result[key] = sanitize(item);
  }
  return result;
}

function rotateBuckets(buckets, maxItems) {
  const selected = [];
  const seen = new Set();
  let index = 0;
  while (selected.length < maxItems && buckets.some((bucket) => bucket.length > 0)) {
    const bucket = buckets[index % buckets.length];
    const item = bucket.shift();
    index += 1;
    if (!item) continue;
    const key = item.id || item.url_hash || item.student_id || item.event_id || item.venue_id || JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(item);
  }
  return selected;
}

async function fetchInstitutions() {
  const buckets = [];
  for (const classification of ["共建高校", "兄弟院校", "海外高校", "其他高校"]) {
    const data = await getJson("/api/institutions", { page: 1, page_size: limit, classification });
    buckets.push(data.items || []);
  }
  for (const orgType of ["研究机构", "企业", "行业学会"]) {
    const data = await getJson("/api/institutions", { page: 1, page_size: limit, org_type: orgType });
    buckets.push(data.items || []);
  }
  return rotateBuckets(buckets, limit).map((item) => ({
    id: item.id,
    name: item.name || "",
    entity_type: item.entity_type || "organization",
    region: item.region || "",
    org_type: item.org_type || "",
    classification: item.classification || "",
    sub_classification: item.sub_classification || "",
    type: item.type || null,
    group: item.group || null,
    category: item.category || null,
    priority: item.priority || null,
    scholar_count: Number(item.scholar_count || 0),
    department_count: Number(item.department_count || 0),
    student_count_total: item.student_count_total ?? null,
    mentor_count: item.mentor_count ?? null,
    parent_id: item.parent_id || null,
    avatar: item.avatar || null,
    org_name: item.org_name || null,
    is_985: Boolean(item.is_985),
    is_211: Boolean(item.is_211),
    is_double_first_class: Boolean(item.is_double_first_class),
    qs_rank: item.qs_rank ?? null,
    qs_rank_band: item.qs_rank_band || null,
    institution_tags: Array.isArray(item.institution_tags) ? item.institution_tags : [],
    departments: Array.isArray(item.departments) ? item.departments : [],
  }));
}

async function fetchScholars() {
  const buckets = [];
  for (const region of ["国内", "国际"]) {
    for (const affiliation_type of ["高校", "企业", "研究机构", "其他"]) {
      const data = await getJson("/api/scholars", { page: 1, page_size: limit, region, affiliation_type });
      buckets.push(data.items || []);
    }
  }
  const items = rotateBuckets(buckets, limit);
  return items.map((item) => sanitize({
    url_hash: item.url_hash,
    name: item.name || "",
    name_en: item.name_en || "",
    photo_url: item.photo_url || "",
    university: item.university || "",
    department: item.department || "",
    position: item.position || "",
    academic_titles: item.academic_titles || [],
    is_academician: Boolean(item.is_academician),
    research_areas: item.research_areas || [],
    profile_links: item.profile_links || {},
    achievement_tags: item.achievement_tags || [],
    representative_publications: item.representative_publications || [],
    patents: item.patents || [],
    awards: item.awards || [],
    coauthors: item.coauthors || [],
    is_potential_recruit: Boolean(item.is_potential_recruit),
    is_advisor_committee: Boolean(item.is_advisor_committee),
    adjunct_supervisor: item.adjunct_supervisor || {},
    is_cobuild_scholar: Boolean(item.is_cobuild_scholar),
    project_tags: item.project_tags || [],
    participated_event_ids: item.participated_event_ids || [],
    event_tags: item.event_tags || [],
    bio: item.bio || "",
    bio_en: item.bio_en || "",
    office: item.office || "",
    phd_institution: item.phd_institution || "",
    phd_year: item.phd_year || "",
    education: item.education || [],
    tags: item.tags || [],
    h_index: item.h_index ?? null,
    citations_count: item.citations_count ?? null,
    publications_count: item.publications_count ?? null,
    metrics_updated_at: item.metrics_updated_at || "",
    scholar_activities: item.scholar_activities || [],
    joint_research_projects: item.joint_research_projects || [],
    joint_management_roles: item.joint_management_roles || [],
    academic_exchange_records: item.academic_exchange_records || [],
    institute_relation_notes: item.institute_relation_notes || "",
    supervised_students: item.supervised_students || [],
    supervised_students_count: item.supervised_students_count || 0,
  }));
}

async function fetchStudents() {
  const buckets = [];
  for (const enrollment_year of ["2024", "2025", "2026"]) {
    const data = await getJson("/api/students", { page: 1, page_size: limit, enrollment_year });
    buckets.push(data.items || []);
  }
  return rotateBuckets(buckets, limit).map((item) => ({
    id: item.id,
    scholar_id: item.scholar_id || "",
    scholar_name: item.scholar_name || item.mentor_name || "",
    student_no: "",
    name: item.name || "",
    home_university: item.home_university || item.institution || "",
    major: item.major || "",
    degree_type: item.degree_type || "",
    enrollment_year: item.enrollment_year || "",
    status: item.status || "",
    mentor_name: item.mentor_name || "",
  }));
}

async function fetchProjects() {
  const data = await getJson("/api/projects", { page: 1, page_size: limit });
  return (data.items || []).slice(0, limit).map((item) => sanitize(item));
}

async function fetchEvents() {
  const buckets = [];
  for (const category of ["教育培养", "科研学术", "人才引育"]) {
    const data = await getJson("/api/events", { page: 1, page_size: limit, category });
    buckets.push((data.items || []).filter((item) => String(item.title || "").trim()));
  }
  return rotateBuckets(buckets, limit).map((item) => sanitize({
    id: item.id,
    category: item.category || "",
    event_type: item.event_type || "",
    series: item.series || "",
    series_number: item.series_number || "",
    title: item.title || "",
    abstract: item.abstract || "",
    event_date: item.event_date || "",
    event_time: item.event_time || "",
    duration: item.duration ?? null,
    location: item.location || "",
    photo_url: item.photo_url || item.cover_image_url || "",
    scholar_ids: item.scholar_ids || [],
    scholar_count: Number(item.scholar_count || 0),
    created_at: item.created_at || "",
    updated_at: item.updated_at || "",
  }));
}

async function fetchVenues() {
  const conference = await getJson("/api/venues", { page: 1, page_size: limit, type: "conference" });
  const journal = await getJson("/api/venues", { page: 1, page_size: limit, type: "journal" });
  return rotateBuckets([conference.items || [], journal.items || []], limit).map((item) => sanitize(item));
}

async function main() {
  const [institutions, scholars, students, projects, events, venues] = await Promise.all([
    fetchInstitutions(),
    fetchScholars(),
    fetchStudents(),
    fetchProjects(),
    fetchEvents(),
    fetchVenues(),
  ]);
  const snapshot = {
    meta: {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      source: sourceBase,
      per_domain_limit: limit,
      domains: ["institutions", "scholars", "students", "projects", "events", "venues"],
      redacted_fields: [...sensitiveKeys],
      selection: "category-aware round-robin sampling; GET-only export",
    },
    institutions: { items: institutions },
    scholars: { items: scholars },
    students: { items: students },
    projects: { items: projects },
    events: { items: events },
    venues: { items: venues },
  };
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output: path.relative(rootDir, outputFile), counts: Object.fromEntries(Object.entries(snapshot).filter(([key]) => key !== "meta").map(([key, value]) => [key, value.items.length])) }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
