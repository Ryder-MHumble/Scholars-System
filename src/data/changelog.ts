import type { ChangeLogEntry } from '@/types';

export const changelog: ChangeLogEntry[] = [
  { id: 'cl001', scholarId: 's001', scholarName: '张明远', action: '修改', field: '论文数量', oldValue: '182', newValue: '186', description: '更新了张明远的论文数量', operator: '系统管理员', timestamp: '2025-12-10T14:30:00Z' },
  { id: 'cl002', scholarId: 's047', scholarName: '周志华', action: '修改', field: 'h-index', oldValue: '90', newValue: '92', description: '更新了周志华的h-index', operator: '数据运营', timestamp: '2025-12-09T10:15:00Z' },
  { id: 'cl003', scholarId: 's012', scholarName: '钱思远', action: '新增', field: '', oldValue: '', newValue: '', description: '新增学者：钱思远（清华大学软件学院）', operator: '系统管理员', timestamp: '2025-12-08T16:00:00Z' },
  { id: 'cl004', scholarId: 's056', scholarName: '陆鸿远', action: '修改', field: '荣誉', oldValue: '', newValue: '中国科学院院士', description: '新增陆鸿远的院士荣誉', operator: '数据运营', timestamp: '2025-12-07T09:30:00Z' },
  { id: 'cl005', scholarId: 's026', scholarName: '冯雅琪', action: '新增', field: '', oldValue: '', newValue: '', description: '新增学者：冯雅琪（北京大学王选计算机研究所）', operator: '系统管理员', timestamp: '2025-12-06T11:00:00Z' },
  { id: 'cl006', scholarId: 's037', scholarName: '任博远', action: '修改', field: '研究方向', oldValue: '人工智能, 知识表示', newValue: '人工智能, 知识表示, 语义网', description: '更新了任博远的研究方向', operator: '数据运营', timestamp: '2025-12-05T14:45:00Z' },
  { id: 'cl007', scholarId: 's063', scholarName: '庄文昊', action: '修改', field: '被引用次数', oldValue: '19500', newValue: '20000', description: '更新了庄文昊的被引用次数', operator: '系统管理员', timestamp: '2025-12-04T10:00:00Z' },
  { id: 'cl008', scholarId: 's039', scholarName: '段瑞泽', action: '新增', field: '', oldValue: '', newValue: '', description: '新增学者：段瑞泽（上海交通大学计算机系）', operator: '数据运营', timestamp: '2025-12-03T15:30:00Z' },
  { id: 'cl009', scholarId: 's075', scholarName: '凌宏远', action: '修改', field: '邮箱', oldValue: '', newValue: 'linghy@ruc.edu.cn', description: '补充了凌宏远的邮箱信息', operator: '系统管理员', timestamp: '2025-12-02T09:00:00Z' },
  { id: 'cl010', scholarId: 's002', scholarName: '李思涵', action: '修改', field: '个人主页', oldValue: '', newValue: 'https://www.cs.tsinghua.edu.cn/lish', description: '补充了李思涵的个人主页', operator: '数据运营', timestamp: '2025-12-01T11:20:00Z' },
  { id: 'cl011', scholarId: 's068', scholarName: '谭志刚', action: '修改', field: '论文数量', oldValue: '140', newValue: '145', description: '更新了谭志刚的论文数量', operator: '系统管理员', timestamp: '2025-11-30T14:00:00Z' },
  { id: 'cl012', scholarId: 's055', scholarName: '彭博文', action: '新增', field: '', oldValue: '', newValue: '', description: '新增学者：彭博文（南京大学智能软件与工程学院）', operator: '数据运营', timestamp: '2025-11-29T10:30:00Z' },
  { id: 'cl013', scholarId: 's024', scholarName: '陈学峰', action: '修改', field: '职称', oldValue: '教授', newValue: '教授', description: '确认陈学峰的职称信息', operator: '系统管理员', timestamp: '2025-11-28T16:15:00Z' },
  { id: 'cl014', scholarId: 's073', scholarName: '文继荣', action: '修改', field: '研究方向', oldValue: '信息检索, 搜索引擎', newValue: '信息检索, 搜索引擎, Web挖掘', description: '更新了文继荣的研究方向', operator: '数据运营', timestamp: '2025-11-27T09:45:00Z' },
  { id: 'cl015', scholarId: 's015', scholarName: '韩天宇', action: '新增', field: '', oldValue: '', newValue: '', description: '新增学者：韩天宇（清华大学电子工程系）', operator: '系统管理员', timestamp: '2025-11-26T11:00:00Z' },
  { id: 'cl016', scholarId: 's061', scholarName: '侯雅婷', action: '新增', field: '', oldValue: '', newValue: '', description: '新增学者：侯雅婷（中国科学技术大学大数据学院）', operator: '数据运营', timestamp: '2025-11-25T14:30:00Z' },
  { id: 'cl017', scholarId: 's003', scholarName: '王建国', action: '修改', field: '被引用次数', oldValue: '41000', newValue: '42000', description: '更新了王建国的被引用次数', operator: '系统管理员', timestamp: '2025-11-24T10:00:00Z' },
  { id: 'cl018', scholarId: 's047', scholarName: '周志华', action: '修改', field: '论文数量', oldValue: '305', newValue: '310', description: '更新了周志华的论文数量', operator: '数据运营', timestamp: '2025-11-23T15:00:00Z' },
  { id: 'cl019', scholarId: 's031', scholarName: '何志远', action: '修改', field: '邮箱', oldValue: '', newValue: 'hezy@pku.edu.cn', description: '补充了何志远的邮箱信息', operator: '系统管理员', timestamp: '2025-11-22T09:30:00Z' },
  { id: 'cl020', scholarId: 's044', scholarName: '顾明哲', action: '修改', field: '简介', oldValue: '', newValue: '长期从事智能机器人与路径规划研究...', description: '补充了顾明哲的个人简介', operator: '数据运营', timestamp: '2025-11-21T11:15:00Z' },
];
