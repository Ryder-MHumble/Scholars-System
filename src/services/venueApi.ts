import { API_V1_BASE_URL } from "@/services/apiBase";
import type { Venue, VenueRank, VenueType } from "@/types/venue";

interface VenueApiItem {
  id: string;
  name?: string;
  full_name?: string;
  type?: "conference" | "journal";
  rank?: VenueRank;
  fields?: string[];
  description?: string;
  website?: string;
  h5_index?: number;
  acceptance_rate?: number;
  impact_factor?: number;
}

interface VenueApiListResponse {
  items?: VenueApiItem[];
}

export interface FetchVenueListParams {
  type?: VenueType | "全部";
  rank?: VenueRank | "全部";
  field?: string;
  keyword?: string;
  pageSize?: number;
}

function mapVenueType(type: VenueType | "全部" | undefined): string | undefined {
  if (!type || type === "全部") return undefined;
  return type === "会议" ? "conference" : "journal";
}

function mapVenueItem(item: VenueApiItem): Venue {
  const type: VenueType = item.type === "conference" ? "会议" : "期刊";
  return {
    id: item.id,
    name: String(item.name ?? ""),
    nameEn: String(item.name ?? ""),
    fullName: String(item.full_name ?? item.name ?? ""),
    type,
    rank: item.rank ?? "C",
    field: item.fields?.[0] || "未分类",
    description: item.description || "",
    website: item.website,
    h5Index: item.h5_index,
    acceptanceRate:
      typeof item.acceptance_rate === "number"
        ? `${Math.round(item.acceptance_rate * 100)}%`
        : undefined,
    impactFactor: item.impact_factor,
  };
}

export async function fetchVenueList(
  params: FetchVenueListParams,
  signal?: AbortSignal,
): Promise<Venue[]> {
  const query = new URLSearchParams();
  const type = mapVenueType(params.type);
  if (type) query.set("type", type);
  if (params.rank && params.rank !== "全部") query.set("rank", params.rank);
  if (params.field && params.field !== "全部") query.set("field", params.field);
  if (params.keyword?.trim()) query.set("keyword", params.keyword.trim());
  query.set("page_size", String(params.pageSize ?? 100));

  const response = await fetch(`${API_V1_BASE_URL}/venues/?${query}`, { signal });
  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`);
  }

  const data: VenueApiListResponse = await response.json();
  return (data.items ?? []).map(mapVenueItem);
}
