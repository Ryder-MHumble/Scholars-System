export type InteractionType = '讲座' | '学术访问' | '合作研究' | '研讨会' | '座谈' | '其他';

export interface InteractionParticipant {
  type: 'scholar' | 'external';
  scholarId?: string;
  contactId?: string;
  role?: '讲者' | '嘉宾' | '主持人' | '组织者' | '参与者';
}

export interface InteractionRecord {
  id: string;
  type: InteractionType;
  title: string;
  date: string;
  endDate?: string;
  venue?: string;
  participants: InteractionParticipant[];
  abstract?: string;
  needsEmailInvitation?: boolean;
  prOutreach?: boolean;
  notes?: string;
  createdAt: string;
}
