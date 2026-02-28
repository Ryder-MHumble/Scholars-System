export type AcademicTitle =
  | "教授"
  | "副教授"
  | "助理教授"
  | "讲师"
  | "研究员"
  | "副研究员"
  | "助理研究员"
  | "博士后";

export type AcademicHonor =
  | "中国科学院院士"
  | "中国工程院院士"
  | "国家杰出青年科学基金获得者"
  | "国家优秀青年科学基金获得者"
  | "长江学者特聘教授"
  | "长江学者青年学者"
  | "万人计划领军人才"
  | "IEEE Fellow"
  | "ACM Fellow";

export type ResearchField = string;

export interface Education {
  degree: string; // "博士" | "硕士" | "学士"
  institution: string;
  major?: string;
  year: number;
  endYear?: number;
}

export interface Experience {
  position: string;
  institution: string;
  startYear: number;
  endYear?: number; // null = current position
  description?: string;
}

export type AwardCategory = "gold" | "silver" | "bronze";

export interface DetailedAward {
  name: string;
  year: number;
  category: AwardCategory;
  issuer?: string;
  description?: string;
}

export interface Scholar {
  id: string;
  name: string;
  nameEn?: string;
  avatarUrl?: string;
  title: AcademicTitle;
  universityId: string;
  departmentId: string;
  email?: string;
  phone?: string;
  homepage?: string;
  googleScholar?: string;
  dblp?: string;
  researchFields: ResearchField[];
  honors: AcademicHonor[];
  bio?: string;
  hIndex?: number;
  citationCount?: number;
  paperCount?: number;
  createdAt: string;
  updatedAt: string;
  // Enhanced profile fields
  verified?: boolean;
  claimed?: boolean;
  profileViews?: number;
  profileImageUrl?: string;
  education?: Education[];
  experience?: Experience[];
  detailedAwards?: DetailedAward[];
}

export interface ScholarWithInstitution extends Scholar {
  universityName: string;
  departmentName: string;
}

export type RelationshipType = "导师" | "学生" | "合作者" | "同事";

export interface ScholarRelationship {
  id: string;
  fromScholarId: string;
  toScholarId: string;
  type: RelationshipType;
  description?: string;
}
