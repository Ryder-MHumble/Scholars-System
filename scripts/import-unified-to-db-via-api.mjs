import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const inputFile = path.join(rootDir, "data", "unified", "scholars-unified.json");
const API_BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:8001";

function parseArgs(argv) {
  const args = {
    limit: null,
    start: 0,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--limit") args.limit = Number(argv[++i]);
    if (token === "--start") args.start = Number(argv[++i]);
    if (token === "--dry-run") args.dryRun = true;
  }
  return args;
}

function norm(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function pickOrg(orgs) {
  const first = toArray(orgs)[0] ?? {};
  return {
    university: norm(first.level_1_zh || first.level_1_en) || "",
    department: norm(first.level_2_zh || first.level_2_en) || "",
  };
}

function buildScholarPayload(scholar) {
  const org = pickOrg(scholar.orgs);
  const education = toArray(scholar.edu_zh).map((item) => ({
    degree: item?.degree ?? "",
    institution: item?.institution ?? "",
    major: item?.major ?? "",
    year:
      item?.end_year !== null && item?.end_year !== undefined
        ? String(item.end_year)
        : item?.start_year !== null && item?.start_year !== undefined
          ? String(item.start_year)
          : "",
  }));

  const payload = {
    name: scholar.name,
    name_en: scholar.name || undefined,
    university: org.university || undefined,
    department: org.department || undefined,
    position: scholar.position_zh || scholar.position || undefined,
    bio: scholar.bio_zh || scholar.bio || undefined,
    email: scholar.email || undefined,
    phone: scholar.phone || undefined,
    profile_url:
      norm(scholar.homepage).startsWith("http://") ||
      norm(scholar.homepage).startsWith("https://")
        ? scholar.homepage
        : undefined,
    research_areas:
      toArray(scholar.research_tags).length > 0
        ? toArray(scholar.research_tags).slice(0, 20)
        : undefined,
    education: education.length > 0 ? education : undefined,
    added_by: "unified-import-script",
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }),
  );
}

function buildScholarPatchPayload(scholar) {
  const base = buildScholarPayload(scholar);
  const { added_by, ...rest } = base;
  return rest;
}

function buildPublicationPayload(rows) {
  return {
    representative_publications: rows.map((row) => ({
      title: row.title || "",
      venue: row.venue || "",
      year: row.year ? String(row.year) : "",
      authors: row.authors || row.author_name || "",
      doi: row.doi || "",
      abstract: row.abstract || "",
      source_type: row.source_type || "aminer",
      citation_count: undefined,
      added_by: "unified-import-script",
    })),
    updated_by: "unified-import-script",
  };
}

async function requestJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function detectApiPrefix() {
  const candidates = ["/api", "/api"];
  for (const prefix of candidates) {
    try {
      const res = await requestJson(
        `${API_BASE_URL}${prefix}/scholars?page=1&page_size=1`,
        { method: "GET" },
      );
      if (res.ok) return prefix;
    } catch {
      // ignore and try next
    }
  }
  throw new Error(
    `Cannot detect scholars API prefix under ${API_BASE_URL}. Tried /api and /api`,
  );
}

function extractUrlHashFromConflict(detail) {
  const message =
    typeof detail === "string"
      ? detail
      : typeof detail?.detail === "string"
        ? detail.detail
        : "";
  const match = message.match(/url_hash:\s*([a-f0-9]{32,128})/i);
  return match ? match[1] : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiPrefix = await detectApiPrefix();
  const raw = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  const scholars = toArray(raw.scholars);
  const scholarPublications = toArray(raw.scholar_publications);

  const pubsByScholarId = new Map();
  for (const row of scholarPublications) {
    const id = norm(row.scholar_id);
    if (!id) continue;
    if (!pubsByScholarId.has(id)) pubsByScholarId.set(id, []);
    pubsByScholarId.get(id).push(row);
  }

  const start = Number.isFinite(args.start) && args.start > 0 ? args.start : 0;
  const end = args.limit && args.limit > 0 ? start + args.limit : scholars.length;
  const selected = scholars.slice(start, end);

  const stats = {
    total_selected: selected.length,
    created_scholars: 0,
    updated_scholars: 0,
    failed_scholars: 0,
    patched_publications: 0,
    failed_publications: 0,
    dry_run: args.dryRun,
  };

  console.log(
    JSON.stringify(
      {
        api_base_url: API_BASE_URL,
        api_prefix: apiPrefix,
        input_file: path.relative(rootDir, inputFile),
        total_scholars: scholars.length,
        selected_start: start,
        selected_end_exclusive: Math.min(end, scholars.length),
        ...stats,
      },
      null,
      2,
    ),
  );

  if (args.dryRun) return;

  for (let i = 0; i < selected.length; i += 1) {
    const scholar = selected[i];
    const payload = buildScholarPayload(scholar);
    const createRes = await requestJson(`${API_BASE_URL}${apiPrefix}/scholars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let urlHash = null;
    if (createRes.ok) {
      stats.created_scholars += 1;
      const created = createRes.data ?? {};
      urlHash = norm(created.url_hash);
    } else if (createRes.status === 409) {
      const conflictUrlHash = extractUrlHashFromConflict(createRes.data);
      if (!conflictUrlHash) {
        stats.failed_scholars += 1;
        console.log(
          `[scholar-failed] idx=${start + i} aminer_id=${scholar.aminer_id} status=${createRes.status} detail=${JSON.stringify(createRes.data)}`,
        );
        continue;
      }
      const patchPayload = buildScholarPatchPayload(scholar);
      const patchRes = await requestJson(
        `${API_BASE_URL}${apiPrefix}/scholars/${encodeURIComponent(conflictUrlHash)}/basic`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchPayload),
        },
      );
      if (!patchRes.ok) {
        stats.failed_scholars += 1;
        console.log(
          `[scholar-update-failed] idx=${start + i} aminer_id=${scholar.aminer_id} url_hash=${conflictUrlHash} status=${patchRes.status} detail=${JSON.stringify(patchRes.data)}`,
        );
        continue;
      }
      stats.updated_scholars += 1;
      urlHash = conflictUrlHash;
    } else {
      stats.failed_scholars += 1;
      console.log(
        `[scholar-failed] idx=${start + i} aminer_id=${scholar.aminer_id} status=${createRes.status} detail=${JSON.stringify(createRes.data)}`,
      );
      continue;
    }

    const scholarPubs = pubsByScholarId.get(norm(scholar.scholar_id)) ?? [];

    if (!urlHash || scholarPubs.length === 0) {
      if ((i + 1) % 20 === 0) {
        console.log(
          `[progress] ${i + 1}/${selected.length} created=${stats.created_scholars} updated=${stats.updated_scholars} pubs_ok=${stats.patched_publications}`,
        );
      }
      continue;
    }

    const pubPayload = buildPublicationPayload(scholarPubs);
    const pubRes = await requestJson(
      `${API_BASE_URL}${apiPrefix}/scholars/${encodeURIComponent(urlHash)}/achievements`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pubPayload),
      },
    );

    if (pubRes.ok) stats.patched_publications += 1;
    else {
      stats.failed_publications += 1;
      console.log(
        `[publication-failed] url_hash=${urlHash} aminer_id=${scholar.aminer_id} status=${pubRes.status} detail=${JSON.stringify(pubRes.data)}`,
      );
    }

    if ((i + 1) % 20 === 0) {
      console.log(
        `[progress] ${i + 1}/${selected.length} created=${stats.created_scholars} updated=${stats.updated_scholars} failed=${stats.failed_scholars} pubs_ok=${stats.patched_publications} pubs_failed=${stats.failed_publications}`,
      );
    }
  }

  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
