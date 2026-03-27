export const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8002"
  : "http://10.1.132.21:8001";

export interface AdjunctSupervisorInfo {
  status: string;
  type: string;
  agreement_type: string;
  agreement_period: string;
  recommender: string;
}

export interface ScholarProjectTag {
  category: string;
  subcategory: string;
  project_id?: string;
  project_title?: string;
}

export interface ScholarEventTag {
  category: string;
  series?: string;
  event_type: string;
  event_id?: string;
  event_title?: string;
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
  project_tags: ScholarProjectTag[];
  event_tags: ScholarEventTag[];
  participated_event_ids: string[];
  is_cobuild_scholar: boolean;
  // Legacy convenience fields for existing UI components
  project_category: string;
  project_subcategory: string;
}

export interface ScholarDetail extends ScholarListItem {
  url: string;
  content: string;
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
  project_category?: string;
  project_subcategory?: string;
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
  project_tags?: ScholarProjectTag[];
  event_tags?: ScholarEventTag[];
  participated_event_ids?: string[];
  is_cobuild_scholar?: boolean;
  // Legacy input compatibility (auto-mapped to project_tags before request)
  project_category?: string;
  project_subcategory?: string;
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

const UNIVERSITY_CACHE_TTL_MS = 30_000;
const scholarUniversityCache = new Map<
  string,
  { expiresAt: number; data: ScholarUniversityItem[] }
>();
const scholarUniversityInFlight = new Map<string, Promise<ScholarUniversityItem[]>>();

function buildUniversityCacheKey(filters?: {
  region?: string;
  affiliation_type?: string;
  is_adjunct_supervisor?: boolean;
}): string {
  return JSON.stringify({
    region: filters?.region ?? "",
    affiliation_type: filters?.affiliation_type ?? "",
    is_adjunct_supervisor: Boolean(filters?.is_adjunct_supervisor),
  });
}

function normalizeProjectTags(raw: unknown): ScholarProjectTag[] {
  if (!Array.isArray(raw)) return [];
  const tags: ScholarProjectTag[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const tag = item as Record<string, unknown>;
    const category = String(tag.category ?? "").trim();
    const subcategory = String(tag.subcategory ?? "").trim();
    if (!category && !subcategory) continue;
    tags.push({
      category,
      subcategory,
      project_id: String(tag.project_id ?? "").trim() || undefined,
      project_title: String(tag.project_title ?? "").trim() || undefined,
    });
  }
  return tags;
}

function normalizeParticipatedEventIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((id) => String(id ?? "").trim()).filter(Boolean);
}

function normalizeEventTags(raw: unknown): ScholarEventTag[] {
  if (!Array.isArray(raw)) return [];
  const tags: ScholarEventTag[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const tag = item as Record<string, unknown>;
    const category = String(tag.category ?? "").trim();
    const eventType = String(tag.event_type ?? "").trim();
    if (!category && !eventType) continue;
    tags.push({
      category,
      event_type: eventType,
      series: String(tag.series ?? "").trim() || undefined,
      event_id: String(tag.event_id ?? "").trim() || undefined,
      event_title: String(tag.event_title ?? "").trim() || undefined,
    });
  }
  return tags;
}

interface ScholarProjectFields {
  project_tags?: unknown;
  event_tags?: unknown;
  participated_event_ids?: unknown;
  is_cobuild_scholar?: boolean;
  project_category?: string;
  project_subcategory?: string;
}

function normalizeScholarProjectFields<T extends ScholarProjectFields>(
  scholar: T,
): T & {
  project_tags: ScholarProjectTag[];
  event_tags: ScholarEventTag[];
  participated_event_ids: string[];
  is_cobuild_scholar: boolean;
  project_category: string;
  project_subcategory: string;
} {
  const projectTags = normalizeProjectTags(scholar.project_tags);
  const eventTags = normalizeEventTags(scholar.event_tags);
  const legacyCategory = String(scholar.project_category ?? "").trim();
  const legacySubcategory = String(scholar.project_subcategory ?? "").trim();
  const mergedTags =
    projectTags.length > 0
      ? projectTags
      : legacyCategory || legacySubcategory
        ? [{ category: legacyCategory, subcategory: legacySubcategory }]
        : [];
  const first = mergedTags[0] ?? { category: "", subcategory: "" };

  return {
    ...scholar,
    project_tags: mergedTags,
    event_tags: eventTags,
    participated_event_ids: normalizeParticipatedEventIds(
      scholar.participated_event_ids,
    ),
    is_cobuild_scholar: Boolean(
      scholar.is_cobuild_scholar ?? (mergedTags.length > 0 || eventTags.length > 0),
    ),
    project_category: first.category,
    project_subcategory: first.subcategory,
  };
}

function buildRelationPayload(data: RelationPatch): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...data };
  const tags = normalizeProjectTags(payload.project_tags);
  const eventTags = normalizeEventTags(payload.event_tags);
  const legacyCategory = String(payload.project_category ?? "").trim();
  const legacySubcategory = String(payload.project_subcategory ?? "").trim();

  if (tags.length > 0) {
    payload.project_tags = tags;
  } else if (legacyCategory || legacySubcategory) {
    payload.project_tags = [
      { category: legacyCategory, subcategory: legacySubcategory },
    ];
  }

  if (eventTags.length > 0) {
    payload.event_tags = eventTags;
  }

  if (payload.is_cobuild_scholar === undefined) {
    const hasProjectTags = Array.isArray(payload.project_tags) && payload.project_tags.length > 0;
    const hasEventTags = Array.isArray(payload.event_tags) && payload.event_tags.length > 0;
    payload.is_cobuild_scholar = hasProjectTags || hasEventTags;
  }

  delete payload.project_category;
  delete payload.project_subcategory;
  return payload;
}

export async function fetchScholarUniversities(filters?: {
  region?: string;
  affiliation_type?: string;
  is_adjunct_supervisor?: boolean;
}): Promise<ScholarUniversityItem[]> {
  const cacheKey = buildUniversityCacheKey(filters);
  const now = Date.now();
  const cached = scholarUniversityCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  const inFlight = scholarUniversityInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const params = new URLSearchParams();
  params.set("view", "hierarchy");
  params.set("entity_type", "organization");
  if (filters?.region) params.set("region", filters.region);
  if (filters?.affiliation_type)
    params.set("org_type", filters.affiliation_type);
  if (filters?.is_adjunct_supervisor)
    params.set("is_adjunct_supervisor", "true");
  const query = params.toString();
  const reqPromise = (async () => {
    const res = await fetch(
      `${BASE_URL}/api/v1/institutions${query ? `?${query}` : ""}`,
    );
    if (!res.ok)
      throw new Error(`Failed to fetch scholar universities: ${res.status}`);
    const data = await res.json();

    // Transform the new API response to match the old format
    // Backend returns: { organizations: [...] }
    const organizations = data.organizations || data.items || [];
    const transformed = organizations.map((inst: any) => ({
      university: inst.name,
      scholar_count: inst.scholar_count || 0,
      departments: (inst.departments || []).map((dept: any) => ({
        name: dept.name,
        scholar_count: dept.scholar_count || 0,
      })),
    }));

    scholarUniversityCache.set(cacheKey, {
      expiresAt: Date.now() + UNIVERSITY_CACHE_TTL_MS,
      data: transformed,
    });
    return transformed;
  })();

  scholarUniversityInFlight.set(cacheKey, reqPromise);
  try {
    return await reqPromise;
  } finally {
    scholarUniversityInFlight.delete(cacheKey);
  }
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
  if (filters?.project_category)
    params.set("project_category", filters.project_category);
  if (filters?.project_subcategory)
    params.set("project_subcategory", filters.project_subcategory);

  const res = await fetch(`${BASE_URL}/api/v1/scholars?${params}`, { signal });
  if (!res.ok) throw new Error(`Failed to fetch scholar list: ${res.status}`);
  const data: ScholarListResponse = await res.json();
  return {
    ...data,
    items: data.items.map((item) => normalizeScholarProjectFields(item)),
  };
}

export async function fetchAllScholars(
  filters?: ScholarListFilters,
  signal?: AbortSignal,
): Promise<ScholarListItem[]> {
  // First, get the first page to know the total count
  const firstPageParams = new URLSearchParams({
    page: "1",
    page_size: "100",
  });
  if (filters?.university)
    firstPageParams.set("university", filters.university);
  if (filters?.department)
    firstPageParams.set("department", filters.department);
  if (filters?.search) firstPageParams.set("keyword", filters.search);
  if (filters?.is_adjunct_supervisor)
    firstPageParams.set("is_adjunct_supervisor", "true");
  if (filters?.institution_group)
    firstPageParams.set("institution_group", filters.institution_group);
  if (filters?.institution_category)
    firstPageParams.set("institution_category", filters.institution_category);
  if (filters?.region) firstPageParams.set("region", filters.region);
  if (filters?.affiliation_type)
    firstPageParams.set("affiliation_type", filters.affiliation_type);
  if (filters?.project_category)
    firstPageParams.set("project_category", filters.project_category);
  if (filters?.project_subcategory)
    firstPageParams.set("project_subcategory", filters.project_subcategory);

  const firstRes = await fetch(
    `${BASE_URL}/api/v1/scholars?${firstPageParams}`,
    { signal },
  );
  if (!firstRes.ok)
    throw new Error(`Failed to fetch all scholars: ${firstRes.status}`);
  const firstDataRaw: ScholarListResponse = await firstRes.json();
  const firstData: ScholarListResponse = {
    ...firstDataRaw,
    items: firstDataRaw.items.map((item) => normalizeScholarProjectFields(item)),
  };

  // If all data fits in first page, return it
  if (firstData.total <= 100) {
    return firstData.items;
  }

  // Otherwise, fetch all pages
  const allScholars: ScholarListItem[] = [...firstData.items];
  const totalPages = firstData.total_pages;

  // Fetch remaining pages in parallel
  const pagePromises: Promise<ScholarListResponse>[] = [];
  for (let page = 2; page <= totalPages; page++) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: "100",
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
    if (filters?.project_category)
      params.set("project_category", filters.project_category);
    if (filters?.project_subcategory)
      params.set("project_subcategory", filters.project_subcategory);

    pagePromises.push(
      fetch(`${BASE_URL}/api/v1/scholars?${params}`, { signal }).then((res) => {
        if (!res.ok)
          throw new Error(`Failed to fetch page ${page}: ${res.status}`);
        return res.json();
      }),
    );
  }

  const pageResults = await Promise.all(pagePromises);
  pageResults.forEach((pageData) => {
    allScholars.push(
      ...pageData.items.map((item) => normalizeScholarProjectFields(item)),
    );
  });

  return allScholars;
}

export async function fetchScholarDetail(
  urlHash: string,
): Promise<ScholarDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/scholars/${urlHash}`);
  if (!res.ok) throw new Error(`Failed to fetch scholar detail: ${res.status}`);
  const data: ScholarDetail = await res.json();
  return normalizeScholarProjectFields(data);
}

export async function patchScholarRelation(
  urlHash: string,
  data: RelationPatch,
): Promise<ScholarDetail> {
  const payload = buildRelationPayload(data);
  const res = await fetch(`${BASE_URL}/api/v1/scholars/${urlHash}/relation`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update relation: ${res.status}`);
  const updated: ScholarDetail = await res.json();
  return normalizeScholarProjectFields(updated);
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
  const updated: ScholarDetail = await res.json();
  return normalizeScholarProjectFields(updated);
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
  const updated: ScholarDetail = await res.json();
  return normalizeScholarProjectFields(updated);
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
  const updated: ScholarDetail = await res.json();
  return normalizeScholarProjectFields(updated);
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
  const updated: ScholarDetail = await res.json();
  return normalizeScholarProjectFields(updated);
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
  project_tags?: ScholarProjectTag[];
  event_tags?: ScholarEventTag[];
  participated_event_ids?: string[];
  is_cobuild_scholar?: boolean;
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
  const created: ScholarDetail = await res.json();
  return normalizeScholarProjectFields(created);
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
