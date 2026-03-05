import type {
  ProjectListResponse,
  Project,
  ProjectCreateRequest,
  ProjectPatchRequest,
} from "@/types/project";

const BASE_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_BASE_URL || "http://43.98.254.243:8001";

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
  if (search) params.set("search", search);
  if (status && status !== "全部") params.set("status", status);
  const res = await fetch(`${BASE_URL}/api/v1/projects/?${params}`);
  if (!res.ok) throw new Error(`项目列表加载失败: ${res.status}`);
  return res.json();
}

export async function fetchProjectDetail(id: string): Promise<Project> {
  const res = await fetch(`${BASE_URL}/api/v1/projects/${id}`);
  if (!res.ok) throw new Error(`项目详情加载失败: ${res.status}`);
  return res.json();
}

export async function createProject(data: ProjectCreateRequest): Promise<Project> {
  const res = await fetch(`${BASE_URL}/api/v1/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`创建项目失败: ${res.status}`);
  return res.json();
}

export async function patchProject(
  id: string,
  data: ProjectPatchRequest,
): Promise<Project> {
  const res = await fetch(`${BASE_URL}/api/v1/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`更新项目失败: ${res.status}`);
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/projects/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`删除项目失败: ${res.status}`);
}
