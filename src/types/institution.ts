export interface InstitutionDepartmentListItem {
  name: string;
  scholar_count: number;
  org_name: string;
}

export interface InstitutionListItem {
  id: string;
  name: string;
  scholar_count: number;
  departments: InstitutionDepartmentListItem[];
  org_name: string;
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
  org_name: string;
}

export interface InstitutionDetail {
  id: string;
  name: string;
  type: string | null;
  org_name: string;
  category: string | null;
  priority: string | null;
  student_count_24: number | null;
  student_count_25: number | null;
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
  sources: unknown[];
  last_updated: string | null;
}

export interface InstitutionPatchRequest {
  name?: string;
  category?: string;
  priority?: string;
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
}
