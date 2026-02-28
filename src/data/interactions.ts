import type { InteractionRecord } from '@/types/interaction';

export const interactions: InteractionRecord[] = [
  {
    id: 'itr-001',
    type: '讲座',
    title: '大语言模型的可解释性与安全性',
    date: '2025-11-12',
    venue: '科学院 A 报告厅',
    participants: [
      { type: 'scholar', scholarId: 'scholar-1', role: '讲者' },
      { type: 'external', contactId: 'ext-001', role: '主持人' },
    ],
    abstract: '深入探讨大语言模型内部机制的可解释性研究进展及安全对齐最新方法。',
    prOutreach: true,
    needsEmailInvitation: false,
    createdAt: '2025-11-01T09:00:00Z',
  },
  {
    id: 'itr-002',
    type: '学术访问',
    title: '知识图谱与智能推理联合研究访问',
    date: '2025-08-05',
    endDate: '2025-08-07',
    venue: '工程院计算所',
    participants: [
      { type: 'scholar', scholarId: 'scholar-1', role: '参与者' },
      { type: 'scholar', scholarId: 'scholar-2', role: '组织者' },
    ],
    abstract: '为期三天的联合研究访问，围绕知识图谱推理和大模型结合展开深度交流。',
    createdAt: '2025-07-20T10:00:00Z',
  },
  {
    id: 'itr-003',
    type: '研讨会',
    title: 'AI 前沿技术中青年学者研讨会',
    date: '2025-05-20',
    venue: '两院联合会议中心',
    participants: [
      { type: 'scholar', scholarId: 'scholar-1', role: '嘉宾' },
      { type: 'external', contactId: 'ext-002', role: '组织者' },
    ],
    abstract: '汇聚两院中青年学者，就 AI 核心技术方向展开圆桌讨论。',
    prOutreach: false,
    createdAt: '2025-05-01T08:00:00Z',
  },
  {
    id: 'itr-004',
    type: '合作研究',
    title: '智能知识服务关键技术联合研发',
    date: '2024-12-10',
    venue: '线上',
    participants: [
      { type: 'scholar', scholarId: 'scholar-2', role: '参与者' },
    ],
    abstract: '国家重点研发计划项目启动会，确定研究分工和里程碑计划。',
    createdAt: '2024-12-01T09:00:00Z',
  },
  {
    id: 'itr-005',
    type: '座谈',
    title: '计算机视觉与具身智能座谈',
    date: '2024-09-18',
    venue: '科学院 AI 研究室',
    participants: [
      { type: 'scholar', scholarId: 'scholar-3', role: '讲者' },
      { type: 'external', contactId: 'ext-001', role: '参与者' },
    ],
    createdAt: '2024-09-10T09:00:00Z',
  },
];

export function getInteractionsByScholarId(scholarId: string): InteractionRecord[] {
  return interactions.filter((r) =>
    r.participants.some((p) => p.type === 'scholar' && p.scholarId === scholarId),
  );
}
