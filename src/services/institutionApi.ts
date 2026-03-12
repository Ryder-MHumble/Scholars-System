import type {
  InstitutionListResponse,
  InstitutionDetail,
  InstitutionPatchRequest,
} from "@/types/institution";

export interface InstitutionCreateRequest {
  id: string;
  name: string;
  type?: string;
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

export async function fetchInstitutionList(
  page = 1,
  pageSize = 20,
): Promise<InstitutionListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const res = await fetch(
    `${BASE_URL}/api/v1/institutions/scholars/?${params}`,
  );
  if (!res.ok) throw new Error(`机构列表加载失败: ${res.status}`);
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
