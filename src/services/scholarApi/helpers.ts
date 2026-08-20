import { normalizeProjectSubcategoryLabel } from "@/constants/projectCategories";
import { invalidateCache } from "@/services/requestUtils";
import type {
  CoauthorInfo,
  ProfileLinks,
  RelationPatch,
  ScholarEventTag,
  ScholarListFilters,
  ScholarProjectFields,
  ScholarProjectTag,
  ScholarUniversityItem,
} from "./types";

// ====== University cache ======

export const UNIVERSITY_CACHE_TTL_MS = 30_000;
export const scholarUniversityCache = new Map<
  string,
  { expiresAt: number; data: ScholarUniversityItem[] }
>();
export const scholarUniversityInFlight = new Map<
  string,
  Promise<ScholarUniversityItem[]>
>();

export function invalidateScholarUniversityCache(): void {
  scholarUniversityCache.clear();
  scholarUniversityInFlight.clear();
}

export function invalidateScholarListCache(): void {
  invalidateCache("/api/scholars");
}

export function buildUniversityCacheKey(filters?: {
  region?: string;
  affiliation_type?: string;
  is_adjunct_supervisor?: boolean;
}): string {
  return JSON.stringify({
    region: filters?.region ?? "",
    affiliation_type: filters?.affiliation_type ?? "",
    is_adjunct_supervisor: Boolean(filters?.is_adjunct_supervisor),
  });
}

function appendScholarFilterParams(
  params: URLSearchParams,
  filters?: ScholarListFilters,
): void {
  if (filters?.university) params.set("university", filters.university);
  if (filters?.department) params.set("department", filters.department);
  if (filters?.search) params.set("keyword", filters.search);
  if (filters?.participated_event_id) {
    params.set("participated_event_id", filters.participated_event_id);
  }
  if (filters?.is_chinese !== undefined) {
    params.set("is_chinese", String(filters.is_chinese));
  }
  if (filters?.is_current_student !== undefined) {
    params.set("is_current_student", String(filters.is_current_student));
  }
  if (filters?.chinese_identity) {
    params.set("chinese_identity", filters.chinese_identity);
  }
  if (filters?.achievement_tag) {
    params.set("achievement_tag", filters.achievement_tag);
  }
  if (filters?.achievement_tags?.length) {
    params.set("achievement_tags", filters.achievement_tags.join(","));
  }
  if (filters?.is_adjunct_supervisor) {
    params.set("is_adjunct_supervisor", "true");
  }
  if (filters?.is_cobuild_scholar !== undefined) {
    params.set("is_cobuild_scholar", String(filters.is_cobuild_scholar));
  }
  if (filters?.institution_group) {
    params.set("institution_group", filters.institution_group);
  }
  if (filters?.institution_category) {
    params.set("institution_category", filters.institution_category);
  }
  if (filters?.region) params.set("region", filters.region);
  if (filters?.affiliation_type) {
    params.set("affiliation_type", filters.affiliation_type);
  }
  if (filters?.project_category) {
    params.set("project_category", filters.project_category);
  }
  if (filters?.project_subcategory) {
    params.set("project_subcategory", filters.project_subcategory);
  }
  if (filters?.project_categories?.length) {
    params.set("project_categories", filters.project_categories.join(","));
  }
  if (filters?.project_subcategories?.length) {
    params.set(
      "project_subcategories",
      filters.project_subcategories.join(","),
    );
  }
  if (filters?.event_types?.length) {
    params.set("event_types", filters.event_types.join(","));
  }
}

export function buildScholarListParams(
  page: number,
  pageSize: number,
  filters?: ScholarListFilters,
): URLSearchParams {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  appendScholarFilterParams(params, filters);
  return params;
}

function isRequestTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes("Request timeout after")
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function createScholarListError(error: unknown, fallback: string): Error {
  if (isAbortError(error)) {
    const abortError = new Error("The operation was aborted.");
    abortError.name = "AbortError";
    return abortError;
  }
  if (isRequestTimeoutError(error)) {
    return new Error("数据加载超时，请稍后重试");
  }
  return error instanceof Error ? error : new Error(fallback);
}

function normalizeProjectTags(raw: unknown): ScholarProjectTag[] {
  if (!Array.isArray(raw)) return [];
  const tags: ScholarProjectTag[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const tag = item as Record<string, unknown>;
    const category = String(tag.category ?? "").trim();
    const subcategory = normalizeProjectSubcategoryLabel(
      String(tag.subcategory ?? "").trim(),
    );
    if (!category && !subcategory) continue;
    tags.push({
      category,
      subcategory,
      project_id: String(tag.project_id ?? "").trim() || undefined,
      project_title: String(tag.project_title ?? "").trim() || undefined,
    });
  }
  return tags;
}

function normalizeParticipatedEventIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((id) => String(id ?? "").trim()).filter(Boolean);
}

function normalizeEventTags(raw: unknown): ScholarEventTag[] {
  if (!Array.isArray(raw)) return [];
  const tags: ScholarEventTag[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const tag = item as Record<string, unknown>;
    const category = String(tag.category ?? "").trim();
    const eventType = String(tag.event_type ?? "").trim();
    if (!category && !eventType) continue;
    tags.push({
      category,
      event_type: eventType,
      series: String(tag.series ?? "").trim() || undefined,
      event_id: String(tag.event_id ?? "").trim() || undefined,
      event_title: String(tag.event_title ?? "").trim() || undefined,
    });
  }
  return tags;
}

function normalizeNullableNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function normalizeCoauthors(raw: unknown): CoauthorInfo[] {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];

  const coauthors: CoauthorInfo[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const coauthor = item as Record<string, unknown>;
    const aminerId = String(coauthor.aminer_id ?? "").trim();
    const name = String(coauthor.name ?? "").trim();
    const nameZh = String(coauthor.name_zh ?? "").trim();
    if (!aminerId && !name && !nameZh) continue;

    coauthors.push({
      aminer_id: aminerId,
      name,
      name_zh: nameZh,
      h_index: normalizeNullableNumber(coauthor.h_index),
      n_citation: normalizeNullableNumber(coauthor.n_citation),
      n_pubs: normalizeNullableNumber(coauthor.n_pubs),
      avatar: String(coauthor.avatar ?? "").trim(),
      position: String(coauthor.position ?? "").trim(),
      affiliation: String(coauthor.affiliation ?? "").trim(),
      affiliation_zh: String(coauthor.affiliation_zh ?? "").trim(),
      weight: normalizeNullableNumber(coauthor.weight) ?? 0,
    });
  }
  return coauthors;
}


function normalizeStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item ?? "").trim()).filter(Boolean);
}

export function normalizeProfileLinks(raw: unknown): ProfileLinks {
  if (!raw || typeof raw !== "object") {
    return {
      homepage: "",
      lab: "",
      github: "",
      linkedin: "",
      google_scholar: "",
      orcid: "",
      dblp: "",
      x: "",
      openreview: "",
      aminer: "",
      other: [],
    };
  }

  const links = raw as Record<string, unknown>;
  return {
    homepage: String(links.homepage ?? "").trim(),
    lab: String(links.lab ?? "").trim(),
    github: String(links.github ?? "").trim(),
    linkedin: String(links.linkedin ?? "").trim(),
    google_scholar: String(links.google_scholar ?? "").trim(),
    orcid: String(links.orcid ?? "").trim(),
    dblp: String(links.dblp ?? "").trim(),
    x: String(links.x ?? "").trim(),
    openreview: String(links.openreview ?? "").trim(),
    aminer: String(links.aminer ?? "").trim(),
    other: normalizeStringArray(links.other),
  };
}

export function resolveProfileLinks(
  scholar: Pick<
    ScholarProjectFields,
    | "profile_links"
    | "profile_url"
    | "lab_url"
    | "google_scholar_url"
    | "dblp_url"
    | "orcid"
    | "linkedin_url"
    | "github_url"
    | "x_url"
    | "openreview_url"
    | "aminer_url"
  >,
): ProfileLinks {
  const profileLinks = normalizeProfileLinks(scholar.profile_links);
  return {
    homepage: profileLinks.homepage || String(scholar.profile_url ?? "").trim(),
    lab: profileLinks.lab || String(scholar.lab_url ?? "").trim(),
    github: profileLinks.github || String(scholar.github_url ?? "").trim(),
    linkedin: profileLinks.linkedin || String(scholar.linkedin_url ?? "").trim(),
    google_scholar:
      profileLinks.google_scholar ||
      String(scholar.google_scholar_url ?? "").trim(),
    orcid: profileLinks.orcid || String(scholar.orcid ?? "").trim(),
    dblp: profileLinks.dblp || String(scholar.dblp_url ?? "").trim(),
    x: profileLinks.x || String(scholar.x_url ?? "").trim(),
    openreview: profileLinks.openreview || String(scholar.openreview_url ?? "").trim(),
    aminer: profileLinks.aminer || String(scholar.aminer_url ?? "").trim(),
    other: profileLinks.other,
  };
}

export function buildLegacyProfileLinkFields(profileLinks: ProfileLinks): {
  profile_url: string;
  lab_url: string;
  google_scholar_url: string;
  dblp_url: string;
  orcid: string;
  linkedin_url: string;
  github_url: string;
  x_url: string;
  openreview_url: string;
  aminer_url: string;
} {
  return {
    profile_url: profileLinks.homepage,
    lab_url: profileLinks.lab,
    google_scholar_url: profileLinks.google_scholar,
    dblp_url: profileLinks.dblp,
    orcid: profileLinks.orcid,
    linkedin_url: profileLinks.linkedin,
    github_url: profileLinks.github,
    x_url: profileLinks.x,
    openreview_url: profileLinks.openreview,
    aminer_url: profileLinks.aminer,
  };
}

export function hasProfileLinks(profileLinks: ProfileLinks): boolean {
  return Boolean(
    profileLinks.homepage ||
    profileLinks.lab ||
    profileLinks.github ||
    profileLinks.linkedin ||
    profileLinks.google_scholar ||
    profileLinks.orcid ||
    profileLinks.dblp ||
    profileLinks.x ||
    profileLinks.openreview ||
    profileLinks.aminer ||
    profileLinks.other.length > 0,
  );
}

export function normalizeScholarProjectFields<T extends ScholarProjectFields>(
  scholar: T,
): T & {
  project_tags: ScholarProjectTag[];
  event_tags: ScholarEventTag[];
  participated_event_ids: string[];
  is_cobuild_scholar: boolean;
  project_category: string;
  project_subcategory: string;
  profile_links: ProfileLinks;
  profile_url: string;
  lab_url: string;
  google_scholar_url: string;
  dblp_url: string;
  orcid: string;
  linkedin_url: string;
  github_url: string;
  x_url: string;
  openreview_url: string;
  aminer_url: string;
  coauthors: CoauthorInfo[];
} {
  const projectTags = normalizeProjectTags(scholar.project_tags);
  const eventTags = normalizeEventTags(scholar.event_tags);
  const legacyCategory = String(scholar.project_category ?? "").trim();
  const legacySubcategory = normalizeProjectSubcategoryLabel(
    String(scholar.project_subcategory ?? "").trim(),
  );
  const profileLinks = resolveProfileLinks(scholar);
  const mergedTags =
    projectTags.length > 0
      ? projectTags
      : legacyCategory || legacySubcategory
        ? [{ category: legacyCategory, subcategory: legacySubcategory }]
        : [];
  const first = mergedTags[0] ?? { category: "", subcategory: "" };

  return {
    ...scholar,
    project_tags: mergedTags,
    event_tags: eventTags,
    participated_event_ids: normalizeParticipatedEventIds(
      scholar.participated_event_ids,
    ),
    is_cobuild_scholar: mergedTags.length > 0,
    project_category: first.category,
    project_subcategory: first.subcategory,
    profile_links: profileLinks,
    profile_url: profileLinks.homepage,
    lab_url: profileLinks.lab,
    google_scholar_url: profileLinks.google_scholar,
    dblp_url: profileLinks.dblp,
    orcid: profileLinks.orcid,
    linkedin_url: profileLinks.linkedin,
    github_url: profileLinks.github,
    x_url: profileLinks.x,
    openreview_url: profileLinks.openreview,
    aminer_url: profileLinks.aminer,
    coauthors: normalizeCoauthors(scholar.coauthors),
  };
}

export function buildScholarPayload<
  T extends {
    profile_links?: ProfileLinks;
    profile_url?: string;
    lab_url?: string;
    google_scholar_url?: string;
    dblp_url?: string;
    orcid?: string;
    linkedin_url?: string;
    github_url?: string;
    x_url?: string;
    openreview_url?: string;
    aminer_url?: string;
  },
>(data: T): T {
  const payload = { ...data };
  const nextLinks = resolveProfileLinks(payload);

  if (hasProfileLinks(nextLinks)) {
    payload.profile_links = nextLinks;
  }

  return {
    ...payload,
    ...buildLegacyProfileLinkFields(nextLinks),
  };
}

export function buildRelationPayload(data: RelationPatch): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...data };
  const tags = normalizeProjectTags(payload.project_tags);
  const eventTags = normalizeEventTags(payload.event_tags);
  const legacyCategory = String(payload.project_category ?? "").trim();
  const legacySubcategory = normalizeProjectSubcategoryLabel(
    String(payload.project_subcategory ?? "").trim(),
  );

  if (tags.length > 0) {
    payload.project_tags = tags;
  } else if (legacyCategory || legacySubcategory) {
    payload.project_tags = [
      { category: legacyCategory, subcategory: legacySubcategory },
    ];
  }

  if (eventTags.length > 0) {
    payload.event_tags = eventTags;
  }

  if (payload.is_cobuild_scholar === undefined) {
    const hasProjectTags =
      Array.isArray(payload.project_tags) && payload.project_tags.length > 0;
    payload.is_cobuild_scholar = hasProjectTags;
  }

  delete payload.project_category;
  delete payload.project_subcategory;
  return payload;
}
