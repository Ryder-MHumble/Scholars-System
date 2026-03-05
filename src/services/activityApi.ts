const BASE_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_BASE_URL || "http://43.98.254.243:8002";

// List item (from GET /api/v1/events/)
export interface ActivityEvent {
  id: string;
  event_type: string;
  title: string;
  speaker_name: string;
  speaker_organization: string;
  event_date: string;
  location: string;
  series_number?: string;
  scholar_count: number;
  created_at: string;
}

// Full detail (from GET /api/v1/events/{id})
export interface ActivityEventDetail {
  id: string;
  event_type: string;
  series_number?: string;
  speaker_name: string;
  speaker_organization: string;
  speaker_position?: string;
  speaker_bio?: string;
  speaker_photo_url?: string;
  title: string;
  abstract?: string;
  event_date: string;
  duration?: number;
  location: string;
  scholar_ids: string[];
  publicity?: string;
  needs_email_invitation: boolean;
  certificate_number?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  audit_status: "pending" | "approved" | "rejected" | string;
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
  by_type: Array<{ event_type: string; count: number }>;
  by_month: Array<{ month: string; count: number }>;
  total_speakers: number;
  avg_duration: number;
}

export interface ActivityCreateRequest {
  event_type: string;
  series_number?: string;
  speaker_name: string;
  speaker_organization: string;
  speaker_position?: string;
  speaker_bio?: string;
  speaker_photo_url?: string;
  title: string;
  abstract?: string;
  event_date: string;
  duration?: number;
  location: string;
  scholar_ids?: string[];
  publicity?: string;
  needs_email_invitation?: boolean;
  certificate_number?: string;
  created_by?: string;
  audit_status?: string;
}

export interface ActivityUpdateRequest {
  event_type?: string;
  series_number?: string;
  speaker_name?: string;
  speaker_organization?: string;
  speaker_position?: string;
  speaker_bio?: string;
  speaker_photo_url?: string;
  title?: string;
  abstract?: string;
  event_date?: string;
  duration?: number;
  location?: string;
  scholar_ids?: string[];
  publicity?: string;
  needs_email_invitation?: boolean;
  certificate_number?: string;
  audit_status?: string;
  updated_by?: string;
}

export async function fetchActivities(
  page: number = 1,
  pageSize: number = 20,
  eventType?: string,
): Promise<ActivityListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (eventType) params.set("event_type", eventType);

  const res = await fetch(`${BASE_URL}/api/v1/events/?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch activities: ${res.status}`);
  return res.json();
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
  return res.json();
}

export async function createActivity(
  data: ActivityCreateRequest,
): Promise<ActivityEventDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/events/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create activity: ${res.status}`);
  return res.json();
}

export async function updateActivity(
  eventId: string,
  data: ActivityUpdateRequest,
): Promise<ActivityEventDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/events/${eventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update activity: ${res.status}`);
  return res.json();
}

export async function deleteActivity(eventId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/events/${eventId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete activity: ${res.status}`);
}

export async function fetchActivityScholars(
  eventId: string,
): Promise<Array<{ scholar_id: string; name: string }>> {
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
