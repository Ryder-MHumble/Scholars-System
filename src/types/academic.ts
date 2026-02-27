export interface Paper {
  id: string;
  title: string;
  titleEn?: string;
  authors: string[];
  venue: string;
  year: number;
  doi?: string;
  url?: string;
  abstract?: string;
  citationCount?: number;
  isHighlight?: boolean;
  scholarId: string;
}

export interface ResearchProject {
  id: string;
  name: string;
  role: '负责人' | '参与者' | '骨干成员';
  fundingSource: string;
  amount?: string;
  startYear: number;
  endYear?: number;
  status: '进行中' | '已结题';
  description?: string;
  scholarId: string;
}

export interface Patent {
  id: string;
  title: string;
  patentNumber: string;
  inventors: string[];
  filingDate: string;
  grantDate?: string;
  status: '已授权' | '审查中' | '已公开';
  scholarId: string;
}

export interface AcademicExchange {
  id: string;
  type: '会议报告' | '特邀报告' | '访学' | '学术访问' | '合作研究';
  title: string;
  venue?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  scholarId: string;
}

export interface AdvisedStudent {
  id: string;
  name: string;
  degree: '博士' | '硕士' | '博士后';
  startYear: number;
  endYear?: number;
  thesis?: string;
  currentPosition?: string;
  scholarId: string;
}
