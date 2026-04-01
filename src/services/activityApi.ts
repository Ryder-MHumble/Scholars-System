import { API_BASE_URL } from "@/services/apiBase";

const BASE_URL = API_BASE_URL;

// List item (from GET /api/v1/events/)
export interface ActivityEvent {
  id: string;
  category: string;
  event_type: string;
  series?: string;
  series_number?: string;
  title: string;
  abstract?: string;
  event_date: string; // UI-friendly date/datetime string
  event_time?: string;
  duration?: number;
  location: string;
  photo_url?: string;
  scholar_ids?: string[];
  scholar_count: number;
  created_at: string;
  updated_at?: string;
}

// Full detail (from GET /api/v1/events/{id})
export interface ActivityEventDetail {
  id: string;
  category: string;
  event_type: string;
  series?: string;
  series_number?: string;
  title: string;
  abstract?: string;
  event_date: string; // UI-friendly date/datetime string
  event_time?: string;
  duration?: number;
  location: string;
  photo_url?: string;
  scholar_ids: string[];
  created_at: string;
  updated_at?: string;
}

export interface ActivityListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: ActivityEvent[];
}

// Actual stats shape from GET /api/v1/events/stats
export interface ActivityStats {
  total: number;
  by_category: Array<{ category: string; count: number }>;
  by_type: Array<{ event_type: string; count: number }>;
  by_month: Array<{ month: string; count: number }>;
}

export interface ActivityCreateRequest {
  category: string;
  event_type: string;
  series?: string;
  series_number?: string;
  title: string;
  abstract?: string;
  event_date: string;
  event_time?: string;
  duration?: number;
  location: string;
  photo_url?: string;
  scholar_ids?: string[];
}

export interface ActivityUpdateRequest {
  category?: string;
  event_type?: string;
  series?: string;
  series_number?: string;
  title?: string;
  abstract?: string;
  event_date?: string;
  event_time?: string;
  duration?: number;
  location?: string;
  photo_url?: string;
  scholar_ids?: string[];
}

interface BackendActivityEvent {
  id: string;
  category?: string;
  event_type?: string;
  series?: string;
  title?: string;
  abstract?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
  cover_image_url?: string;
  scholar_count?: number;
  created_at?: string;
}

interface BackendActivityEventDetail extends BackendActivityEvent {
  scholar_ids?: string[];
  updated_at?: string;
  custom_fields?: Record<string, unknown>;
}

interface BackendActivityListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: BackendActivityEvent[];
}

function normalizeTime(raw: string | undefined): string {
  if (!raw) return "";
  const value = raw.trim();
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value.slice(0, 5);
  return value;
}

function composeDateTime(date: string | undefined, time: string | undefined): string {
  const datePart = String(date ?? "").trim();
  if (!datePart) return "";
  const timePart = normalizeTime(time);
  if (!timePart || !/^\d{2}:\d{2}$/.test(timePart)) return datePart;
  return `${datePart}T${timePart}`;
}

function splitDateTime(
  eventDateInput: string | undefined,
  explicitEventTime?: string,
): { event_date?: string; event_time?: string } {
  const rawDate = String(eventDateInput ?? "").trim();
  const rawTime = String(explicitEventTime ?? "").trim();

  if (!rawDate && !rawTime) return {};

  if (rawDate.includes("T")) {
    const [datePart, timePartRaw] = rawDate.split("T");
    const timePart = normalizeTime(rawTime || timePartRaw);
    return {
      event_date: datePart || undefined,
      event_time: timePart || undefined,
    };
  }

  return {
    event_date: rawDate || undefined,
    event_time: normalizeTime(rawTime) || undefined,
  };
}

function toStringRecord(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      out[key] = value;
    } else {
      out[key] = JSON.stringify(value);
    }
  }
  return out;
}

function parseOptionalNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function mapBackendEvent(item: BackendActivityEvent): ActivityEvent {
  return {
    id: item.id,
    category: String(item.category ?? ""),
    event_type: String(item.event_type ?? ""),
    series: String(item.series ?? "") || undefined,
    title: String(item.title ?? ""),
    abstract: String(item.abstract ?? "") || undefined,
    event_date: composeDateTime(item.event_date, item.event_time),
    event_time: normalizeTime(item.event_time) || undefined,
    location: String(item.location ?? ""),
    photo_url: String(item.cover_image_url ?? "") || undefined,
    scholar_count: Number(item.scholar_count ?? 0),
    created_at: String(item.created_at ?? ""),
  };
}

function mapBackendDetail(item: BackendActivityEventDetail): ActivityEventDetail {
  const customFields = toStringRecord(item.custom_fields);
  return {
    id: item.id,
    category: String(item.category ?? ""),
    event_type: String(item.event_type ?? ""),
    series: String(item.series ?? "") || undefined,
    series_number: String(customFields.series_number ?? "") || undefined,
    title: String(item.title ?? ""),
    abstract: String(item.abstract ?? "") || undefined,
    event_date: composeDateTime(item.event_date, item.event_time),
    event_time: normalizeTime(item.event_time) || undefined,
    duration: parseOptionalNumber(customFields.duration),
    location: String(item.location ?? ""),
    photo_url: String(item.cover_image_url ?? "") || undefined,
    scholar_ids: Array.isArray(item.scholar_ids)
      ? item.scholar_ids.map((id) => String(id ?? "").trim()).filter(Boolean)
      : [],
    created_at: String(item.created_at ?? ""),
    updated_at: String(item.updated_at ?? "") || undefined,
  };
}

function toBackendPayload(
  data: ActivityCreateRequest | ActivityUpdateRequest,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const customFields: Record<string, string> = {};

  const dateTime = splitDateTime(data.event_date, data.event_time);
  if (dateTime.event_date !== undefined) payload.event_date = dateTime.event_date;
  if (dateTime.event_time !== undefined) payload.event_time = dateTime.event_time;

  if (data.category !== undefined) payload.category = data.category.trim();
  if (data.event_type !== undefined) payload.event_type = data.event_type.trim();
  if (data.series !== undefined)
    payload.series = data.series.trim() || "";
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.abstract !== undefined) payload.abstract = data.abstract.trim() || "";
  if (data.location !== undefined) payload.location = data.location.trim();
  if (data.photo_url !== undefined)
    payload.cover_image_url = data.photo_url.trim() || "";
  if (data.scholar_ids !== undefined) payload.scholar_ids = data.scholar_ids;

  if (data.series_number !== undefined) {
    customFields.series_number = data.series_number.trim();
  }
  if (data.duration !== undefined) {
    customFields.duration = String(data.duration);
  }
  if (Object.keys(customFields).length > 0) {
    payload.custom_fields = customFields;
  }

  return payload;
}

export async function fetchActivities(
  page: number = 1,
  pageSize: number = 20,
  eventType?: string,
  series?: string,
  category?: string,
  scholarId?: string,
): Promise<ActivityListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (category) params.set("category", category);
  if (eventType) params.set("event_type", eventType);
  if (series) params.set("series", series);
  if (scholarId) params.set("scholar_id", scholarId);

  const res = await fetch(`${BASE_URL}/api/v1/events/?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch activities: ${res.status}`);
  const raw: BackendActivityListResponse = await res.json();
  return {
    ...raw,
    items: raw.items.map(mapBackendEvent),
  };
}

export async function fetchActivityStats(): Promise<ActivityStats> {
  const res = await fetch(`${BASE_URL}/api/v1/events/stats`);
  if (!res.ok) throw new Error(`Failed to fetch activity stats: ${res.status}`);
  return res.json();
}

export async function fetchActivityDetail(
  eventId: string,
): Promise<ActivityEventDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/events/${eventId}`);
  if (!res.ok)
    throw new Error(`Failed to fetch activity detail: ${res.status}`);
  const raw: BackendActivityEventDetail = await res.json();
  return mapBackendDetail(raw);
}

export async function createActivity(
  data: ActivityCreateRequest,
): Promise<ActivityEventDetail> {
  const payload = toBackendPayload(data);
  const res = await fetch(`${BASE_URL}/api/v1/events/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create activity: ${res.status}`);
  const raw: BackendActivityEventDetail = await res.json();
  return mapBackendDetail(raw);
}

export async function updateActivity(
  eventId: string,
  data: ActivityUpdateRequest,
): Promise<ActivityEventDetail> {
  const payload = toBackendPayload(data);
  const res = await fetch(`${BASE_URL}/api/v1/events/${eventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update activity: ${res.status}`);
  const raw: BackendActivityEventDetail = await res.json();
  return mapBackendDetail(raw);
}

export async function deleteActivity(eventId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/events/${eventId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete activity: ${res.status}`);
}

export interface ActivityScholarDetail {
  scholar_id: string;
  scholar_url_hash?: string;
  name: string;
  university?: string;
  department?: string;
  position?: string;
  email?: string;
  research_areas?: string[];
  photo_url?: string;
}

interface BackendEventScholarItem {
  scholar_id?: string;
  scholar_url_hash?: string;
  url_hash?: string;
  id?: string;
  name?: string;
  scholar_name?: string;
  display_name?: string;
  university?: string;
  institution?: string;
  department?: string;
  position?: string;
  title?: string;
  email?: string;
  photo_url?: string;
  avatar_url?: string;
  research_areas?: unknown;
  scholar?: {
    url_hash?: string;
    id?: string;
    name?: string;
    university?: string;
    department?: string;
    position?: string;
    email?: string;
    photo_url?: string;
    avatar_url?: string;
    research_areas?: unknown;
  };
}

interface BackendScholarListItem {
  url_hash?: string;
  name?: string;
  university?: string;
  department?: string;
  position?: string;
  email?: string;
  photo_url?: string;
  research_areas?: unknown;
}

interface BackendScholarListResponse {
  total_pages?: number;
  items?: BackendScholarListItem[];
}

function parseResearchAreas(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const areas = raw
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
  return areas.length > 0 ? areas : undefined;
}

function normalizeEventScholarItem(raw: BackendEventScholarItem): ActivityScholarDetail {
  const nested = raw.scholar ?? {};
  const scholarId = String(
    raw.scholar_id ??
      raw.scholar_url_hash ??
      raw.url_hash ??
      nested.url_hash ??
      nested.id ??
      raw.id ??
      "",
  ).trim();
  const scholarUrlHash = String(
    raw.scholar_url_hash ?? raw.url_hash ?? nested.url_hash ?? "",
  ).trim();
  const name = String(
    raw.name ?? raw.scholar_name ?? raw.display_name ?? nested.name ?? "",
  ).trim();

  return {
    scholar_id: scholarId,
    scholar_url_hash: scholarUrlHash || undefined,
    name: name || "未命名学者",
    university: String(raw.university ?? raw.institution ?? nested.university ?? "").trim() || undefined,
    department: String(raw.department ?? nested.department ?? "").trim() || undefined,
    position: String(raw.position ?? raw.title ?? nested.position ?? "").trim() || undefined,
    email: String(raw.email ?? nested.email ?? "").trim() || undefined,
    photo_url: String(raw.photo_url ?? raw.avatar_url ?? nested.photo_url ?? nested.avatar_url ?? "").trim() || undefined,
    research_areas: parseResearchAreas(raw.research_areas ?? nested.research_areas),
  };
}

async function fetchActivityScholarsViaScholarList(
  eventId: string,
): Promise<ActivityScholarDetail[]> {
  const firstRes = await fetch(
    `${BASE_URL}/api/v1/scholars?page=1&page_size=200&participated_event_id=${encodeURIComponent(eventId)}`,
  );
  if (!firstRes.ok) {
    throw new Error(`Failed to fetch activity scholars from scholar list: ${firstRes.status}`);
  }

  const firstData: BackendScholarListResponse = await firstRes.json();
  const totalPages = Math.max(1, Number(firstData.total_pages ?? 1));
  const allItems: BackendScholarListItem[] = [...(firstData.items ?? [])];

  if (totalPages > 1) {
    const pageRequests: Promise<BackendScholarListResponse>[] = [];
    for (let page = 2; page <= totalPages; page += 1) {
      pageRequests.push(
        fetch(
          `${BASE_URL}/api/v1/scholars?page=${page}&page_size=200&participated_event_id=${encodeURIComponent(eventId)}`,
        ).then(async (res) => {
          if (!res.ok) {
            throw new Error(
              `Failed to fetch activity scholars page ${page}: ${res.status}`,
            );
          }
          return res.json() as Promise<BackendScholarListResponse>;
        }),
      );
    }
    const pageData = await Promise.all(pageRequests);
    pageData.forEach((data) => {
      allItems.push(...(data.items ?? []));
    });
  }

  const scholars: ActivityScholarDetail[] = [];
  for (const item of allItems) {
    const urlHash = String(item.url_hash ?? "").trim();
    if (!urlHash) continue;
    const name = String(item.name ?? "").trim();
    scholars.push({
      scholar_id: urlHash,
      scholar_url_hash: urlHash,
      name: name || "未命名学者",
      university: String(item.university ?? "").trim() || undefined,
      department: String(item.department ?? "").trim() || undefined,
      position: String(item.position ?? "").trim() || undefined,
      email: String(item.email ?? "").trim() || undefined,
      photo_url: String(item.photo_url ?? "").trim() || undefined,
      research_areas: parseResearchAreas(item.research_areas),
    });
  }
  return scholars;
}

export async function fetchActivityScholars(
  eventId: string,
): Promise<ActivityScholarDetail[]> {
  try {
    const scholarsFromList = await fetchActivityScholarsViaScholarList(eventId);
    if (scholarsFromList.length > 0) {
      return scholarsFromList;
    }
  } catch {
    // Fallback to /events/{id}/scholars for compatibility with older backends.
  }

  const res = await fetch(`${BASE_URL}/api/v1/events/${eventId}/scholars`);
  if (!res.ok) {
    throw new Error(`Failed to fetch activity scholars: ${res.status}`);
  }
  const raw = await res.json();
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeEventScholarItem(item as BackendEventScholarItem))
    .filter((item) => item.scholar_id || item.name);
}

export async function addActivityScholar(
  eventId: string,
  scholarId: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/events/${eventId}/scholars`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scholar_id: scholarId }),
  });
  if (!res.ok)
    throw new Error(`Failed to add scholar to activity: ${res.status}`);
}

export async function removeActivityScholar(
  eventId: string,
  scholarId: string,
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/v1/events/${eventId}/scholars/${scholarId}`,
    { method: "DELETE" },
  );
  if (!res.ok)
    throw new Error(`Failed to remove scholar from activity: ${res.status}`);
}

const SCHOLAR_ACTIVITY_CACHE_TTL_MS = 2 * 60 * 1000;
const scholarActivityCache = new Map<
  string,
  { expiresAt: number; items: ActivityEvent[] }
>();
const scholarActivityInFlight = new Map<string, Promise<ActivityEvent[]>>();

function normalizeScholarKey(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

function sortActivitiesByDateDesc(items: ActivityEvent[]): ActivityEvent[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.event_date).getTime();
    const bTime = new Date(b.event_date).getTime();
    const safeATime = Number.isNaN(aTime) ? 0 : aTime;
    const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
    return safeBTime - safeATime;
  });
}

async function fetchActivitiesByScholarId(
  scholarId: string,
): Promise<ActivityEvent[]> {
  const firstPage = await fetchActivities(1, 100, undefined, undefined, undefined, scholarId);
  const allItems: ActivityEvent[] = [...firstPage.items];

  if (firstPage.total_pages > 1) {
    const requests: Promise<ActivityListResponse>[] = [];
    for (let page = 2; page <= firstPage.total_pages; page += 1) {
      requests.push(fetchActivities(page, 100, undefined, undefined, undefined, scholarId));
    }
    const pageResults = await Promise.all(requests);
    pageResults.forEach((pageResult) => {
      allItems.push(...pageResult.items);
    });
  }

  return allItems;
}

async function fetchAllActivitiesForScholarScan(): Promise<ActivityEvent[]> {
  const firstPage = await fetchActivities(1, 100);
  const allItems: ActivityEvent[] = [...firstPage.items];

  if (firstPage.total_pages > 1) {
    const requests: Promise<ActivityListResponse>[] = [];
    for (let page = 2; page <= firstPage.total_pages; page += 1) {
      requests.push(fetchActivities(page, 100));
    }
    const pageResults = await Promise.all(requests);
    pageResults.forEach((pageResult) => {
      allItems.push(...pageResult.items);
    });
  }

  return allItems;
}

async function eventContainsScholar(
  eventId: string,
  targetScholarKey: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/events/${eventId}/scholars`);
    if (!res.ok) return false;
    const raw = await res.json();
    if (!Array.isArray(raw)) return false;

    return raw.some((item) => {
      // Old backend shape: ["url_hash_1", "url_hash_2", ...]
      if (typeof item === "string" || typeof item === "number") {
        return normalizeScholarKey(item) === targetScholarKey;
      }
      if (!item || typeof item !== "object") return false;
      const record = item as BackendEventScholarItem;
      const nested = record.scholar ?? {};
      const candidates = [
        record.scholar_url_hash,
        record.url_hash,
        nested.url_hash,
        record.scholar_id,
        record.id,
        nested.id,
      ];
      return candidates.some(
        (candidate) => normalizeScholarKey(candidate) === targetScholarKey,
      );
    });
  } catch {
    return false;
  }
}

export async function fetchScholarActivities(
  scholarUrlHash: string,
): Promise<ActivityEvent[]> {
  const key = normalizeScholarKey(scholarUrlHash);
  if (!key) return [];

  const now = Date.now();
  const cached = scholarActivityCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.items;
  }

  const pending = scholarActivityInFlight.get(key);
  if (pending) {
    return pending;
  }

  const request = (async () => {
    // Fast path: leverage backend filtering directly when available.
    try {
      const directMatches = await fetchActivitiesByScholarId(key);
      if (directMatches.length > 0) {
        const directSorted = sortActivitiesByDateDesc(directMatches);
        scholarActivityCache.set(key, {
          expiresAt: Date.now() + SCHOLAR_ACTIVITY_CACHE_TTL_MS,
          items: directSorted,
        });
        return directSorted;
      }
    } catch {
      // Fallback to reverse scan for compatibility.
    }

    const allActivities = await fetchAllActivitiesForScholarScan();
    const candidates = allActivities.filter(
      (activity) => Number(activity.scholar_count ?? 0) > 0,
    );
    if (candidates.length === 0) {
      scholarActivityCache.set(key, {
        expiresAt: Date.now() + SCHOLAR_ACTIVITY_CACHE_TTL_MS,
        items: [],
      });
      return [];
    }

    const matches: ActivityEvent[] = [];
    const batchSize = 8;

    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      const checked = await Promise.all(
        batch.map(async (activity) => {
          const isMatch = await eventContainsScholar(activity.id, key);
          return isMatch ? activity : null;
        }),
      );
      checked.forEach((item) => {
        if (item) matches.push(item);
      });
    }

    const unique = new Map<string, ActivityEvent>();
    matches.forEach((item) => {
      unique.set(item.id, item);
    });
    const sorted = sortActivitiesByDateDesc(Array.from(unique.values()));

    scholarActivityCache.set(key, {
      expiresAt: Date.now() + SCHOLAR_ACTIVITY_CACHE_TTL_MS,
      items: sorted,
    });
    return sorted;
  })();

  scholarActivityInFlight.set(key, request);
  try {
    return await request;
  } finally {
    scholarActivityInFlight.delete(key);
  }
}

// ============================================================================
// Taxonomy API (3-level category tree)
// ============================================================================

export interface TaxonomyNode {
  id: string;
  level: number;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface TaxonomyL3 extends TaxonomyNode {
  level: 3;
}

export interface TaxonomyL2 extends TaxonomyNode {
  level: 2;
  children: TaxonomyL3[];
}

export interface TaxonomyL1 extends TaxonomyNode {
  level: 1;
  children: TaxonomyL2[];
}

export interface TaxonomyTree {
  total_l1: number;
  total_l2: number;
  total_l3: number;
  items: TaxonomyL1[];
}

export interface TaxonomyCreateRequest {
  level: 1 | 2 | 3;
  name: string;
  parent_id?: string | null;
  sort_order?: number;
}

export interface TaxonomyUpdateRequest {
  name?: string;
  sort_order?: number;
}

export async function fetchTaxonomyTree(): Promise<TaxonomyTree> {
  const res = await fetch(`${BASE_URL}/api/v1/events/taxonomy`);
  if (!res.ok) throw new Error(`Failed to fetch taxonomy tree: ${res.status}`);
  return res.json();
}

export async function createTaxonomyNode(
  data: TaxonomyCreateRequest,
): Promise<TaxonomyNode> {
  const res = await fetch(`${BASE_URL}/api/v1/events/taxonomy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create taxonomy node: ${res.status}`);
  return res.json();
}
