export interface InstitutionDepartmentListItem {
  name: string;
  scholar_count: number;
  org_name?: string | null;
}

// ---------------------------------------------------------------------------
// Institution Tree types (for /api/v1/institutions/scholars/tree)
// ---------------------------------------------------------------------------

export interface InstitutionTreeDepartment {
  name: string;
  scholar_count: number;
}

export interface InstitutionTreeInstitution {
  id: string;
  name: string;
  scholar_count: number;
  departments: InstitutionTreeDepartment[];
}

export interface InstitutionTreeCategory {
  category: string;
  scholar_count: number;
  institutions: InstitutionTreeInstitution[];
}

export interface InstitutionTreeGroup {
  group: string;
  scholar_count: number;
  categories: InstitutionTreeCategory[];
}

export interface InstitutionTreeResponse {
  total_scholar_count: number;
  groups: InstitutionTreeGroup[];
}

export interface InstitutionListItem {
  id: string;
  name: string;
  type?: string | null;
  entity_type?: string | null;
  region?: string | null;
  org_type?: string | null;
  classification: string | null;
  sub_classification: string | null;
  group?: string | null;
  category?: string | null;
  priority: string | null;
  scholar_count: number;
  student_count_total: number | null;
  mentor_count: number | null;
  parent_id: string | null;
  avatar?: string | null;
  departments?: InstitutionDepartmentListItem[];
  org_name?: string | null;
}

export interface InstitutionListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: InstitutionListItem[];
}

export interface PersonInfo {
  name: string;
  title: string | null;
  department: string | null;
  research_area: string | null;
}

export interface LeadershipMember {
  name: string;
  role: string;
  profile_url: string | null;
  avatar_url: string | null;
  bio: string | null;
  intro_lines: string[];
  source_page_url: string | null;
  detail_name_text: string | null;
}

export interface LeadershipDetailResponse {
  source_id: string;
  institution_id: string | null;
  university_name: string;
  source_name: string | null;
  source_url: string | null;
  dimension: string | null;
  group: string | null;
  crawled_at: string | null;
  previous_crawled_at: string | null;
  leader_count: number;
  new_leader_count: number;
  role_counts: Record<string, number>;
  leaders: LeadershipMember[];
  data_hash: string | null;
  change_version: number;
  last_changed_at: string | null;
  updated_at: string | null;
}

export interface DepartmentSource {
  source_id: string;
  source_name: string;
  scholar_count: number;
  is_enabled: boolean;
  last_crawl_at: string | null;
}

export interface InstitutionDepartmentDetail {
  id: string;
  name: string;
  scholar_count: number;
  sources: DepartmentSource[];
  org_name?: string | null;
  parent_id?: string | null;
}

export interface InstitutionDetail {
  id: string;
  name: string;
  type: string | null;
  entity_type?: string | null;
  region?: string | null;
  org_type?: string | null;
  org_name?: string | null;
  avatar?: string | null;
  category: string | null;
  classification: string | null;
  sub_classification?: string | null;
  priority: string | null;
  student_count_24: number | null;
  student_count_25: number | null;
  student_counts_by_year?: Record<string, number>;
  student_count_total: number | null;
  mentor_count: number | null;
  resident_leaders: string[];
  degree_committee: string[];
  teaching_committee: string[];
  mentor_info: PersonInfo | null;
  university_leaders: PersonInfo[];
  notable_scholars: PersonInfo[];
  key_departments: string[];
  joint_labs: string[];
  training_cooperation: string[];
  academic_cooperation: string[];
  talent_dual_appointment: string[];
  recruitment_events: string[];
  visit_exchanges: string[];
  cooperation_focus: string[];
  parent_id: string | null;
  departments: InstitutionDepartmentDetail[];
  scholar_count: number;
  custom_fields?: Record<string, string>;
  sources: unknown[];
  last_updated: string | null;
}

export interface DepartmentPatchRequest {
  id?: string;
  name: string;
  org_name?: string | null;
}

export interface InstitutionPatchRequest {
  name?: string;
  org_name?: string | null;
  avatar?: string | null;
  entity_type?: "organization" | "department";
  parent_id?: string | null;
  region?: string | null;
  org_type?: string | null;
  category?: string;
  classification?: string | null;
  sub_classification?: string | null;
  priority?: string | null;
  student_count_24?: number | null;
  student_count_25?: number | null;
  mentor_count?: number | null;
  resident_leaders?: string[];
  degree_committee?: string[];
  teaching_committee?: string[];
  university_leaders?: PersonInfo[];
  notable_scholars?: PersonInfo[];
  key_departments?: string[];
  joint_labs?: string[];
  training_cooperation?: string[];
  academic_cooperation?: string[];
  talent_dual_appointment?: string[];
  recruitment_events?: string[];
  visit_exchanges?: string[];
  cooperation_focus?: string[];
  departments?: DepartmentPatchRequest[];
  custom_fields?: Record<string, string | null>;
}
