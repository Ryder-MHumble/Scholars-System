import type { ScholarListItem } from "@/services/scholarApi";
import type { StudentRecord } from "@/services/studentApi";

export type TalentSource = "scholar" | "student";
export type TalentScope = "院内" | "国内" | "国际";

export interface TalentLibraryRecord {
  id: string;
  source: TalentSource;
  sourceRecord: ScholarListItem | StudentRecord;
  name: string;
  institution: string;
  title: string;
  directions: string[];
  tags: string[];
  scope: TalentScope;
  searchableText: string;
}

const INTERNAL_INSTITUTION = "北京中关村学院";

function nonEmpty(value: unknown): string {
  return String(value ?? "").trim();
}

function unique(values: Iterable<unknown>): string[] {
  return Array.from(new Set(Array.from(values).map(nonEmpty).filter(Boolean)));
}

function isInternalScholar(scholar: ScholarListItem): boolean {
  const projectText = (scholar.project_tags ?? [])
    .flatMap((tag) => [tag.category, tag.subcategory, tag.project_title])
    .map(nonEmpty)
    .join(" ");
  return Boolean(
    scholar.university?.includes(INTERNAL_INSTITUTION) ||
      scholar.is_cobuild_scholar ||
      scholar.is_advisor_committee ||
      scholar.adjunct_supervisor?.status ||
      projectText.includes(INTERNAL_INSTITUTION),
  );
}

function scholarTags(scholar: ScholarListItem): string[] {
  const projectTags = (scholar.project_tags ?? []).flatMap((tag) => [
    tag.category,
    tag.subcategory,
    tag.project_title,
  ]);
  const eventTags = (scholar.event_tags ?? []).flatMap((tag) => [
    tag.category,
    tag.series,
    tag.event_type,
    tag.event_title,
  ]);
  const relationTags = [
    scholar.is_academician ? "院士" : "",
    scholar.is_potential_recruit ? "潜在人才" : "",
    scholar.is_advisor_committee ? "学术委员会" : "",
    scholar.is_cobuild_scholar ? "共建人才" : "",
    scholar.adjunct_supervisor?.type,
    scholar.adjunct_supervisor?.status ? "导师" : "",
  ];
  return unique([
    ...projectTags,
    ...eventTags,
    ...(scholar.achievement_tags ?? []),
    ...relationTags,
  ]);
}

function studentTags(student: StudentRecord): string[] {
  return unique([
    "学生",
    student.enrollment_year ? `${student.enrollment_year}级` : "",
    student.status,
    student.mentor_name || student.scholar_name,
  ]);
}

export function getScholarScope(scholar: ScholarListItem): TalentScope {
  if (isInternalScholar(scholar)) return "院内";
  return /[\u3400-\u9fff]/.test(nonEmpty(scholar.university)) ? "国内" : "国际";
}

export function mapScholarRecord(scholar: ScholarListItem): TalentLibraryRecord {
  const directions = unique(scholar.research_areas ?? []);
  const tags = scholarTags(scholar);
  return {
    id: `scholar:${scholar.url_hash}`,
    source: "scholar",
    sourceRecord: scholar,
    name: nonEmpty(scholar.name),
    institution: nonEmpty(scholar.university),
    title: nonEmpty(scholar.position) || "待补充",
    directions,
    tags,
    scope: getScholarScope(scholar),
    searchableText: [
      scholar.name,
      scholar.name_en,
      scholar.university,
      scholar.department,
      scholar.position,
      ...directions,
      ...tags,
    ]
      .map(nonEmpty)
      .join(" ")
      .toLowerCase(),
  };
}

export function mapStudentRecord(student: StudentRecord): TalentLibraryRecord {
  const directions = unique([student.major]);
  const tags = studentTags(student);
  return {
    id: `student:${student.id}`,
    source: "student",
    sourceRecord: student,
    name: nonEmpty(student.name),
    institution: nonEmpty(student.home_university),
    title: "学生",
    directions,
    tags,
    scope: "院内",
    searchableText: [
      student.name,
      student.student_no,
      student.home_university,
      student.major,
      student.mentor_name,
      student.scholar_name,
      student.status,
      ...tags,
    ]
      .map(nonEmpty)
      .join(" ")
      .toLowerCase(),
  };
}

export function buildTalentLibraryRecords(
  scholars: ScholarListItem[],
  students: StudentRecord[],
): TalentLibraryRecord[] {
  return [
    ...scholars.map(mapScholarRecord),
    ...students.map(mapStudentRecord),
  ];
}

export function maskTalentName(name: string): string {
  const value = nonEmpty(name);
  if (!value) return "—";
  if (value.length <= 1) return "*";
  return `${value[0]}${"*".repeat(Math.max(2, value.length - (value.length > 6 ? 3 : 1)))}`;
}

export function recordMatchesTag(record: TalentLibraryRecord, value: string): boolean {
  if (!value || value === "全部标签") return true;
  return record.tags.some((tag) => tag === value || tag.startsWith(`${value}/`));
}

