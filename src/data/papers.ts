import type { Paper } from '@/types';

export const papers: Paper[] = [
  // s001 - 张明远 (NLP)
  { id: 'p001', title: '基于大语言模型的知识增强推理框架', authors: ['张明远', '陈晓琳', '周子轩'], venue: 'ACL', year: 2025, citationCount: 128, isHighlight: true, scholarId: 's001' },
  { id: 'p002', title: '跨语言知识图谱对齐的对比学习方法', authors: ['张明远', '苏子墨'], venue: 'NeurIPS', year: 2024, citationCount: 95, scholarId: 's001' },
  { id: 'p003', title: '面向开放域问答的检索增强生成模型', authors: ['张明远', '傅雨彤', '凌宏远'], venue: 'EMNLP', year: 2024, citationCount: 76, scholarId: 's001' },
  { id: 'p004', title: '大规模预训练语言模型的知识蒸馏', authors: ['张明远'], venue: 'ICML', year: 2023, citationCount: 210, isHighlight: true, scholarId: 's001' },
  // s002 - 李思涵 (CV)
  { id: 'p005', title: '基于神经辐射场的动态三维重建', authors: ['李思涵', '谢映彤'], venue: 'CVPR', year: 2025, citationCount: 85, isHighlight: true, scholarId: 's002' },
  { id: 'p006', title: '多视角立体匹配的Transformer方法', authors: ['李思涵', '石翔宇'], venue: 'ICCV', year: 2024, citationCount: 62, scholarId: 's002' },
  { id: 'p007', title: '自监督视觉表征学习的统一框架', authors: ['李思涵'], venue: 'IEEE TPAMI', year: 2024, citationCount: 148, isHighlight: true, scholarId: 's002' },
  // s003 - 王建国 (DB)
  { id: 'p008', title: '面向万亿规模图数据的分布式查询处理', authors: ['王建国', '宋之远', '赵心怡'], venue: 'SIGMOD', year: 2025, citationCount: 45, isHighlight: true, scholarId: 's003' },
  { id: 'p009', title: '基于学习的数据库索引优化', authors: ['王建国', '董文博'], venue: 'VLDB', year: 2024, citationCount: 92, scholarId: 's003' },
  { id: 'p010', title: '新型内存数据库的一致性协议', authors: ['王建国'], venue: 'SOSP', year: 2023, citationCount: 180, scholarId: 's003' },
  // s007 - 孙浩然 (Architecture)
  { id: 'p011', title: '面向AI加速的可重构处理器架构', authors: ['孙浩然', '孟祥宇'], venue: 'ISCA', year: 2025, citationCount: 67, isHighlight: true, scholarId: 's007' },
  { id: 'p012', title: '异构计算系统的统一编程模型', authors: ['孙浩然', '董文博'], venue: 'MICRO', year: 2024, citationCount: 53, scholarId: 's007' },
  // s024 - 陈学峰 (OCR)
  { id: 'p013', title: '端到端文档版面分析与识别系统', authors: ['陈学峰', '苏子墨', '冯雅琪'], venue: 'IEEE TPAMI', year: 2025, citationCount: 110, isHighlight: true, scholarId: 's024' },
  { id: 'p014', title: '基于Transformer的多语种手写体识别', authors: ['陈学峰'], venue: 'CVPR', year: 2024, citationCount: 88, scholarId: 's024' },
  // s037 - 任博远 (AI)
  { id: 'p015', title: '大规模知识图谱推理的因果推断方法', authors: ['任博远', '戴安琪'], venue: 'NeurIPS', year: 2025, citationCount: 72, isHighlight: true, scholarId: 's037' },
  { id: 'p016', title: '面向科学发现的自动化知识获取', authors: ['任博远', '于晓彤'], venue: 'AAAI', year: 2024, citationCount: 58, scholarId: 's037' },
  // s047 - 周志华 (ML) — hero scholar
  { id: 'p017', title: '深度森林：基于树集成的深度学习替代框架', authors: ['周志华'], venue: 'NeurIPS', year: 2024, citationCount: 350, isHighlight: true, scholarId: 's047' },
  { id: 'p018', title: '弱监督学习的理论分析与算法设计', authors: ['周志华', '田小梅'], venue: 'ICML', year: 2024, citationCount: 220, isHighlight: true, scholarId: 's047' },
  { id: 'p019', title: '开放环境下的可靠机器学习', authors: ['周志华', '秦朗'], venue: 'ACM Computing Surveys', year: 2023, citationCount: 450, scholarId: 's047' },
  { id: 'p020', title: '面向标签噪声的鲁棒深度学习', authors: ['周志华'], venue: 'AAAI', year: 2023, citationCount: 280, scholarId: 's047' },
  // s048 - 吕建平 (SE)
  { id: 'p021', title: '互联网软件的自适应演化机制', authors: ['吕建平', '易明辉'], venue: 'ICSE', year: 2025, citationCount: 38, isHighlight: true, scholarId: 's048' },
  { id: 'p022', title: '模型驱动的智能软件开发方法', authors: ['吕建平', '吴明轩'], venue: 'FSE', year: 2024, citationCount: 65, scholarId: 's048' },
  // s056 - 陆鸿远 (Quantum)
  { id: 'p023', title: '光量子计算中的多体纠缠态制备', authors: ['陆鸿远'], venue: 'Nature', year: 2025, citationCount: 520, isHighlight: true, scholarId: 's056' },
  { id: 'p024', title: '量子密码协议的安全性证明框架', authors: ['陆鸿远', '韩天宇'], venue: 'Science', year: 2024, citationCount: 380, isHighlight: true, scholarId: 's056' },
  // s063 - 庄文昊 (Graphics)
  { id: 'p025', title: '基于神经网络的三维形状生成', authors: ['庄文昊'], venue: 'CVPR', year: 2025, citationCount: 75, isHighlight: true, scholarId: 's063' },
  { id: 'p026', title: '几何深度学习在分子设计中的应用', authors: ['庄文昊', '段瑞泽'], venue: 'NeurIPS', year: 2024, citationCount: 88, scholarId: 's063' },
  // s068 - 谭志刚 (Pattern Recognition)
  { id: 'p027', title: '跨年龄人脸识别的深度学习方法', authors: ['谭志刚', '关素媛'], venue: 'IEEE TPAMI', year: 2025, citationCount: 95, isHighlight: true, scholarId: 's068' },
  { id: 'p028', title: '基于注意力机制的步态识别', authors: ['谭志刚'], venue: 'CVPR', year: 2024, citationCount: 73, scholarId: 's068' },
  // s073 - 文继荣 (IR)
  { id: 'p029', title: '大语言模型增强的信息检索系统', authors: ['文继荣', '凌宏远', '傅雨彤'], venue: 'SIGIR', year: 2025, citationCount: 86, isHighlight: true, scholarId: 's073' },
  { id: 'p030', title: '面向个性化推荐的用户行为建模', authors: ['文继荣', '赵心怡'], venue: 'WWW', year: 2024, citationCount: 120, scholarId: 's073' },
  // More papers for other scholars
  { id: 'p031', title: '基于图神经网络的药物分子设计', authors: ['段瑞泽', '庄文昊'], venue: 'NeurIPS', year: 2025, citationCount: 42, isHighlight: true, scholarId: 's039' },
  { id: 'p032', title: '微服务系统的自动化运维框架', authors: ['方浩宇', '郑雨萱'], venue: 'ICSE', year: 2025, citationCount: 28, scholarId: 's041' },
  { id: 'p033', title: '基于联邦学习的医疗数据协同分析', authors: ['刘梦然', '朱雨桐'], venue: 'AAAI', year: 2025, citationCount: 35, scholarId: 's030' },
  { id: 'p034', title: '可信AI系统的评测方法与基准', authors: ['邓若萱', '秦朗'], venue: 'IJCAI', year: 2025, citationCount: 30, scholarId: 's043' },
  { id: 'p035', title: 'RISC-V向量扩展的性能优化', authors: ['孟祥宇', '余晨曦'], venue: 'ISCA', year: 2024, citationCount: 48, scholarId: 's070' },
  { id: 'p036', title: '面向对话系统的情感理解模型', authors: ['卢子涵', '傅雨彤'], venue: 'ACL', year: 2025, citationCount: 55, isHighlight: true, scholarId: 's045' },
  { id: 'p037', title: '基于差分隐私的图数据发布', authors: ['潘锐', '刘梦然'], venue: 'CCS', year: 2025, citationCount: 22, scholarId: 's036' },
  { id: 'p038', title: '零知识证明在区块链扩容中的应用', authors: ['严凯', '龚瑞安'], venue: 'IEEE S&P', year: 2025, citationCount: 38, scholarId: 's066' },
  { id: 'p039', title: '智能机器人的主动感知与决策', authors: ['顾明哲', '许文博'], venue: 'ICRA', year: 2025, citationCount: 42, isHighlight: true, scholarId: 's044' },
  { id: 'p040', title: '面向代码缺陷的大语言模型微调', authors: ['周子轩', '付云峰'], venue: 'FSE', year: 2025, citationCount: 33, scholarId: 's008' },
];
