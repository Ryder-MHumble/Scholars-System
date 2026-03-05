export type VenueType = "会议" | "期刊";
export type VenueRank = "A*" | "A" | "B" | "C";

export interface Venue {
  id: string;
  name: string;
  nameEn: string;
  fullName?: string;
  type: VenueType;
  rank: VenueRank;
  field: string;
  description?: string;
  website?: string;
  isExternal?: boolean;
  externalUrl?: string;
  h5Index?: number;
  impactFactor?: number;
  acceptanceRate?: string;
}
