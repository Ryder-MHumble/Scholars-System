import { BASE_URL } from "@/services/scholarApi";

export interface StudentRecord {
  id: string;
  scholar_id: string;
  scholar_name: string;
  student_no: string;
  name: string;
  home_university: string;
  major: string;
  degree_type: string;
  enrollment_year: string;
  expected_graduation_year: string;
  status: string;
  email: string;
  phone: string;
  notes: string;
  mentor_name: string;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface StudentListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: StudentRecord[];
}

export interface StudentCreatePayload {
  scholar_id?: string;
  mentor_name?: string;
  student_no?: string;
  name: string;
  home_university?: string;
  major?: string;
  degree_type?: string;
  enrollment_year?: string;
  expected_graduation_year?: string;
  status?: string;
  email?: string;
  phone?: string;
  notes?: string;
  added_by?: string;
}

export interface StudentUpdatePayload {
  scholar_id?: string;
  mentor_name?: string;
  student_no?: string;
  name?: string;
  home_university?: string;
  major?: string;
  degree_type?: string;
  enrollment_year?: string;
  expected_graduation_year?: string;
  status?: string;
  email?: string;
  phone?: string;
  notes?: string;
  updated_by?: string;
}

export interface StudentListFilters {
  enrollment_year?: string;
  home_university?: string;
  mentor_name?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}

export interface StudentFilterOptions {
  grades: string[];
  universities: string[];
  mentors: string[];
}

export async function fetchStudentList(
  filters: StudentListFilters = {},
  signal?: AbortSignal,
): Promise<StudentListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(filters.page ?? 1));
  params.set("page_size", String(filters.page_size ?? 200));
  if (filters.enrollment_year)
    params.set("enrollment_year", filters.enrollment_year);
  if (filters.home_university)
    params.set("home_university", filters.home_university);
  if (filters.mentor_name) params.set("mentor_name", filters.mentor_name);
  if (filters.keyword) params.set("keyword", filters.keyword);

  const res = await fetch(`${BASE_URL}/api/v1/students?${params.toString()}`, {
    signal,
  });
  if (!res.ok) throw new Error(`Failed to fetch students: ${res.status}`);
  return res.json();
}

export async function fetchStudentListAll(
  filters: StudentListFilters = {},
  signal?: AbortSignal,
): Promise<StudentRecord[]> {
  const pageSize = Math.max(1, Math.min(filters.page_size ?? 500, 500));
  const firstPage = await fetchStudentList(
    {
      ...filters,
      page: 1,
      page_size: pageSize,
    },
    signal,
  );

  const items = [...(firstPage.items ?? [])];
  const totalPages = Math.max(firstPage.total_pages || 1, 1);
  if (totalPages <= 1) return items;

  for (let page = 2; page <= totalPages; page += 1) {
    if (signal?.aborted) break;
    const nextPage = await fetchStudentList(
      {
        ...filters,
        page,
        page_size: pageSize,
      },
      signal,
    );
    items.push(...(nextPage.items ?? []));
  }

  return items;
}

export async function fetchStudentOptions(
  enrollmentYear?: string,
): Promise<StudentFilterOptions> {
  const params = new URLSearchParams();
  if (enrollmentYear) params.set("enrollment_year", enrollmentYear);
  const query = params.toString();
  const res = await fetch(
    `${BASE_URL}/api/v1/students/options${query ? `?${query}` : ""}`,
  );
  if (!res.ok)
    throw new Error(`Failed to fetch student options: ${res.status}`);
  return res.json();
}

export async function createStudent(
  payload: StudentCreatePayload,
): Promise<StudentRecord> {
  const res = await fetch(`${BASE_URL}/api/v1/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create student: ${res.status}`);
  return res.json();
}

export async function patchStudent(
  studentId: string,
  payload: StudentUpdatePayload,
): Promise<StudentRecord> {
  const res = await fetch(`${BASE_URL}/api/v1/students/${studentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update student: ${res.status}`);
  return res.json();
}

export async function deleteStudent(studentId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/students/${studentId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete student: ${res.status}`);
}
