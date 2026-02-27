export interface University {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  location: string;
  website?: string;
  departments: Department[];
}

export interface Department {
  id: string;
  universityId: string;
  name: string;
  scholarCount: number;
  description?: string;
  website?: string;
}

export interface InstitutionTreeNode {
  id: string;
  label: string;
  type: 'university' | 'department';
  children?: InstitutionTreeNode[];
  scholarCount: number;
  isExpanded?: boolean;
}
