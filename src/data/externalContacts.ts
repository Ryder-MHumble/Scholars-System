import type { ExternalContact } from '@/types/contact';

export const externalContacts: ExternalContact[] = [
  {
    id: 'ext-001',
    name: '李明远',
    nameEn: 'Li Mingyuan',
    organization: '华为技术有限公司',
    position: '首席 AI 科学家',
    bio: '负责华为 AI 基础研究方向，长期关注大模型与 AI 安全领域。',
    email: 'limy@huawei.com',
    category: '企业高管',
    researchFields: ['大语言模型', 'AI 安全'],
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'ext-002',
    name: '张海峰',
    organization: '科技部高技术研究发展中心',
    position: '处长',
    bio: '长期从事科技政策研究和重大项目管理，推动产学研深度融合。',
    category: '政府官员',
    createdAt: '2024-03-15T09:00:00Z',
    updatedAt: '2024-11-20T09:00:00Z',
  },
  {
    id: 'ext-003',
    name: 'David Chen',
    nameEn: 'David Chen',
    organization: 'Stanford University',
    position: 'Visiting Researcher',
    bio: 'Researcher focusing on multimodal AI and robotics, currently on a visiting research program.',
    email: 'dchen@stanford.edu',
    category: '海外学者',
    researchFields: ['多模态 AI', '机器人学'],
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
  },
];

export function getExternalContactById(id: string): ExternalContact | undefined {
  return externalContacts.find((c) => c.id === id);
}
