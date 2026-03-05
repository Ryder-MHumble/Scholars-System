import type { Activity } from "@/types/activity";

export const SAMPLE_ACTIVITIES: Activity[] = [
  {
    id: "act_001",
    title: "人工智能前沿技术与应用论坛",
    type: "论坛",
    date: "2026-03-15",
    location: "清华大学",
    organizer: "中国科学院",
    speakers: [
      {
        name: "张益唐",
        title: "院士",
        institution: "中国科学院",
        isAcademician: true,
      },
      {
        name: "李德毅",
        title: "院士",
        institution: "中国工程院",
        isAcademician: true,
      },
    ],
    description: "探讨人工智能领域的最新研究进展和产业应用趋势。",
    registrationUrl: "https://example.com/register",
  },
  {
    id: "act_002",
    title: "量子计算与信息安全研讨会",
    type: "研讨会",
    date: "2026-04-20",
    location: "北京大学",
    organizer: "中国工程院",
    speakers: [
      {
        name: "潘建伟",
        title: "院士",
        institution: "中国科学技术大学",
        isAcademician: true,
      },
    ],
    description: "讨论量子计算技术对信息安全领域的影响和应对策略。",
  },
  {
    id: "act_003",
    title: "大数据与智慧城市建设学术讲座",
    type: "学术讲座",
    date: "2026-05-10",
    location: "上海交通大学",
    organizer: "上海交通大学",
    speakers: [
      {
        name: "郑南宁",
        title: "院士",
        institution: "西安交通大学",
        isAcademician: true,
      },
      {
        name: "陈杰",
        title: "教授",
        institution: "上海交通大学",
      },
    ],
    description: "分享大数据技术在智慧城市建设中的应用案例和经验。",
  },
];
