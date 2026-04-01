import { API_BASE_URL } from "@/services/apiBase";

export interface UniversitySourceItem {
  source_id: string;
  source_name: string;
  group: string;
  item_count: number;
  is_enabled: boolean;
}

interface UniversitySourcesResponse {
  items: UniversitySourceItem[];
}

export interface UniversityFeedItem {
  id: string;
  title: string;
  url: string;
  published_at: string | null;
  source_id: string;
  source_name: string;
  group: string | null;
  thumbnail?: string | null;
  images?: Array<{ src?: string | null; alt?: string | null }> | null;
  content?: string | null;
}

interface UniversityFeedResponse {
  items: UniversityFeedItem[];
}

export interface SourceConfigItem {
  id: string;
  name: string;
  group?: string | null;
  dimension: string;
  is_enabled: boolean;
}

export interface ArticleBriefItem {
  id: string;
  source_id: string;
  dimension: string;
  url: string;
  title: string;
  author?: string | null;
  published_at?: string | null;
  crawled_at?: string | null;
  cover_image_url?: string | null;
}

interface ArticleListResponse {
  items: ArticleBriefItem[];
}

export async function fetchUniversitySourcesWithData(): Promise<UniversitySourceItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/intel/university/sources`);
  if (!res.ok) throw new Error(`加载高校生态信源失败: ${res.status}`);
  const data: UniversitySourcesResponse = await res.json();
  return (data.items || []).filter(
    (item) => Boolean(item.is_enabled) && Number(item.item_count || 0) > 0,
  );
}

export async function fetchUniversityFeedBySourceIds(
  sourceIds: string[],
  pageSize = 12,
): Promise<UniversityFeedItem[]> {
  if (sourceIds.length === 0) return [];
  const params = new URLSearchParams({
    source_ids: sourceIds.join(","),
    page: "1",
    page_size: String(pageSize),
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/intel/university/feed?${params.toString()}`);
  if (!res.ok) throw new Error(`加载高校生态动态失败: ${res.status}`);
  const data: UniversityFeedResponse = await res.json();
  return data.items || [];
}

export async function fetchEnabledTechnologySources(): Promise<SourceConfigItem[]> {
  const params = new URLSearchParams({
    dimension: "technology",
    is_enabled: "true",
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/sources?${params.toString()}`);
  if (!res.ok) throw new Error(`加载技术信源失败: ${res.status}`);
  const items = (await res.json()) as SourceConfigItem[];
  return (items || []).filter(
    (item) =>
      item.dimension === "technology"
      && Boolean(item.is_enabled)
      && (item.group === "company_blogs" || item.group === "cn_ai_company"),
  );
}

export async function fetchTechnologyArticlesBySourceIds(
  sourceIds: string[],
  pageSize = 12,
): Promise<ArticleBriefItem[]> {
  if (sourceIds.length === 0) return [];
  const params = new URLSearchParams({
    dimension: "technology",
    source_ids: sourceIds.join(","),
    page: "1",
    page_size: String(pageSize),
    sort_by: "published_at",
    order: "desc",
  });
  const res = await fetch(`${API_BASE_URL}/api/v1/articles?${params.toString()}`);
  if (!res.ok) throw new Error(`加载公司动态失败: ${res.status}`);
  const data: ArticleListResponse = await res.json();
  return data.items || [];
}
