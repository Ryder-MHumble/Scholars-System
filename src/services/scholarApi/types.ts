// Scholar-related type definitions
// Extracted from original scholarApi.ts

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

export interface ProfileLinks {
  homepage: string;
  lab: string;
  github: string;
  linkedin: string;
  google_scholar: string;
  orcid: string;
  dblp: string;
  x: string;
  openreview: string;
  aminer: string;
  other: string[];
}

export interface CoauthorInfo {
  aminer_id: string;
  name: string;
  name_zh: string;
  h_index: number | null;
  n_citation: number | null;
  n_pubs: number | null;
  avatar: string;
  position: string;
  affiliation: string;
  affiliation_zh: string;
  weight: number;
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
  profile_links: ProfileLinks;
  profile_url: string;
  is_potential_recruit: boolean;
  is_advisor_committee: boolean;
  adjunct_supervisor: AdjunctSupervisorInfo;
  project_tags: ScholarProjectTag[];
  event_tags: ScholarEventTag[];
  participated_event_ids: string[];
  is_cobuild_scholar: boolean;
  custom_fields?: Record<string, unknown>;
  achievement_tags?: string[];
  representative_publications?: PublicationRecord[];
  patents?: PatentRecord[];
  awards?: AwardRecord[];
  coauthors?: CoauthorInfo[];
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
  linkedin_url: string;
  github_url: string;
  x_url: string;
  openreview_url: string;
  aminer_url: string;
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
  joint_management_roles: ManagementRole[];
  academic_positions: AcademicPositionRecord[];
  academic_exchange_records: ExchangeRecord[];
  institute_relation_notes: string;
  relation_updated_by: string;
  relation_updated_at: string;
  recent_updates: ScholarUpdate[];
  news: ScholarNewsRecord[];
  research_projects: ResearchProjectRecord[];
  open_source_projects: OpenSourceProjectRecord[];
  representative_publications: PublicationRecord[];
  patents: PatentRecord[];
  awards: AwardRecord[];
  coauthors?: CoauthorInfo[];
  custom_fields?: Record<string, unknown>;
}

export interface EducationRecord {
  degree?: string;
  institution?: string;
  department?: string;
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

/** Normalized employment/appointment history from scholar_academic_positions. */
export interface AcademicPositionRecord {
  id?: string;
  scholar_id?: string;
  organization: string;
  department?: string | null;
  title: string;
  position_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean;
  description?: string | null;
  source_url?: string | null;
  source_type?: string | null;
  source_record_id?: string | null;
  evidence?: Record<string, unknown>;
  added_by?: string;
}

export interface ScholarNewsRecord {
  id?: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  news_type?: string | null;
  published_at?: string | null;
  source_url?: string | null;
  source_type?: string | null;
  source_record_id?: string | null;
  review_status?: string;
}

export interface ResearchProjectRecord {
  id?: string;
  name: string;
  role?: string | null;
  organization?: string | null;
  project_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  description?: string | null;
}

export interface OpenSourceProjectRecord {
  id?: string;
  name: string;
  repository_url?: string | null;
  homepage_url?: string | null;
  platform?: string | null;
  role?: string | null;
  stars?: number | null;
  forks?: number | null;
  status?: string | null;
  description?: string | null;
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
  affiliations?: unknown[];
  url?: string;
  doi?: string;
  abstract?: string;
  publication_date?: string;
  project_group_name?: string;
  source_type?: string;
  citation_count?: number;
  is_corresponding?: boolean;
  is_first_author?: boolean;
  achievement_tags?: string[];
  academic_division?: string;
  match_confidence?: string;
  match_method?: string;
  source_sheet?: string;
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

export interface FetchAllScholarsOptions {
  signal?: AbortSignal;
  maxRecords?: number;
}

export interface ScholarListFilters {
  university?: string;
  department?: string;
  search?: string;
  participated_event_id?: string;
  is_chinese?: boolean;
  is_current_student?: boolean;
  chinese_identity?: "unknown";
  achievement_tag?: string;
  achievement_tags?: string[];
  is_adjunct_supervisor?: boolean;
  is_cobuild_scholar?: boolean;
  institution_group?: string;
  institution_category?: string;
  region?: string;
  affiliation_type?: string;
  project_category?: string;
  project_subcategory?: string;
  project_categories?: string[];
  project_subcategories?: string[];
  event_types?: string[];
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
  joint_research_projects?: JointProject[];
  joint_management_roles?: ManagementRole[];
  academic_exchange_records?: ExchangeRecord[];
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
  academic_titles?: string[];
  is_academician?: boolean;
  custom_fields?: Record<string, unknown>;
  bio?: string;
  bio_en?: string;
  email?: string;
  phone?: string;
  office?: string;
  profile_links?: ProfileLinks;
  profile_url?: string;
  lab_url?: string;
  google_scholar_url?: string;
  dblp_url?: string;
  orcid?: string;
  linkedin_url?: string;
  github_url?: string;
  x_url?: string;
  openreview_url?: string;
  aminer_url?: string;
  phd_institution?: string;
  phd_year?: string;
  research_areas?: string[];
  institute_relation_notes?: string;
  education?: EducationRecord[];
  publications_count?: number;
  h_index?: number;
  citations_count?: number;
}

export interface AchievementsPatch {
  representative_publications?: PublicationRecord[];
  patents?: PatentRecord[];
  awards?: AwardRecord[];
  h_index?: number;
  citations_count?: number;
  publications_count?: number;
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
  institution_id?: string;
  university: string;
  region?: string | null;
  org_type?: string | null;
  scholar_count: number;
  department_count?: number;
  departments: { id?: string; name: string; scholar_count: number }[];
}

export interface BackendInstitutionDepartment {
  id?: string;
  name?: string;
  scholar_count?: number;
}

export interface BackendInstitutionItem {
  id?: string;
  name?: string;
  region?: string | null;
  org_type?: string | null;
  scholar_count?: number;
  department_count?: number;
  departments?: BackendInstitutionDepartment[];
}

export interface BackendInstitutionHierarchyResponse {
  organizations?: BackendInstitutionItem[];
  items?: BackendInstitutionItem[];
}

export interface BackendInstitutionDepartmentsResponse {
  institution_id?: string;
  departments?: BackendInstitutionDepartment[];
}

export interface ScholarProjectFields {
  project_tags?: unknown;
  event_tags?: unknown;
  participated_event_ids?: unknown;
  is_cobuild_scholar?: boolean;
  project_category?: string;
  project_subcategory?: string;
  profile_links?: unknown;
  profile_url?: unknown;
  lab_url?: unknown;
  google_scholar_url?: unknown;
  dblp_url?: unknown;
  orcid?: unknown;
  linkedin_url?: unknown;
  github_url?: unknown;
  x_url?: unknown;
  openreview_url?: unknown;
  aminer_url?: unknown;
  coauthors?: unknown;
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
  profile_links?: ProfileLinks;
  profile_url?: string;
  lab_url?: string;
  google_scholar_url?: string;
  dblp_url?: string;
  orcid?: string;
  phd_institution?: string;
  phd_year?: string;
  education?: EducationRecord[];
  is_advisor_committee?: boolean;
  adjunct_supervisor?: AdjunctSupervisorInfo;
  is_potential_recruit?: boolean;
  institute_relation_notes?: string;
  supervised_students?: string[];
  joint_research_projects?: JointProject[];
  joint_management_roles?: ManagementRole[];
  academic_exchange_records?: ExchangeRecord[];
  representative_publications?: PublicationRecord[];
  patents?: PatentRecord[];
  awards?: AwardRecord[];
  coauthors?: CoauthorInfo[];
  publications_count?: number;
  h_index?: number;
  citations_count?: number;
  project_tags?: ScholarProjectTag[];
  event_tags?: ScholarEventTag[];
  participated_event_ids?: string[];
  is_cobuild_scholar?: boolean;
  project_category?: string;
  project_subcategory?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
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

export interface UniversityOption {
  university: string;
  departments: string[];
}
