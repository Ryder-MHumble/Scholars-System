import type { AgreementRecord } from '@/types/agreement';

export const agreements: AgreementRecord[] = [
  {
    id: 'agr-001',
    scholarId: 'scholar-1',
    agreementType: '双方协议',
    status: '已签署',
    signedAt: '2024-03-15',
    notes: '关于联合培养博士生的合作协议，有效期三年。',
  },
  {
    id: 'agr-002',
    scholarId: 'scholar-1',
    agreementType: '三方协议，知识产权共有',
    status: '已签署',
    signedAt: '2024-09-01',
    parties: ['华为技术有限公司'],
    notes: '与华为联合开展大模型安全研究，知识产权三方共有。',
  },
  {
    id: 'agr-003',
    scholarId: 'scholar-2',
    agreementType: '双方协议，知识产权独有',
    status: '流程中',
    parties: [],
    notes: '协议审核中，预计本月完成签署。',
  },
  {
    id: 'agr-004',
    scholarId: 'scholar-3',
    agreementType: '三方协议',
    status: '已签署',
    signedAt: '2023-11-20',
    parties: ['商汤科技'],
    notes: '联合实验室建设协议。',
  },
];

export function getAgreementsByScholarId(scholarId: string): AgreementRecord[] {
  return agreements.filter((a) => a.scholarId === scholarId);
}
