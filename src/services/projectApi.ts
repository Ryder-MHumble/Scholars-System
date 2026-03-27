import type {
  Project,
  ProjectCreateRequest,
  ProjectListItem,
  ProjectListResponse,
  ProjectOutput,
  ProjectPatchRequest,
  RelatedScholar,
} from "@/types/project";

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8002"
  : "http://10.1.132.21:8001";

interface BackendProjectListItem {
  id: string;
  category?: string;
  subcategory?: string;
  title?: string;
  summary?: string;
  scholar_count?: number;
  created_at?: string;
}

interface BackendProjectDetail extends BackendProjectListItem {
  scholar_ids?: string[];
  updated_at?: string;
  custom_fields?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

interface BackendProjectListResponse {
  items: BackendProjectListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface BackendProjectTaxonomySubCategory {
  id: string;
  name: string;
  sort_order: number;
}

interface BackendProjectTaxonomyCategory {
  id: string;
  name: string;
  sort_order: number;
  children: BackendProjectTaxonomySubCategory[];
}

export interface ProjectTaxonomyTree {
  total_l1: number;
  total_l2: number;
  items: BackendProjectTaxonomyCategory[];
}

function asStringRecord(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      out[key] = value;
      continue;
    }
    out[key] = JSON.stringify(value);
  }
  return out;
}

function parseOptionalNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function parseStringArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item ?? "").trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function parseOutputs(raw: string | undefined): ProjectOutput[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const outputs: ProjectOutput[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const output = item as Record<string, unknown>;
      const title = String(output.title ?? "").trim();
      if (!title) continue;
      outputs.push({
        type: String(output.type ?? "").trim(),
        title,
        year: Number(output.year ?? 0) || 0,
        authors: Array.isArray(output.authors)
          ? output.authors
              .map((author) => String(author ?? "").trim())
              .filter(Boolean)
          : [],
        venue: String(output.venue ?? "").trim(),
        url: String(output.url ?? "").trim() || undefined,
      });
    }
    return outputs;
  } catch {
    return [];
  }
}

function parseRelatedScholars(
  raw: string | undefined,
  fallbackScholarIds: string[],
): RelatedScholar[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized: RelatedScholar[] = [];
        for (const item of parsed) {
          if (!item || typeof item !== "object") continue;
          const s = item as Record<string, unknown>;
          const scholarId = String(s.scholar_id ?? "").trim();
          const name = String(s.name ?? "").trim();
          if (!scholarId && !name) continue;
          normalized.push({
            scholar_id: scholarId || undefined,
            name: name || scholarId,
            role: String(s.role ?? "参与者").trim() || "参与者",
            institution: String(s.institution ?? "").trim(),
            photo_url: String(s.photo_url ?? "").trim() || undefined,
            title: String(s.title ?? "").trim() || undefined,
            department: String(s.department ?? "").trim() || undefined,
          });
        }
        if (normalized.length > 0) return normalized;
      }
    } catch {
      // ignore invalid legacy value
    }
  }

  return fallbackScholarIds.map((scholarId) => ({
    scholar_id: scholarId,
    name: scholarId,
    role: "参与者",
    institution: "",
  }));
}

function parseExtra(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

function buildDefaultTags(category: string, subcategory: string): string[] {
  const tags = [category, subcategory, `${category}-${subcategory}`]
    .map((tag) => tag.trim())
    .filter(Boolean);
  return Array.from(new Set(tags));
}

function mapBackendDetail(raw: BackendProjectDetail): Project {
  const customFields = asStringRecord(raw.custom_fields);
  const category = String(raw.category ?? "").trim();
  const subcategory = String(raw.subcategory ?? "").trim();
  const title = String(raw.title ?? "").trim() || "未命名项目标签";
  const summary = String(raw.summary ?? "").trim();
  const scholarIds = Array.isArray(raw.scholar_ids)
    ? raw.scholar_ids.map((id) => String(id ?? "").trim()).filter(Boolean)
    : [];
  const tags = parseStringArray(customFields.tags);
  const startYear = parseOptionalNumber(customFields.start_year);

  return {
    id: raw.id,
    category,
    subcategory,
    title,
    summary,
    scholar_ids: scholarIds,
    custom_fields: customFields,
    name: title,
    pi_name: customFields.pi_name ?? "系统标签",
    pi_institution: customFields.pi_institution ?? "",
    funder: customFields.funder ?? "",
    funding_amount: parseOptionalNumber(customFields.funding_amount),
    start_year: startYear ?? new Date().getFullYear(),
    end_year: parseOptionalNumber(customFields.end_year),
    status: customFields.status ?? "在研",
    description: summary,
    keywords: parseStringArray(customFields.keywords),
    tags: tags.length > 0 ? tags : buildDefaultTags(category, subcategory),
    related_scholars: parseRelatedScholars(customFields.related_scholars, scholarIds),
    cooperation_institutions: parseStringArray(
      customFields.cooperation_institutions,
    ),
    outputs: parseOutputs(customFields.outputs),
    extra: {
      ...parseExtra(customFields.extra),
      ...(raw.extra ?? {}),
    },
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function mapBackendListItem(raw: BackendProjectListItem): ProjectListItem {
  const category = String(raw.category ?? "").trim();
  const subcategory = String(raw.subcategory ?? "").trim();
  const title = String(raw.title ?? "").trim() || "未命名项目标签";
  const summary = String(raw.summary ?? "").trim();

  return {
    id: raw.id,
    category,
    subcategory,
    title,
    summary,
    scholar_ids: [],
    scholar_count: Number(raw.scholar_count ?? 0),
    name: title,
    pi_name: "系统标签",
    pi_institution: "",
    funder: "",
    start_year: new Date().getFullYear(),
    status: "在研",
    description: summary,
    keywords: [],
    tags: buildDefaultTags(category, subcategory),
    related_scholars: [],
  };
}

function inferSubcategory(data: Partial<ProjectCreateRequest>): string {
  if (data.subcategory && data.subcategory.trim()) return data.subcategory.trim();
  for (const tag of data.tags ?? []) {
    if (!tag) continue;
    const segments = tag.split("-");
    if (segments.length >= 2 && segments[1].trim()) {
      return segments[1].trim();
    }
  }
  return "";
}

function toScholarIds(data: {
  scholar_ids?: string[];
  related_scholars?: RelatedScholar[];
}): string[] {
  if (Array.isArray(data.scholar_ids)) {
    return data.scholar_ids
      .map((id) => String(id ?? "").trim())
      .filter(Boolean);
  }
  const ids = (data.related_scholars ?? [])
    .map((s) => String(s.scholar_id ?? "").trim())
    .filter(Boolean);
  return Array.from(new Set(ids));
}

function encodeLegacyCustomFields(
  data: Partial<ProjectCreateRequest>,
): Record<string, string> {
  const customFields: Record<string, string> = {};

  if ("pi_name" in data) customFields.pi_name = data.pi_name ?? "";
  if ("pi_institution" in data) {
    customFields.pi_institution = data.pi_institution ?? "";
  }
  if ("funder" in data) customFields.funder = data.funder ?? "";
  if ("funding_amount" in data) {
    customFields.funding_amount =
      data.funding_amount === undefined ? "" : String(data.funding_amount);
  }
  if ("start_year" in data) {
    customFields.start_year =
      data.start_year === undefined ? "" : String(data.start_year);
  }
  if ("end_year" in data) {
    customFields.end_year =
      data.end_year === undefined ? "" : String(data.end_year);
  }
  if ("status" in data) customFields.status = data.status ?? "";

  if ("keywords" in data && Array.isArray(data.keywords)) {
    customFields.keywords = JSON.stringify(data.keywords);
  }
  if ("tags" in data && Array.isArray(data.tags)) {
    customFields.tags = JSON.stringify(data.tags);
  }
  if (
    "cooperation_institutions" in data &&
    Array.isArray(data.cooperation_institutions)
  ) {
    customFields.cooperation_institutions = JSON.stringify(
      data.cooperation_institutions,
    );
  }
  if ("outputs" in data && Array.isArray(data.outputs)) {
    customFields.outputs = JSON.stringify(data.outputs);
  }
  if ("related_scholars" in data && Array.isArray(data.related_scholars)) {
    customFields.related_scholars = JSON.stringify(data.related_scholars);
  }
  if ("extra" in data) {
    customFields.extra = JSON.stringify(data.extra ?? {});
  }

  return customFields;
}

function toBackendCreatePayload(
  data: ProjectCreateRequest,
): Record<string, unknown> {
  const title = String(data.title ?? data.name ?? "").trim() || "未命名项目标签";
  const summary = String(data.summary ?? data.description ?? "").trim();
  const category = String(data.category ?? "").trim();
  const subcategory = inferSubcategory(data) || "未分类";
  return {
    category,
    subcategory,
    title,
    summary,
    scholar_ids: toScholarIds(data),
    custom_fields: {
      ...encodeLegacyCustomFields(data),
      ...(data.custom_fields ?? {}),
    },
  };
}

function toBackendPatchPayload(
  data: ProjectPatchRequest,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const customFields: Record<string, string> = {};

  if (data.category !== undefined) payload.category = data.category;
  if (data.subcategory !== undefined) payload.subcategory = data.subcategory;
  if (data.title !== undefined) payload.title = data.title;
  if (data.summary !== undefined) payload.summary = data.summary;

  if (data.name !== undefined && data.title === undefined) payload.title = data.name;
  if (data.description !== undefined && data.summary === undefined) {
    payload.summary = data.description;
  }

  if (data.scholar_ids !== undefined || data.related_scholars !== undefined) {
    payload.scholar_ids = toScholarIds(data);
  }

  Object.assign(customFields, encodeLegacyCustomFields(data));
  if (data.custom_fields) {
    Object.assign(customFields, data.custom_fields);
  }
  if (Object.keys(customFields).length > 0) {
    payload.custom_fields = customFields;
  }

  return payload;
}

export async function fetchProjectList(
  page = 1,
  pageSize = 20,
  search?: string,
  status?: string,
): Promise<ProjectListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (search) params.set("keyword", search);
  if (status && status !== "全部") {
    params.set("custom_field_key", "status");
    params.set("custom_field_value", status);
  }
  const res = await fetch(`${BASE_URL}/api/v1/projects/?${params}`);
  if (!res.ok) throw new Error(`项目列表加载失败: ${res.status}`);
  const raw: BackendProjectListResponse = await res.json();
  return {
    ...raw,
    items: raw.items.map(mapBackendListItem),
  };
}

export async function fetchProjectTaxonomy(): Promise<ProjectTaxonomyTree> {
  const res = await fetch(`${BASE_URL}/api/v1/projects/taxonomy`);
  if (!res.ok) throw new Error(`项目所属导师加载失败: ${res.status}`);
  return res.json();
}

export async function fetchProjectDetail(id: string): Promise<Project> {
  const res = await fetch(`${BASE_URL}/api/v1/projects/${id}`);
  if (!res.ok) throw new Error(`项目详情加载失败: ${res.status}`);
  const raw: BackendProjectDetail = await res.json();
  return mapBackendDetail(raw);
}

export async function createProject(
  data: ProjectCreateRequest,
): Promise<Project> {
  const payload = toBackendCreatePayload(data);
  const res = await fetch(`${BASE_URL}/api/v1/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`创建项目失败: ${res.status}`);
  const raw: BackendProjectDetail = await res.json();
  return mapBackendDetail(raw);
}

export async function patchProject(
  id: string,
  data: ProjectPatchRequest,
): Promise<Project> {
  const payload = toBackendPatchPayload(data);
  const res = await fetch(`${BASE_URL}/api/v1/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`更新项目失败: ${res.status}`);
  const raw: BackendProjectDetail = await res.json();
  return mapBackendDetail(raw);
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/projects/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`删除项目失败: ${res.status}`);
}
