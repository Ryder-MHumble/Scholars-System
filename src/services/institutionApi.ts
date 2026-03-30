import type {
  InstitutionListResponse,
  InstitutionDetail,
  LeadershipDetailResponse,
  InstitutionPatchRequest,
  InstitutionTreeResponse,
} from "@/types/institution";
import { API_BASE_URL } from "@/services/apiBase";

export interface InstitutionCreateRequest {
  id?: string;
  name: string;
  entity_type?: "organization" | "department";
  type?: string;
  region?: string;
  org_type?: string;
  classification?: string;
  sub_classification?: string;
  category?: string;
  priority?: string;
  parent_id?: string;
  org_name?: string;
  student_count_24?: number;
  student_count_25?: number;
  mentor_count?: number;
  resident_leaders?: string[];
  degree_committee?: string[];
  teaching_committee?: string[];
  university_leaders?: Array<{
    name: string;
    title?: string | null;
    department?: string | null;
    research_area?: string | null;
  }>;
  notable_scholars?: Array<{
    name: string;
    title?: string | null;
    department?: string | null;
    research_area?: string | null;
  }>;
  key_departments?: string[];
  joint_labs?: string[];
  training_cooperation?: string[];
  academic_cooperation?: string[];
  talent_dual_appointment?: string[];
  recruitment_events?: string[];
  visit_exchanges?: string[];
  cooperation_focus?: string[];
  departments?: Array<{
    id?: string;
    name: string;
    org_name?: string;
  }>;
}

const BASE_URL = API_BASE_URL;

export interface InstitutionTaxonomy {
  total: number;
  regions: {
    [region: string]: {
      count: number;
      org_types: {
        [orgType: string]: {
          count: number;
          classifications?: {
            [classification: string]: {
              count: number;
            };
          };
        };
      };
    };
  };
}

export async function fetchInstitutionTaxonomy(): Promise<InstitutionTaxonomy> {
  const res = await fetch(`${BASE_URL}/api/v1/institutions/taxonomy`);
  if (!res.ok) throw new Error(`分类体系加载失败: ${res.status}`);
  return res.json();
}

export async function fetchInstitutionList(
  page = 1,
  pageSize = 50,
  filters?: {
    entity_type?: string;
    region?: string;
    org_type?: string;
    classification?: string;
    sub_classification?: string;
    keyword?: string;
    view?: "flat" | "hierarchy";
  },
): Promise<InstitutionListResponse> {
  const params = new URLSearchParams({
    view: filters?.view ?? "flat",
    page: String(page),
    page_size: String(pageSize),
  });

  // Add entity_type=organization by default for institution list
  if (filters?.entity_type) {
    params.set("entity_type", filters.entity_type);
  } else {
    params.set("entity_type", "organization");
  }

  if (filters?.region) params.set("region", filters.region);
  if (filters?.org_type) params.set("org_type", filters.org_type);
  if (filters?.classification)
    params.set("classification", filters.classification);
  if (filters?.sub_classification)
    params.set("sub_classification", filters.sub_classification);
  if (filters?.keyword) params.set("keyword", filters.keyword);

  const res = await fetch(`${BASE_URL}/api/v1/institutions?${params}`);
  if (!res.ok) throw new Error(`机构列表加载失败: ${res.status}`);
  return res.json();
}

export interface InstitutionHierarchyDepartment {
  id?: string;
  name: string;
  scholar_count: number;
  org_name?: string | null;
}

export interface InstitutionHierarchyOrganization {
  id: string;
  name: string;
  entity_type?: string | null;
  region?: string | null;
  org_type?: string | null;
  classification?: string | null;
  sub_classification?: string | null;
  scholar_count: number;
  departments?: InstitutionHierarchyDepartment[];
}

export async function fetchInstitutionHierarchy(filters?: {
  entity_type?: string;
  region?: string;
  org_type?: string;
  classification?: string;
  sub_classification?: string;
  keyword?: string;
}): Promise<InstitutionHierarchyOrganization[]> {
  const params = new URLSearchParams({ view: "hierarchy" });
  if (filters?.entity_type) {
    params.set("entity_type", filters.entity_type);
  } else {
    params.set("entity_type", "organization");
  }
  if (filters?.region) params.set("region", filters.region);
  if (filters?.org_type) params.set("org_type", filters.org_type);
  if (filters?.classification)
    params.set("classification", filters.classification);
  if (filters?.sub_classification)
    params.set("sub_classification", filters.sub_classification);
  if (filters?.keyword) params.set("keyword", filters.keyword);

  const res = await fetch(`${BASE_URL}/api/v1/institutions?${params.toString()}`);
  if (!res.ok) throw new Error(`机构层级数据加载失败: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.organizations)) return [];
  return data.organizations as InstitutionHierarchyOrganization[];
}

export async function fetchInstitutionTree(): Promise<InstitutionTreeResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/institutions/scholars/tree`);
  if (!res.ok) throw new Error(`机构分类树加载失败: ${res.status}`);
  return res.json();
}

export async function fetchAllInstitutions() {
  const first = await fetchInstitutionList(1, 100);
  const allItems = [...first.items];
  for (let p = 2; p <= first.total_pages; p++) {
    const data = await fetchInstitutionList(p, 100);
    allItems.push(...data.items);
  }
  return allItems;
}

export async function fetchInstitutionDetail(
  id: string,
): Promise<InstitutionDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/institutions/${id}`);
  if (!res.ok) throw new Error(`机构详情加载失败: ${res.status}`);
  return res.json();
}

export async function fetchInstitutionLeadership(
  institutionId: string,
): Promise<LeadershipDetailResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/leadership/${institutionId}`);
  if (!res.ok) throw new Error(`领导信息加载失败: ${res.status}`);
  return res.json();
}

export async function patchInstitution(
  id: string,
  data: InstitutionPatchRequest,
): Promise<InstitutionDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/institutions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) {
        detail =
          typeof body.detail === "string"
            ? body.detail
            : JSON.stringify(body.detail);
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(`机构更新失败: ${detail}`);
  }
  return res.json();
}

export async function createInstitution(
  data: InstitutionCreateRequest,
): Promise<InstitutionDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/institutions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) {
        detail =
          typeof body.detail === "string"
            ? body.detail
            : JSON.stringify(body.detail);
      } else if (body.message) {
        detail = body.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(`机构创建失败: ${detail}`);
  }
  return res.json();
}

export async function deleteInstitution(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/institutions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`机构删除失败: ${res.status}`);
}

// ============================================================================
// Institution Search & Autocomplete
// ============================================================================

export interface InstitutionSearchResult {
  id: string;
  name: string;
  entity_type: "organization" | "department" | null;
  region: string | null;
  org_type: string | null;
  parent_id: string | null;
  scholar_count: number;
}

export interface InstitutionSearchResponse {
  query: string;
  total: number;
  results: InstitutionSearchResult[];
}

export interface InstitutionSuggestionResponse {
  university: string;
  matched: InstitutionSearchResult | null;
  suggestions: InstitutionSearchResult[];
}

/**
 * Search institutions by name (fuzzy matching)
 *
 * @param query - Search query
 * @param limit - Maximum number of results (default: 10)
 * @param region - Optional region filter (国内/国际)
 * @param orgType - Optional org_type filter (高校/企业/研究机构/其他)
 * @returns Search results
 */
export async function searchInstitutions(
  query: string,
  options?: {
    limit?: number;
    region?: string;
    orgType?: string;
  },
): Promise<InstitutionSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    ...(options?.limit && { limit: options.limit.toString() }),
    ...(options?.region && { region: options.region }),
    ...(options?.orgType && { org_type: options.orgType }),
  });

  const response = await fetch(
    `${BASE_URL}/api/v1/institutions/search?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to search institutions: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Suggest best match for a university name
 *
 * Used when editing a scholar to find the canonical institution name.
 *
 * @param universityName - University name from scholar record
 * @returns Suggestion response with matched institution and alternatives
 */
export async function suggestInstitution(
  universityName: string,
): Promise<InstitutionSuggestionResponse> {
  const params = new URLSearchParams({
    university: universityName,
  });

  const response = await fetch(
    `${BASE_URL}/api/v1/institutions/suggest?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to suggest institution: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get departments for a specific university
 *
 * @param universityName - University name
 * @returns List of department names
 */
export async function getDepartmentsForUniversity(
  universityName: string,
): Promise<string[]> {
  const name = universityName.trim();
  if (!name) return [];

  // Prefer hierarchy API, which already returns organization->departments
  // and avoids missing departments due to global pagination windows.
  try {
    const organizations = await fetchInstitutionHierarchy({
      entity_type: "organization",
      keyword: name,
    });
    const exact = organizations.find(
      (org) => normalizeName(org.name) === normalizeName(name),
    );
    const matched = exact ?? organizations[0];
    const departments = (matched?.departments ?? [])
      .map((dept) => String(dept.name ?? "").trim())
      .filter(Boolean);
    if (departments.length > 0) {
      return Array.from(new Set(departments));
    }
  } catch {
    // fallback below
  }

  // Fallback: search university id, then paginate all department pages
  // and filter by parent_id.
  const searchResult = await searchInstitutions(name, { limit: 50 });
  const orgCandidates = searchResult.results.filter(
    (item) => item.entity_type === "organization",
  );
  const university =
    orgCandidates.find(
      (item) => normalizeName(item.name) === normalizeName(name),
    ) ?? orgCandidates[0];

  if (!university) return [];

  const firstRes = await fetch(
    `${BASE_URL}/api/v1/institutions?entity_type=department&page=1&page_size=200`,
  );
  if (!firstRes.ok) return [];
  const firstData = await firstRes.json();

  const departments: string[] = [];
  const collectNames = (items: InstitutionSearchResult[]) => {
    items
      .filter((dept) => dept.parent_id === university.id)
      .forEach((dept) => {
        const trimmed = String(dept.name ?? "").trim();
        if (trimmed) departments.push(trimmed);
      });
  };

  collectNames(Array.isArray(firstData.items) ? firstData.items : []);

  const totalPages = Number(firstData.total_pages ?? 1);
  for (let page = 2; page <= totalPages; page++) {
    const res = await fetch(
      `${BASE_URL}/api/v1/institutions?entity_type=department&page=${page}&page_size=200`,
    );
    if (!res.ok) break;
    const data = await res.json();
    collectNames(Array.isArray(data.items) ? data.items : []);
  }

  return Array.from(new Set(departments));
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function findExactInstitution(
  results: InstitutionSearchResult[],
  name: string,
  options?: {
    entityType?: "organization" | "department";
    parentId?: string;
  },
): InstitutionSearchResult | null {
  const target = normalizeName(name);
  for (const item of results) {
    if (normalizeName(item.name) !== target) continue;
    if (options?.entityType && item.entity_type !== options.entityType) continue;
    if (options?.parentId !== undefined && item.parent_id !== options.parentId) continue;
    return item;
  }
  return null;
}

export async function ensureOrganizationExists(
  organizationName: string,
): Promise<InstitutionSearchResult> {
  const name = organizationName.trim();
  if (!name) throw new Error("机构名称不能为空");

  const search = await searchInstitutions(name, { limit: 50 });
  const exact = findExactInstitution(search.results, name, {
    entityType: "organization",
  });
  if (exact) return exact;

  const created = await createInstitution({
    name,
    entity_type: "organization",
  });
  return {
    id: created.id,
    name: created.name,
    entity_type: (created.entity_type as "organization" | "department" | null) ?? "organization",
    region: created.region ?? null,
    org_type: created.org_type ?? null,
    parent_id: created.parent_id ?? null,
    scholar_count: created.scholar_count ?? 0,
  };
}

export async function ensureDepartmentExists(
  universityName: string,
  departmentName: string,
): Promise<InstitutionSearchResult> {
  const uniName = universityName.trim();
  const deptName = departmentName.trim();
  if (!uniName) throw new Error("请先选择院校");
  if (!deptName) throw new Error("院系名称不能为空");

  const organization = await ensureOrganizationExists(uniName);
  const search = await searchInstitutions(deptName, { limit: 50 });
  const exact = findExactInstitution(search.results, deptName, {
    entityType: "department",
    parentId: organization.id,
  });
  if (exact) return exact;

  const created = await createInstitution({
    name: deptName,
    entity_type: "department",
    parent_id: organization.id,
  });
  return {
    id: created.id,
    name: created.name,
    entity_type: (created.entity_type as "organization" | "department" | null) ?? "department",
    region: created.region ?? null,
    org_type: created.org_type ?? null,
    parent_id: created.parent_id ?? null,
    scholar_count: created.scholar_count ?? 0,
  };
}
