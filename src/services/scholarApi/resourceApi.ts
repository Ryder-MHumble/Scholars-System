import { BASE_URL, SCHOLAR_WRITE_TIMEOUT_MS } from "./constants";
import type { AcademicPositionRecord } from "./types";

async function resourceRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    signal: init?.signal ?? AbortSignal.timeout(SCHOLAR_WRITE_TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Scholar resource request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

type PositionPayload = Omit<AcademicPositionRecord, "id" | "scholar_id">;

export function createAcademicPosition(
  scholarRef: string,
  position: PositionPayload,
): Promise<AcademicPositionRecord> {
  return resourceRequest<AcademicPositionRecord>(
    `/api/scholars/${encodeURIComponent(scholarRef)}/academic-positions`,
    { method: "POST", body: JSON.stringify(position) },
  );
}

export function updateAcademicPosition(
  scholarRef: string,
  id: string,
  position: Partial<PositionPayload>,
): Promise<AcademicPositionRecord> {
  return resourceRequest<AcademicPositionRecord>(
    `/api/scholars/${encodeURIComponent(scholarRef)}/academic-positions/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(position) },
  );
}

export function deleteAcademicPosition(scholarRef: string, id: string): Promise<void> {
  return resourceRequest<void>(
    `/api/scholars/${encodeURIComponent(scholarRef)}/academic-positions/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function batchCreateAcademicPositions(
  scholarRef: string,
  rows: PositionPayload[],
): Promise<unknown> {
  return resourceRequest(
    `/api/scholars/${encodeURIComponent(scholarRef)}/academic-positions/batch`,
    { method: "POST", body: JSON.stringify({ rows }) },
  );
}
