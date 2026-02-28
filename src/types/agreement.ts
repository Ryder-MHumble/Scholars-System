export type AgreementType =
  | '双方协议'
  | '三方协议'
  | '双方协议，知识产权共有'
  | '三方协议，知识产权共有'
  | '双方协议，知识产权独有'
  | '三方协议，知识产权独有';

export type AgreementStatus = '已签署' | '流程中';

export interface AgreementRecord {
  id: string;
  scholarId: string;
  agreementType: AgreementType;
  status: AgreementStatus;
  signedAt?: string;
  parties?: string[];
  notes?: string;
}
