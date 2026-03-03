const BASE_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_BASE_URL || "http://43.98.254.243:8001";

export interface FacultyListItem {
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
  source_id: string;
  group: string;
  data_completeness: number;
  is_potential_recruit: boolean;
  is_advisor_committee: boolean;
  is_adjunct_supervisor: boolean;
  crawled_at: string;
}

export interface FacultyDetail extends FacultyListItem {
  gender: string;
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
  supervised_students: SupervisedStudent[];
  joint_research_projects: JointProject[];
  joint_management_roles: ManagementRole[];
  academic_exchange_records: ExchangeRecord[];
  institute_relation_notes: string;
  relation_updated_by: string;
  relation_updated_at: string;
  recent_updates: FacultyUpdate[];
  representative_publications: PublicationRecord[];
  patents: PatentRecord[];
  awards: AwardRecord[];
  source_url: string;
  first_seen_at: string;
  last_seen_at: string;
  is_active: boolean;
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

export interface FacultyUpdate {
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

export interface FacultyListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: FacultyListItem[];
}

export interface FacultyListFilters {
  university?: string;
  department?: string;
  search?: string;
}

export interface NewFacultyUpdate {
  update_type: string;
  title: string;
  content: string;
  source_url?: string;
  published_at?: string;
  added_by?: string;
}

export interface RelationPatch {
  is_advisor_committee?: boolean;
  is_adjunct_supervisor?: boolean;
  is_potential_recruit?: boolean;
  institute_relation_notes?: string;
  supervised_students?: SupervisedStudent[];
  joint_research_projects?: string[];
  joint_management_roles?: ManagementRole[];
  academic_exchange_records?: ExchangeRecord[];
  relation_updated_by?: string;
}

export interface FacultyDetailPatch {
  name?: string;
  name_en?: string;
  photo_url?: string;
  bio?: string;
  bio_en?: string;
  position?: string;
  department?: string;
  secondary_departments?: string[];
  email?: string;
  phone?: string;
  office?: string;
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

export async function fetchFacultyList(
  page: number = 1,
  pageSize: number = 20,
  filters?: FacultyListFilters,
): Promise<FacultyListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (filters?.university) params.set("university", filters.university);
  if (filters?.department) params.set("department", filters.department);

  const res = await fetch(`${BASE_URL}/api/v1/faculty/?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch faculty list: ${res.status}`);
  return res.json();
}

export async function fetchFacultyDetail(
  urlHash: string,
): Promise<FacultyDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/faculty/${urlHash}`);
  if (!res.ok) throw new Error(`Failed to fetch faculty detail: ${res.status}`);
  return res.json();
}

export async function patchFacultyRelation(
  urlHash: string,
  data: RelationPatch,
): Promise<FacultyDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/faculty/${urlHash}/relation`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update relation: ${res.status}`);
  return res.json();
}

export async function patchFacultyDetail(
  urlHash: string,
  data: FacultyDetailPatch,
): Promise<FacultyDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/faculty/${urlHash}/basic`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error(`Failed to update faculty detail: ${res.status}`);
  return res.json();
}

export async function postFacultyUpdate(
  urlHash: string,
  data: NewFacultyUpdate,
): Promise<FacultyDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/faculty/${urlHash}/updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to post update: ${res.status}`);
  return res.json();
}

export async function deleteFacultyUpdate(
  urlHash: string,
  updateIdx: number,
): Promise<FacultyDetail> {
  const res = await fetch(
    `${BASE_URL}/api/v1/faculty/${urlHash}/updates/${updateIdx}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) throw new Error(`Failed to delete update: ${res.status}`);
  return res.json();
}

export async function patchFacultyAchievements(
  urlHash: string,
  data: AchievementsPatch,
): Promise<FacultyDetail> {
  const res = await fetch(
    `${BASE_URL}/api/v1/faculty/${urlHash}/achievements`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw new Error(`Failed to update achievements: ${res.status}`);
  return res.json();
}
