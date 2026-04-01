import { BASE_URL } from "@/services/scholarApi";
import { ACADEMIC_MONITOR_BASE_URL } from "@/services/apiBase";

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

export interface StudentPaperRecord {
  paper_uid?: string;
  doi?: string | null;
  arxiv_id?: string | null;
  abstract?: string | null;
  publication_date?: string | null;
  source?: string | null;
  authors?: string[];
  affiliations?: string[];
  matched_tokens?: string[];
  assessed_at?: string | null;
  created_at?: string | null;
  id?: string;
  title: string;
  venue?: string;
  year?: string | number;
  compliance_status?: string;
  compliance_note?: string;
  affiliation_status?: string | null;
  compliance_reason?: string | null;
}

export interface AcademicStudentSummary {
  target_key: string;
  name: string;
  target_type: string;
  paper_count: number;
  compliant_count: number;
  non_compliant_count: number;
  unknown_count: number;
}

export interface AcademicStudentsResponse {
  items: AcademicStudentSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AcademicPaperUpsertPayload {
  title: string;
  doi?: string | null;
  arxiv_id?: string | null;
  abstract?: string | null;
  publication_date?: string | null;
  source?: string | null;
  authors?: string[];
  affiliations?: string[];
  affiliation_status?: string | null;
  compliance_reason?: string | null;
  matched_tokens?: string[];
  assessed_at?: string | null;
}

export interface AcademicPaperCompliancePayload {
  affiliation_status?: string | null;
  compliance_reason?: string | null;
  matched_tokens?: string[];
  assessed_at?: string | null;
}

export interface AcademicStudentPapersResponse {
  items: StudentPaperRecord[];
  total: number;
}

const ACADEMIC_V1_BASE = `${ACADEMIC_MONITOR_BASE_URL}/api/v1`;

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

export async function fetchStudentDetail(
  studentId: string,
  signal?: AbortSignal,
): Promise<StudentRecord> {
  const res = await fetch(`${BASE_URL}/api/v1/students/${studentId}`, {
    signal,
  });
  if (!res.ok) throw new Error(`Failed to fetch student detail: ${res.status}`);
  return res.json();
}

export async function fetchStudentPapers(
  studentId: string,
  signal?: AbortSignal,
): Promise<StudentPaperRecord[]> {
  const candidates = [
    `${BASE_URL}/api/v1/students/${studentId}/papers`,
    `${BASE_URL}/api/v1/students/${studentId}/publications`,
  ];

  for (const url of candidates) {
    const res = await fetch(url, { signal });
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`Failed to fetch student papers: ${res.status}`);

    const data = await res.json();
    if (Array.isArray(data)) return data as StudentPaperRecord[];
    if (Array.isArray(data?.items)) return data.items as StudentPaperRecord[];
    return [];
  }

  return [];
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

export async function fetchAcademicStudents(
  keyword?: string,
  page = 1,
  pageSize = 100,
  signal?: AbortSignal,
): Promise<AcademicStudentsResponse> {
  const sp = new URLSearchParams();
  if (keyword?.trim()) sp.set("keyword", keyword.trim());
  sp.set("page", String(page));
  sp.set("page_size", String(pageSize));

  const res = await fetch(
    `${ACADEMIC_V1_BASE}/students?${sp.toString()}`,
    { signal },
  );
  if (!res.ok) throw new Error(`Failed to fetch academic students: ${res.status}`);
  return res.json();
}

export async function fetchAcademicStudentPapers(
  targetKey: string,
  signal?: AbortSignal,
): Promise<AcademicStudentPapersResponse> {
  const res = await fetch(
    `${ACADEMIC_V1_BASE}/students/${encodeURIComponent(targetKey)}/papers`,
    { signal },
  );
  if (!res.ok) throw new Error(`Failed to fetch academic papers: ${res.status}`);
  return res.json();
}

export async function createAcademicPaper(
  targetKey: string,
  payload: AcademicPaperUpsertPayload,
): Promise<{ status: string; paper_uid: string }> {
  const res = await fetch(
    `${ACADEMIC_V1_BASE}/students/${encodeURIComponent(targetKey)}/papers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error(`Failed to create paper: ${res.status}`);
  return res.json();
}

export async function updateAcademicPaper(
  targetKey: string,
  paperUid: string,
  payload: AcademicPaperUpsertPayload,
): Promise<{ status: string; paper_uid: string }> {
  const res = await fetch(
    `${ACADEMIC_V1_BASE}/students/${encodeURIComponent(targetKey)}/papers/${encodeURIComponent(paperUid)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error(`Failed to update paper: ${res.status}`);
  return res.json();
}

export async function updateAcademicPaperCompliance(
  targetKey: string,
  paperUid: string,
  payload: AcademicPaperCompliancePayload,
): Promise<{ status: string; paper_uid: string }> {
  const res = await fetch(
    `${ACADEMIC_V1_BASE}/students/${encodeURIComponent(targetKey)}/papers/${encodeURIComponent(paperUid)}/compliance`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error(`Failed to update compliance: ${res.status}`);
  return res.json();
}

export async function deleteAcademicPaper(
  targetKey: string,
  paperUid: string,
): Promise<void> {
  const res = await fetch(
    `${ACADEMIC_V1_BASE}/students/${encodeURIComponent(targetKey)}/papers/${encodeURIComponent(paperUid)}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(`Failed to delete paper: ${res.status}`);
}
