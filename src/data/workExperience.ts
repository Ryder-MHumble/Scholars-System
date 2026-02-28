import type { Experience } from '@/types';

interface ExperienceRecord {
  scholarId: string;
  experience: Experience[];
}

export const workExperience: ExperienceRecord[] = [
  {
    scholarId: 's001',
    experience: [
      {
        position: '教授',
        institution: '清华大学计算机系',
        startYear: 2018,
        description: '担任自然语言处理实验室主任',
      },
      {
        position: '副教授',
        institution: '清华大学计算机系',
        startYear: 2013,
        endYear: 2018,
      },
      {
        position: '助理教授',
        institution: '清华大学计算机系',
        startYear: 2010,
        endYear: 2013,
      },
    ],
  },
  {
    scholarId: 's002',
    experience: [
      {
        position: '教授',
        institution: '清华大学计算机系',
        startYear: 2020,
        description: '计算机视觉与智能系统实验室负责人',
      },
      {
        position: '副教授',
        institution: '清华大学计算机系',
        startYear: 2015,
        endYear: 2020,
      },
      {
        position: '博士后研究员',
        institution: 'MIT CSAIL',
        startYear: 2012,
        endYear: 2015,
      },
    ],
  },
  {
    scholarId: 's003',
    experience: [
      {
        position: '教授',
        institution: '清华大学计算机系',
        startYear: 2000,
        description: '国家重点实验室主任、大数据系统软件国家工程实验室首席科学家',
      },
      {
        position: '副教授',
        institution: '清华大学计算机系',
        startYear: 1996,
        endYear: 2000,
      },
      {
        position: '助理教授',
        institution: '清华大学计算机系',
        startYear: 1993,
        endYear: 1996,
      },
    ],
  },
  {
        scholarId: 's004',
    experience: [
      {
        position: '副教授',
        institution: '清华大学计算机系',
        startYear: 2019,
      },
      {
        position: '助理教授',
        institution: '清华大学计算机系',
        startYear: 2016,
        endYear: 2019,
      },
    ],
  },
  {
    scholarId: 's005',
    experience: [
      {
        position: '副教授',
        institution: '清华大学计算机系',
        startYear: 2020,
      },
      {
        position: '助理教授',
        institution: '清华大学计算机系',
        startYear: 2015,
        endYear: 2020,
      },
    ],
  },
  {
    scholarId: 's006',
    experience: [
      {
        position: '助理教授',
        institution: '清华大学计算机系',
        startYear: 2021,
      },
      {
        position: '博士后研究员',
        institution: 'ETH Zurich',
        startYear: 2020,
        endYear: 2021,
      },
    ],
  },
  {
    scholarId: 's007',
    experience: [
      {
        position: '教授',
        institution: '清华大学计算机系',
        startYear: 2015,
        description: '高性能计算实验室主任',
      },
      {
        position: '副教授',
        institution: '清华大学计算机系',
        startYear: 2010,
        endYear: 2015,
      },
      {
        position: '助理教授',
        institution: '清华大学计算机系',
        startYear: 2007,
        endYear: 2010,
      },
    ],
  },
  {
    scholarId: 's008',
    experience: [
      {
        position: '副教授',
        institution: '清华大学计算机系',
        startYear: 2021,
      },
      {
        position: '助理教授',
        institution: '清华大学计算机系',
        startYear: 2017,
        endYear: 2021,
      },
    ],
  },
  {
    scholarId: 's009',
    experience: [
      {
        position: '教授',
        institution: '清华大学软件学院',
        startYear: 2019,
        description: '形式化方法与软件可靠性研究中心主任',
      },
      {
        position: '副教授',
        institution: '清华大学软件学院',
        startYear: 2014,
        endYear: 2019,
      },
      {
        position: '助理教授',
        institution: '清华大学软件学院',
        startYear: 2011,
        endYear: 2014,
      },
    ],
  },
  {
    scholarId: 's010',
    experience: [
      {
        position: '副教授',
        institution: '清华大学软件学院',
        startYear: 2022,
      },
      {
        position: '助理教授',
        institution: '清华大学软件学院',
        startYear: 2019,
        endYear: 2022,
      },
    ],
  },
];

export const getExperienceByScholarId = (scholarId: string): Experience[] => {
  const record = workExperience.find(r => r.scholarId === scholarId);
  return record?.experience || [];
};
