import type {
  InstitutionListResponse,
  InstitutionDetail,
  InstitutionPatchRequest,
} from "@/types/institution";

const BASE_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_BASE_URL || "http://43.98.254.243:8002";

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

export async function deleteInstitution(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/institutions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`机构删除失败: ${res.status}`);
}
