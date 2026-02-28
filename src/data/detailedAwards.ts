import type { DetailedAward } from '@/types';

interface AwardRecord {
  scholarId: string;
  awards: DetailedAward[];
}

export const detailedAwards: AwardRecord[] = [
  {
    scholarId: 's001',
    awards: [
      {
        name: 'ACM Fellow',
        year: 2022,
        category: 'gold',
        issuer: 'Association for Computing Machinery',
        description: 'For contributions to natural language processing and large language models',
      },
      {
        name: '国家杰出青年科学基金',
        year: 2018,
        category: 'gold',
        issuer: '国家自然科学基金委员会',
        description: '自然语言处理与知识图谱方向',
      },
      {
        name: 'ACL 最佳论文奖',
        year: 2020,
        category: 'silver',
        issuer: 'ACL',
        description: 'Pre-training Methods for Language Understanding',
      },
      {
        name: '教育部科技进步一等奖',
        year: 2019,
        category: 'silver',
        issuer: '教育部',
      },
    ],
  },
  {
    scholarId: 's002',
    awards: [
      {
        name: '长江学者特聘教授',
        year: 2021,
        category: 'gold',
        issuer: '教育部',
        description: '计算机视觉方向',
      },
      {
        name: 'CVPR 最佳论文提名奖',
        year: 2019,
        category: 'silver',
        issuer: 'CVPR',
        description: '3D Reconstruction from Single Images',
      },
      {
        name: 'ICCV 最佳论文奖',
        year: 2017,
        category: 'silver',
        issuer: 'ICCV',
      },
    ],
  },
  {
    scholarId: 's003',
    awards: [
      {
        name: '中国科学院院士',
        year: 2015,
        category: 'gold',
        issuer: '中国科学院',
        description: '信息技术科学部',
      },
      {
        name: 'IEEE Fellow',
        year: 2012,
        category: 'gold',
        issuer: 'IEEE',
        description: 'For contributions to database systems',
      },
      {
        name: 'SIGMOD Edgar F. Codd Innovations Award',
        year: 2018,
        category: 'gold',
        issuer: 'ACM SIGMOD',
        description: 'For pioneering contributions to distributed database systems',
      },
      {
        name: '国家科学技术进步二等奖',
        year: 2016,
        category: 'silver',
        issuer: '国务院',
      },
      {
        name: 'VLDB 十年最佳论文奖',
        year: 2020,
        category: 'silver',
        issuer: 'VLDB',
      },
    ],
  },
  {
    scholarId: 's004',
    awards: [
      {
        name: '国家优秀青年科学基金',
        year: 2021,
        category: 'silver',
        issuer: '国家自然科学基金委员会',
        description: '机器学习与强化学习方向',
      },
      {
        name: 'ICML 杰出论文奖',
        year: 2022,
        category: 'silver',
        issuer: 'ICML',
        description: 'Deep Reinforcement Learning for Autonomous Driving',
      },
      {
        name: 'NeurIPS 最佳论文提名奖',
        year: 2020,
        category: 'bronze',
        issuer: 'NeurIPS',
      },
    ],
  },
  {
    scholarId: 's005',
    awards: [
      {
        name: 'IEEE S&P 最佳论文奖',
        year: 2022,
        category: 'silver',
        issuer: 'IEEE',
        description: 'Privacy-Preserving Machine Learning',
      },
      {
        name: 'ACM CCS 杰出论文奖',
        year: 2020,
        category: 'bronze',
        issuer: 'ACM',
      },
    ],
  },
  {
    scholarId: 's006',
    awards: [
      {
        name: 'CHI 最佳论文奖',
        year: 2023,
        category: 'silver',
        issuer: 'ACM CHI',
        description: 'Adaptive User Interfaces for Elderly Users',
      },
      {
        name: 'UIST 最佳论文提名奖',
        year: 2022,
        category: 'bronze',
        issuer: 'ACM UIST',
      },
    ],
  },
  {
    scholarId: 's007',
    awards: [
      {
        name: '长江学者特聘教授',
        year: 2016,
        category: 'gold',
        issuer: '教育部',
        description: '计算机体系结构方向',
      },
      {
        name: 'IEEE Fellow',
        year: 2019,
        category: 'gold',
        issuer: 'IEEE',
        description: 'For contributions to high-performance computing',
      },
      {
        name: 'ISCA 最具影响力论文奖',
        year: 2021,
        category: 'silver',
        issuer: 'ISCA',
        description: '10-year retrospective award',
      },
      {
        name: '国家自然科学二等奖',
        year: 2018,
        category: 'silver',
        issuer: '国务院',
      },
    ],
  },
  {
    scholarId: 's008',
    awards: [
      {
        name: '国家优秀青年科学基金',
        year: 2022,
        category: 'silver',
        issuer: '国家自然科学基金委员会',
        description: '软件工程与程序分析方向',
      },
      {
        name: 'ICSE 杰出论文奖',
        year: 2021,
        category: 'silver',
        issuer: 'ICSE',
        description: 'Neural Code Generation with Transformers',
      },
      {
        name: 'FSE 最佳论文提名奖',
        year: 2023,
        category: 'bronze',
        issuer: 'FSE',
      },
    ],
  },
  {
    scholarId: 's009',
    awards: [
      {
        name: '国家杰出青年科学基金',
        year: 2020,
        category: 'gold',
        issuer: '国家自然科学基金委员会',
        description: '形式化方法与软件可靠性方向',
      },
      {
        name: 'ICSE 最具影响力论文奖',
        year: 2022,
        category: 'silver',
        issuer: 'ICSE',
        description: '10-year most influential paper',
      },
      {
        name: 'ASE 最佳论文奖',
        year: 2018,
        category: 'silver',
        issuer: 'ASE',
      },
    ],
  },
  {
    scholarId: 's010',
    awards: [
      {
        name: 'FSE 杰出论文奖',
        year: 2023,
        category: 'silver',
        issuer: 'FSE',
        description: 'DevOps Practices in Microservices Architecture',
      },
      {
        name: 'ICSE 学生研究竞赛金奖',
        year: 2019,
        category: 'bronze',
        issuer: 'ICSE',
      },
    ],
  },
];

export const getAwardsByScholarId = (scholarId: string): DetailedAward[] => {
  const record = detailedAwards.find(r => r.scholarId === scholarId);
  return record?.awards || [];
};
