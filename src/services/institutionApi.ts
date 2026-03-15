import type {
  InstitutionListResponse,
  InstitutionDetail,
  InstitutionPatchRequest,
  InstitutionTreeResponse,
} from "@/types/institution";

export interface InstitutionCreateRequest {
  id: string;
  name: string;
  type?: string;
  region?: string;
  org_type?: string;
  classification?: string;
  category?: string;
  priority?: string;
  parent_id?: string;
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
    id: string;
    name: string;
  }>;
}

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8002"
  : "http://43.98.254.243:8001";

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
  pageSize = 20,
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
  if (!res.ok) throw new Error(`机构更新失败: ${res.status}`);
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
