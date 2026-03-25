import type {
  InstitutionListResponse,
  InstitutionDetail,
  InstitutionPatchRequest,
  InstitutionTreeResponse,
} from "@/types/institution";

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

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8001").replace(
  /\/$/,
  "",
);

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
    view: "flat",
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
  // First, search for the university to get its ID
  const searchResult = await searchInstitutions(universityName, { limit: 1 });

  if (searchResult.results.length === 0) {
    return [];
  }

  const university = searchResult.results[0];

  // Then, get all institutions and filter for departments under this university
  const response = await fetch(
    `${BASE_URL}/api/v1/institutions?entity_type=department&page_size=200`,
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  // Filter departments that belong to this university
  return data.items
    .filter((dept: InstitutionSearchResult) => dept.parent_id === university.id)
    .map((dept: InstitutionSearchResult) => dept.name);
}
