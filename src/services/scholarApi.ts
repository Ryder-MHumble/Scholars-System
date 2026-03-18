const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8002"
  : "http://43.98.254.243:8001";

export interface AdjunctSupervisorInfo {
  status: string;
  type: string;
  agreement_type: string;
  agreement_period: string;
  recommender: string;
}

export interface ScholarListItem {
  url_hash: string;
  name: string;
  name_en: string;
  photo_url: string;
  university: string;
  department: string;
  position: string;
  academic_titles: string[];
  is_academician: boolean;
  research_areas: string[];
  email: string;
  profile_url: string;
  is_potential_recruit: boolean;
  is_advisor_committee: boolean;
  adjunct_supervisor: AdjunctSupervisorInfo;
}

export interface ScholarDetail extends ScholarListItem {
  url: string;
  content: string;
  tags: string[];
  gender: string;
  keywords: string[];
  secondary_departments: string[];
  bio: string;
  bio_en: string;
  phone: string;
  office: string;
  lab_url: string;
  google_scholar_url: string;
  dblp_url: string;
  orcid: string;
  phd_institution: string;
  phd_year: string;
  education: EducationRecord[];
  publications_count: number;
  h_index: number;
  citations_count: number;
  metrics_updated_at: string;
  supervised_students: string[];
  supervised_students_count: number;
  joint_research_projects: JointProject[];
  joint_management_roles: string[];
  academic_exchange_records: string[];
  institute_relation_notes: string;
  relation_updated_by: string;
  relation_updated_at: string;
  recent_updates: ScholarUpdate[];
  representative_publications: PublicationRecord[];
  patents: PatentRecord[];
  awards: AwardRecord[];
}

export interface EducationRecord {
  degree?: string;
  institution?: string;
  major?: string;
  year?: number | string;
  end_year?: number | string;
}

export interface SupervisedStudent {
  name?: string;
  degree?: string;
  start_year?: number | string;
  end_year?: number | string;
  current_position?: string;
}

export interface JointProject {
  title?: string;
  year?: number | string;
  description?: string;
}

export interface ManagementRole {
  role?: string;
  organization?: string;
  start_year?: number | string;
  end_year?: number | string;
}

export interface ExchangeRecord {
  date?: string;
  type?: string;
  title?: string;
  description?: string;
  organization?: string;
}

export interface ScholarUpdate {
  update_type?: string;
  title?: string;
  content?: string;
  source_url?: string;
  published_at?: string;
  added_by?: string;
  created_at?: string;
}

export interface PublicationRecord {
  title?: string;
  venue?: string;
  year?: string;
  authors?: string;
  url?: string;
  citation_count?: number;
  is_corresponding?: boolean;
  added_by?: string;
}

export interface PatentRecord {
  title?: string;
  patent_no?: string;
  year?: string;
  inventors?: string;
  patent_type?: string;
  status?: string;
  added_by?: string;
}

export interface AwardRecord {
  title?: string;
  year?: string;
  level?: string;
  grantor?: string;
  description?: string;
  added_by?: string;
}

export interface ScholarListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: ScholarListItem[];
}

export interface ScholarListFilters {
  university?: string;
  department?: string;
  search?: string;
  is_adjunct_supervisor?: boolean;
  institution_group?: string;
  institution_category?: string;
  region?: string;
  affiliation_type?: string;
}

export interface NewScholarUpdate {
  update_type: string;
  title: string;
  content: string;
  source_url?: string;
  published_at?: string;
  added_by?: string;
}

export interface RelationPatch {
  is_advisor_committee?: boolean;
  adjunct_supervisor?: AdjunctSupervisorInfo;
  is_potential_recruit?: boolean;
  institute_relation_notes?: string;
  supervised_students?: string[];
  joint_research_projects?: string[];
  joint_management_roles?: string[];
  academic_exchange_records?: string[];
  tags?: string[];
  relation_updated_by?: string;
}

export interface ScholarDetailPatch {
  name?: string;
  name_en?: string;
  photo_url?: string;
  university?: string;
  department?: string;
  secondary_departments?: string[];
  position?: string;
  bio?: string;
  bio_en?: string;
  email?: string;
  phone?: string;
  office?: string;
  profile_url?: string;
  lab_url?: string;
  google_scholar_url?: string;
  dblp_url?: string;
  orcid?: string;
  phd_institution?: string;
  phd_year?: string;
  research_areas?: string[];
  institute_relation_notes?: string;
  education?: EducationRecord[];
}

export interface AchievementsPatch {
  representative_publications?: PublicationRecord[];
  patents?: PatentRecord[];
  awards?: AwardRecord[];
  updated_by?: string;
}

export interface StudentRecord {
  id: string;
  student_no: string;
  name: string;
  home_university: string;
  degree_type: string;
  enrollment_year: string;
  expected_graduation_year: string;
  status: string;
  email: string;
  phone: string;
  notes: string;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface StudentListResponse {
  total: number;
  scholar_url_hash: string;
  items: StudentRecord[];
}

export interface StudentCreate {
  name: string;
  student_no?: string;
  home_university?: string;
  degree_type?: string;
  enrollment_year?: string;
  expected_graduation_year?: string;
  status?: string;
  email?: string;
  phone?: string;
  notes?: string;
  added_by?: string;
}

export interface StudentPatch {
  name?: string;
  student_no?: string;
  home_university?: string;
  degree_type?: string;
  enrollment_year?: string;
  expected_graduation_year?: string;
  status?: string;
  email?: string;
  phone?: string;
  notes?: string;
  updated_by?: string;
}

export interface ScholarUniversityItem {
  university: string;
  scholar_count: number;
  departments: { name: string; scholar_count: number }[];
}

export async function fetchScholarUniversities(filters?: {
  region?: string;
  affiliation_type?: string;
  is_adjunct_supervisor?: boolean;
}): Promise<ScholarUniversityItem[]> {
  const params = new URLSearchParams();
  params.set("view", "hierarchy");
  params.set("entity_type", "organization");
  if (filters?.region) params.set("region", filters.region);
  if (filters?.affiliation_type)
    params.set("org_type", filters.affiliation_type);
  if (filters?.is_adjunct_supervisor)
    params.set("is_adjunct_supervisor", "true");
  const query = params.toString();
  const res = await fetch(
    `${BASE_URL}/api/v1/institutions${query ? `?${query}` : ""}`,
  );
  if (!res.ok)
    throw new Error(`Failed to fetch scholar universities: ${res.status}`);
  const data = await res.json();

  // Transform the new API response to match the old format
  // Backend returns: { organizations: [...] }
  const organizations = data.organizations || data.items || [];
  return organizations.map((inst: any) => ({
    university: inst.name,
    scholar_count: inst.scholar_count || 0,
    departments: (inst.departments || []).map((dept: any) => ({
      name: dept.name,
      scholar_count: dept.scholar_count || 0,
    })),
  }));
}

export async function fetchScholarList(
  page: number = 1,
  pageSize: number = 20,
  filters?: ScholarListFilters,
  signal?: AbortSignal,
): Promise<ScholarListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (filters?.university) params.set("university", filters.university);
  if (filters?.department) params.set("department", filters.department);
  if (filters?.search) params.set("keyword", filters.search);
  if (filters?.is_adjunct_supervisor)
    params.set("is_adjunct_supervisor", "true");
  if (filters?.institution_group)
    params.set("institution_group", filters.institution_group);
  if (filters?.institution_category)
    params.set("institution_category", filters.institution_category);
  if (filters?.region) params.set("region", filters.region);
  if (filters?.affiliation_type)
    params.set("affiliation_type", filters.affiliation_type);

  const res = await fetch(`${BASE_URL}/api/v1/scholars?${params}`, { signal });
  if (!res.ok) throw new Error(`Failed to fetch scholar list: ${res.status}`);
  return res.json();
}

export async function fetchScholarDetail(
  urlHash: string,
): Promise<ScholarDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/scholars/${urlHash}`);
  if (!res.ok) throw new Error(`Failed to fetch scholar detail: ${res.status}`);
  return res.json();
}

export async function patchScholarRelation(
  urlHash: string,
  data: RelationPatch,
): Promise<ScholarDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/scholars/${urlHash}/relation`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update relation: ${res.status}`);
  return res.json();
}

export async function patchScholarDetail(
  urlHash: string,
  data: ScholarDetailPatch,
): Promise<ScholarDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/scholars/${urlHash}/basic`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error(`Failed to update scholar detail: ${res.status}`);
  return res.json();
}

export async function postScholarUpdate(
  urlHash: string,
  data: NewScholarUpdate,
): Promise<ScholarDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/scholars/${urlHash}/updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to post update: ${res.status}`);
  return res.json();
}

export async function deleteScholarUpdate(
  urlHash: string,
  updateIdx: number,
): Promise<ScholarDetail> {
  const res = await fetch(
    `${BASE_URL}/api/v1/scholars/${urlHash}/updates/${updateIdx}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) throw new Error(`Failed to delete update: ${res.status}`);
  return res.json();
}

export async function patchScholarAchievements(
  urlHash: string,
  data: AchievementsPatch,
): Promise<ScholarDetail> {
  const res = await fetch(
    `${BASE_URL}/api/v1/scholars/${urlHash}/achievements`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw new Error(`Failed to update achievements: ${res.status}`);
  return res.json();
}

export async function fetchStudents(
  urlHash: string,
): Promise<StudentListResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/scholars/${urlHash}/students`);
  if (!res.ok) throw new Error(`Failed to fetch students: ${res.status}`);
  return res.json();
}

export async function createStudent(
  urlHash: string,
  data: StudentCreate,
): Promise<StudentRecord> {
  const res = await fetch(`${BASE_URL}/api/v1/scholars/${urlHash}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create student: ${res.status}`);
  return res.json();
}

export async function patchStudent(
  urlHash: string,
  studentId: string,
  data: StudentPatch,
): Promise<StudentRecord> {
  const res = await fetch(
    `${BASE_URL}/api/v1/scholars/${urlHash}/students/${studentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw new Error(`Failed to update student: ${res.status}`);
  return res.json();
}

export async function deleteStudent(
  urlHash: string,
  studentId: string,
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/v1/scholars/${urlHash}/students/${studentId}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) throw new Error(`Failed to delete student: ${res.status}`);
}

export async function deleteScholar(urlHash: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/scholars/${urlHash}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete scholar: ${res.status}`);
}

export interface ScholarCreate {
  name: string;
  name_en?: string;
  gender?: string;
  photo_url?: string;
  university?: string;
  department?: string;
  secondary_departments?: string[];
  position?: string;
  academic_titles?: string[];
  is_academician?: boolean;
  research_areas?: string[];
  keywords?: string[];
  bio?: string;
  bio_en?: string;
  email?: string;
  phone?: string;
  office?: string;
  profile_url?: string;
  lab_url?: string;
  google_scholar_url?: string;
  dblp_url?: string;
  orcid?: string;
  phd_institution?: string;
  phd_year?: string;
  education?: EducationRecord[];
  added_by?: string;
}

export interface BatchScholarCreate {
  name: string;
  name_en?: string;
  position?: string;
  university?: string;
  department?: string;
  email?: string;
  phone?: string;
  profile_url?: string;
  research_areas?: string[];
  bio?: string;
}

export interface BatchScholarCreateResponse {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export async function createScholar(
  data: ScholarCreate,
): Promise<ScholarDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/scholars`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create scholar: ${res.status}`);
  return res.json();
}

export async function batchCreateScholars(
  scholars: BatchScholarCreate[],
): Promise<BatchScholarCreateResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/scholars/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scholars }),
  });
  if (!res.ok)
    throw new Error(`Failed to batch create scholars: ${res.status}`);
  return res.json();
}

export interface ScholarStatsResponse {
  total: number;
  academicians: number;
  potential_recruits: number;
  advisor_committee: number;
  adjunct_supervisors: number;
  by_university: Array<{ university: string; count: number }>;
  by_department: Array<{
    university: string;
    department: string;
    count: number;
  }>;
  by_position: Array<{ position: string; count: number }>;
}

export async function fetchScholarStats(): Promise<ScholarStatsResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/scholars/stats`);
  if (!res.ok) throw new Error(`Failed to fetch scholar stats: ${res.status}`);
  return res.json();
}

export interface UniversityOption {
  university: string;
  departments: string[];
}

export async function fetchUniversities(): Promise<UniversityOption[]> {
  // Use stats endpoint to get universities and departments
  const stats = await fetchScholarStats();
  const universityMap = new Map<string, Set<string>>();

  // Build university -> departments mapping
  stats.by_department.forEach((item) => {
    if (!universityMap.has(item.university)) {
      universityMap.set(item.university, new Set());
    }
    universityMap.get(item.university)!.add(item.department);
  });

  // Convert to UniversityOption array
  return Array.from(universityMap.entries())
    .map(([university, departments]) => ({
      university,
      departments: Array.from(departments).sort(),
    }))
    .sort((a, b) => a.university.localeCompare(b.university));
}
