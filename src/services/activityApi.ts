const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8002"
  : "http://10.1.132.21:8001";

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
): Promise<ActivityListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (category) params.set("category", category);
  if (eventType) params.set("event_type", eventType);
  if (series) params.set("series", series);

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
  name: string;
  university?: string;
  department?: string;
  position?: string;
  email?: string;
  research_areas?: string[];
  photo_url?: string;
}

export async function fetchActivityScholars(
  eventId: string,
): Promise<ActivityScholarDetail[]> {
  const res = await fetch(`${BASE_URL}/api/v1/events/${eventId}/scholars`);
  if (!res.ok)
    throw new Error(`Failed to fetch activity scholars: ${res.status}`);
  return res.json();
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
