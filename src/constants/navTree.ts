import {
  Building2,
  Users,
  FolderKanban,
  Calendar,
  BookOpen,
  GraduationCap,
} from "lucide-react";

export type TabId =
  | "institutions"
  | "scholars"
  | "students"
  | "projects"
  | "activities"
  | "venues";

export interface NavNode {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  tab: TabId;
  subtab?: string;
  children?: NavNode[];
}

export const NAV_TREE: NavNode[] = [
  {
    id: "institutions",
    label: "机构-Institution",
    icon: Building2,
    tab: "institutions",
    children: [
      {
        id: "uni_group",
        label: "高校",
        tab: "institutions",
        subtab: "universities",
        children: [
          { id: "joint_uni", label: "共建高校", tab: "institutions", subtab: "joint_universities" },
          { id: "sister_uni", label: "兄弟院校", tab: "institutions", subtab: "sister_universities" },
          { id: "overseas_uni", label: "海外高校", tab: "institutions", subtab: "overseas_universities" },
          { id: "other_uni", label: "其他高校", tab: "institutions", subtab: "other_universities" },
        ],
      },
      { id: "research_inst", label: "科研院所", tab: "institutions", subtab: "research_institutes" },
      { id: "industry_assoc", label: "行业学会", tab: "institutions", subtab: "industry_associations" },
    ],
  },
  {
    id: "scholars",
    label: "学者-Scholar",
    icon: Users,
    tab: "scholars",
    children: [
      {
        id: "domestic",
        label: "国内",
        tab: "scholars",
        subtab: "domestic",
        children: [
          { id: "dom_uni", label: "高校", tab: "scholars", subtab: "domestic_university" },
          { id: "dom_company", label: "企业", tab: "scholars", subtab: "domestic_company" },
          { id: "dom_research", label: "研究机构", tab: "scholars", subtab: "domestic_research" },
          { id: "dom_other", label: "其他", tab: "scholars", subtab: "domestic_other" },
        ],
      },
      {
        id: "international",
        label: "国际",
        tab: "scholars",
        subtab: "international",
        children: [
          { id: "intl_uni", label: "高校", tab: "scholars", subtab: "intl_university" },
          { id: "intl_company", label: "企业", tab: "scholars", subtab: "intl_company" },
          { id: "intl_research", label: "研究机构", tab: "scholars", subtab: "intl_research" },
          { id: "intl_other", label: "其他", tab: "scholars", subtab: "intl_other" },
        ],
      },
    ],
  },
  {
    id: "students",
    label: "学生-Student",
    icon: GraduationCap,
    tab: "students",
    children: [
      { id: "student_all", label: "全部学生", tab: "students", subtab: "student_all" },
      { id: "student_2024", label: "2024级", tab: "students", subtab: "student_grade_2024" },
      { id: "student_2025", label: "2025级", tab: "students", subtab: "student_grade_2025" },
      { id: "student_2026", label: "2026级", tab: "students", subtab: "student_grade_2026" },
    ],
  },
  {
    id: "projects",
    label: "项目-Program",
    icon: FolderKanban,
    tab: "projects",
    children: [
      {
        id: "proj_edu",
        label: "教育培养",
        tab: "projects",
        subtab: "education",
        children: [
          { id: "sci_edu_comm", label: "科技教育委员会", tab: "projects", subtab: "sci_edu_committee" },
          { id: "acad_comm", label: "学术委员会", tab: "projects", subtab: "academic_committee" },
          { id: "teach_comm", label: "教学委员会", tab: "projects", subtab: "teaching_committee" },
          { id: "student_mentor", label: "学院学生高校导师", tab: "projects", subtab: "student_mentor" },
          { id: "parttime_mentor", label: "兼职导师", tab: "projects", subtab: "parttime_mentor" },
        ],
      },
      {
        id: "proj_research",
        label: "科研学术",
        tab: "projects",
        subtab: "research",
        children: [
          { id: "research_proj", label: "科研立项", tab: "projects", subtab: "research_project" },
        ],
      },
      {
        id: "proj_talent",
        label: "人才引育",
        tab: "projects",
        subtab: "talent",
        children: [
          { id: "zhuogong", label: "卓工公派", tab: "projects", subtab: "zhuogong" },
        ],
      },
    ],
  },
  {
    id: "activities",
    label: "活动-Event",
    icon: Calendar,
    tab: "activities",
    children: [
      {
        id: "act_edu",
        label: "教育培养",
        tab: "activities",
        subtab: "education",
        children: [
          { id: "opening", label: "开学典礼", tab: "activities", subtab: "opening_ceremony" },
          { id: "joint_sym", label: "共建高校座谈会", tab: "activities", subtab: "joint_symposium" },
          { id: "comm_meet", label: "委员会会议", tab: "activities", subtab: "committee_meeting" },
        ],
      },
      {
        id: "act_research",
        label: "科研学术",
        tab: "activities",
        subtab: "research",
        children: [
          { id: "ai_summit", label: "国际AI科学家大会", tab: "activities", subtab: "ai_scientist_summit" },
          { id: "xai_forum", label: "XAI智汇讲坛", tab: "activities", subtab: "xai_forum" },
          { id: "acad_conf", label: "学术年会", tab: "activities", subtab: "academic_conference" },
        ],
      },
      {
        id: "act_talent",
        label: "人才引育",
        tab: "activities",
        subtab: "talent",
        children: [
          { id: "youth_forum", label: "青年论坛", tab: "activities", subtab: "youth_forum" },
          { id: "intl_summer", label: "国际暑校", tab: "activities", subtab: "intl_summer_school" },
        ],
      },
    ],
  },
  {
    id: "venues",
    label: "社群-Community",
    icon: BookOpen,
    tab: "venues",
    children: [
      { id: "top_conf", label: "顶会", tab: "venues", subtab: "top_conferences" },
      { id: "journals", label: "期刊", tab: "venues", subtab: "journals" },
    ],
  },
];

export function getAncestorIds(tab: TabId, subtab: string | null): string[] {
  function search(nodes: NavNode[], path: string[]): string[] | null {
    for (const node of nodes) {
      const isTarget =
        node.tab === tab &&
        (subtab ? node.subtab === subtab : !node.subtab && !node.children);
      if (isTarget) return path;
      if (node.children) {
        const found = search(node.children, [...path, node.id]);
        if (found !== null) return found;
      }
    }
    return null;
  }
  const topId = NAV_TREE.find((n) => n.tab === tab)?.id;
  const found = search(NAV_TREE, []);
  return found ?? (topId ? [topId] : []);
}

export function hasDescendantWithSubtab(nodes: NavNode[], subtab: string): boolean {
  return nodes.some(
    (n) =>
      n.subtab === subtab ||
      (n.children ? hasDescendantWithSubtab(n.children, subtab) : false),
  );
}
