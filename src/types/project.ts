export interface RelatedScholar {
  name: string;
  role: string;
  institution: string;
  scholar_id?: string;
  photo_url?: string;
  title?: string;
  department?: string;
}

export interface ProjectOutput {
  type: string;
  title: string;
  year: number;
  authors: string[];
  venue: string;
  url?: string;
}

export interface Project {
  id: string;
  // Canonical backend fields (tag model)
  category: string;
  subcategory: string;
  title: string;
  summary: string;
  scholar_ids: string[];
  custom_fields?: Record<string, string>;

  // Legacy UI fields (mapped from canonical fields for compatibility)
  name: string;
  pi_name: string;
  pi_institution: string;
  funder: string;
  funding_amount?: number;
  start_year: number;
  end_year?: number;
  status: string;
  description?: string;
  keywords: string[];
  tags: string[];
  related_scholars: RelatedScholar[];
  cooperation_institutions: string[];
  outputs: ProjectOutput[];
  extra?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectListItem {
  id: string;
  // Canonical backend fields
  category: string;
  subcategory: string;
  title: string;
  summary: string;
  scholar_ids: string[];
  scholar_count?: number;

  // Legacy UI fields
  name: string;
  pi_name: string;
  pi_institution: string;
  funder: string;
  funding_amount?: number;
  start_year: number;
  end_year?: number;
  status: string;
  description?: string;
  keywords: string[];
  tags: string[];
  related_scholars: RelatedScholar[];
}

export interface ProjectListResponse {
  items: ProjectListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProjectCreateRequest {
  // Canonical backend fields
  category: string;
  subcategory?: string;
  title?: string;
  summary?: string;
  scholar_ids?: string[];
  custom_fields?: Record<string, string>;

  // Legacy UI fields
  name: string;
  pi_name: string;
  pi_institution: string;
  funder: string;
  funding_amount?: number;
  start_year: number;
  end_year?: number;
  status: string;
  description?: string;
  keywords?: string[];
  tags?: string[];
  related_scholars?: RelatedScholar[];
  cooperation_institutions?: string[];
  outputs?: ProjectOutput[];
  extra?: Record<string, unknown>;
}

export type ProjectPatchRequest = Partial<ProjectCreateRequest>;
