import type { Education } from '@/types';

interface EducationRecord {
  scholarId: string;
  education: Education[];
}

export const educationHistory: EducationRecord[] = [
  {
    scholarId: 's001',
    education: [
      {
        degree: '博士',
        institution: '斯坦福大学',
        major: '计算机科学',
        year: 2006,
        endYear: 2010,
      },
      {
        degree: '硕士',
        institution: '清华大学',
        major: '计算机科学与技术',
        year: 2003,
        endYear: 2006,
      },
      {
        degree: '学士',
        institution: '清华大学',
        major: '计算机科学与技术',
        year: 1999,
        endYear: 2003,
      },
    ],
  },
  {
    scholarId: 's002',
    education: [
      {
        degree: '博士',
        institution: 'MIT',
        major: '计算机视觉',
        year: 2008,
        endYear: 2012,
      },
      {
        degree: '硕士',
        institution: '北京大学',
        major: '计算机科学',
        year: 2006,
        endYear: 2008,
      },
      {
        degree: '学士',
        institution: '清华大学',
        major: '软件工程',
        year: 2002,
        endYear: 2006,
      },
    ],
  },
  {
    scholarId: 's003',
    education: [
      {
        degree: '博士',
        institution: 'UC Berkeley',
        major: '数据库系统',
        year: 1989,
        endYear: 1993,
      },
      {
        degree: '硕士',
        institution: '清华大学',
        major: '计算机科学',
        year: 1986,
        endYear: 1989,
      },
      {
        degree: '学士',
        institution: '清华大学',
        major: '计算机应用',
        year: 1982,
        endYear: 1986,
      },
    ],
  },
  {
    scholarId: 's004',
    education: [
      {
        degree: '博士',
        institution: 'CMU',
        major: '机器学习',
        year: 2012,
        endYear: 2016,
      },
      {
        degree: '硕士',
        institution: '清华大学',
        major: '自动化',
        year: 2010,
        endYear: 2012,
      },
      {
        degree: '学士',
        institution: '清华大学',
        major: '自动化',
        year: 2006,
        endYear: 2010,
      },
    ],
  },
  {
    scholarId: 's005',
    education: [
      {
        degree: '博士',
        institution: '清华大学',
        major: '信息安全',
        year: 2011,
        endYear: 2015,
      },
      {
        degree: '硕士',
        institution: '清华大学',
        major: '计算机科学',
        year: 2009,
        endYear: 2011,
      },
      {
        degree: '学士',
        institution: '北京航空航天大学',
        major: '信息安全',
        year: 2005,
        endYear: 2009,
      },
    ],
  },
  {
    scholarId: 's006',
    education: [
      {
        degree: '博士',
        institution: 'ETH Zurich',
        major: '人机交互',
        year: 2016,
        endYear: 2020,
      },
      {
        degree: '硕士',
        institution: '浙江大学',
        major: '计算机科学',
        year: 2014,
        endYear: 2016,
      },
      {
        degree: '学士',
        institution: '浙江大学',
        major: '软件工程',
        year: 2010,
        endYear: 2014,
      },
    ],
  },
  {
    scholarId: 's007',
    education: [
      {
        degree: '博士',
        institution: 'UIUC',
        major: '计算机体系结构',
        year: 2003,
        endYear: 2007,
      },
      {
        degree: '硕士',
        institution: '中国科学技术大学',
        major: '计算机科学',
        year: 2001,
        endYear: 2003,
      },
      {
        degree: '学士',
        institution: '中国科学技术大学',
        major: '计算机科学',
        year: 1997,
        endYear: 2001,
      },
    ],
  },
  {
    scholarId: 's008',
    education: [
      {
        degree: '博士',
        institution: 'University of Washington',
        major: '软件工程',
        year: 2013,
        endYear: 2017,
      },
      {
        degree: '硕士',
        institution: '北京大学',
        major: '软件工程',
        year: 2011,
        endYear: 2013,
      },
      {
        degree: '学士',
        institution: '北京大学',
        major: '计算机科学',
        year: 2007,
        endYear: 2011,
      },
    ],
  },
  {
    scholarId: 's009',
    education: [
      {
        degree: '博士',
        institution: 'Imperial College London',
        major: '软件工程',
        year: 2007,
        endYear: 2011,
      },
      {
        degree: '硕士',
        institution: '清华大学',
        major: '软件工程',
        year: 2005,
        endYear: 2007,
      },
      {
        degree: '学士',
        institution: '清华大学',
        major: '计算机科学',
        year: 2001,
        endYear: 2005,
      },
    ],
  },
  {
    scholarId: 's010',
    education: [
      {
        degree: '博士',
        institution: 'Georgia Tech',
        major: '软件工程',
        year: 2015,
        endYear: 2019,
      },
      {
        degree: '硕士',
        institution: '复旦大学',
        major: '计算机科学',
        year: 2013,
        endYear: 2015,
      },
      {
        degree: '学士',
        institution: '复旦大学',
        major: '软件工程',
        year: 2009,
        endYear: 2013,
      },
    ],
  },
];

export const getEducationByScholarId = (scholarId: string): Education[] => {
  const record = educationHistory.find(r => r.scholarId === scholarId);
  return record?.education || [];
};
