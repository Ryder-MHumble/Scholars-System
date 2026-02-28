export type ContactCategory = '企业高管' | '政府官员' | '独立研究员' | '海外学者' | '媒体人' | '其他';

export interface ExternalContact {
  id: string;
  name: string;
  nameEn?: string;
  organization: string;
  position: string;
  bio?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  category: ContactCategory;
  researchFields?: string[];
  createdAt: string;
  updatedAt: string;
}
