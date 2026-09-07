import { API_BASE_URL } from "@/services/apiBase";
import type {
  AcademicPosition,
  AcademicPositionCreate,
  AcademicPositionUpdate,
  BatchImportResponse,
  OpenSourceProject,
  OpenSourceProjectCreate,
  OpenSourceProjectUpdate,
  ResearchProject,
  ResearchProjectCreate,
  ResearchProjectUpdate,
  ScholarNews,
  ScholarNewsBatchRow,
  ScholarNewsCreate,
  ScholarNewsUpdate,
} from "@/services/scholarApi/types";

type ResourcePath =
  | "news"
  | "research-projects"
  | "open-source-projects"
  | "academic-positions";

function collectionUrl(scholarRef: string, resource: ResourcePath): string {
  return `${API_BASE_URL}/api/scholars/${encodeURIComponent(scholarRef)}/${resource}`;
}

function itemUrl(scholarRef: string, resource: ResourcePath, itemId: string): string {
  return `${collectionUrl(scholarRef, resource)}/${encodeURIComponent(itemId)}`;
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail.trim();
    }
    if (Array.isArray(payload.detail)) {
      const messages = payload.detail.map((item) => {
        if (item && typeof item === "object") {
          const detail = item as { loc?: unknown; msg?: unknown };
          const location = Array.isArray(detail.loc) ? detail.loc.join(".") : "";
          const message = typeof detail.msg === "string" ? detail.msg : "";
          if (location && message) return `${location}: ${message}`;
        }
        return JSON.stringify(item);
      });
      if (messages.length > 0) return messages.join("; ");
    }
    if (payload.detail != null) {
      return JSON.stringify(payload.detail);
    }
  } catch {
    // Fall back to the HTTP status for non-JSON responses.
  }
  return `HTTP ${response.status}: ${response.statusText}`;
}

async function requestJson<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

function get<T>(url: string): Promise<T> {
  return requestJson<T>(url, { method: "GET" });
}

function send<T>(url: string, method: "POST" | "PATCH", body: unknown): Promise<T> {
  return requestJson<T>(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function remove(url: string): Promise<void> {
  return requestJson<void>(url, { method: "DELETE" });
}

export function fetchScholarNews(scholarRef: string): Promise<ScholarNews[]> {
  return get(collectionUrl(scholarRef, "news"));
}

export function createScholarNews(
  scholarRef: string,
  payload: ScholarNewsCreate,
): Promise<ScholarNews> {
  return send(collectionUrl(scholarRef, "news"), "POST", payload);
}

export function batchScholarNews(
  scholarRef: string,
  rows: ScholarNewsBatchRow[],
): Promise<BatchImportResponse> {
  return send(`${collectionUrl(scholarRef, "news")}/batch`, "POST", { rows });
}

export function updateScholarNews(
  scholarRef: string,
  newsId: string,
  payload: ScholarNewsUpdate,
): Promise<ScholarNews> {
  return send(itemUrl(scholarRef, "news", newsId), "PATCH", payload);
}

export function deleteScholarNews(scholarRef: string, newsId: string): Promise<void> {
  return remove(itemUrl(scholarRef, "news", newsId));
}

export function fetchResearchProjects(scholarRef: string): Promise<ResearchProject[]> {
  return get(collectionUrl(scholarRef, "research-projects"));
}

export function createResearchProject(
  scholarRef: string,
  payload: ResearchProjectCreate,
): Promise<ResearchProject> {
  return send(collectionUrl(scholarRef, "research-projects"), "POST", payload);
}

export function batchResearchProjects(
  scholarRef: string,
  rows: ResearchProjectCreate[],
): Promise<BatchImportResponse> {
  return send(`${collectionUrl(scholarRef, "research-projects")}/batch`, "POST", { rows });
}

export function updateResearchProject(
  scholarRef: string,
  projectId: string,
  payload: ResearchProjectUpdate,
): Promise<ResearchProject> {
  return send(itemUrl(scholarRef, "research-projects", projectId), "PATCH", payload);
}

export function deleteResearchProject(scholarRef: string, projectId: string): Promise<void> {
  return remove(itemUrl(scholarRef, "research-projects", projectId));
}

export function fetchOpenSourceProjects(scholarRef: string): Promise<OpenSourceProject[]> {
  return get(collectionUrl(scholarRef, "open-source-projects"));
}

export function createOpenSourceProject(
  scholarRef: string,
  payload: OpenSourceProjectCreate,
): Promise<OpenSourceProject> {
  return send(collectionUrl(scholarRef, "open-source-projects"), "POST", payload);
}

export function batchOpenSourceProjects(
  scholarRef: string,
  rows: OpenSourceProjectCreate[],
): Promise<BatchImportResponse> {
  return send(`${collectionUrl(scholarRef, "open-source-projects")}/batch`, "POST", { rows });
}

export function updateOpenSourceProject(
  scholarRef: string,
  projectId: string,
  payload: OpenSourceProjectUpdate,
): Promise<OpenSourceProject> {
  return send(itemUrl(scholarRef, "open-source-projects", projectId), "PATCH", payload);
}

export function deleteOpenSourceProject(scholarRef: string, projectId: string): Promise<void> {
  return remove(itemUrl(scholarRef, "open-source-projects", projectId));
}

export function fetchAcademicPositions(scholarRef: string): Promise<AcademicPosition[]> {
  return get(collectionUrl(scholarRef, "academic-positions"));
}

export function createAcademicPosition(
  scholarRef: string,
  payload: AcademicPositionCreate,
): Promise<AcademicPosition> {
  return send(collectionUrl(scholarRef, "academic-positions"), "POST", payload);
}

export function batchAcademicPositions(
  scholarRef: string,
  rows: AcademicPositionCreate[],
): Promise<BatchImportResponse> {
  return send(`${collectionUrl(scholarRef, "academic-positions")}/batch`, "POST", { rows });
}

export function updateAcademicPosition(
  scholarRef: string,
  positionId: string,
  payload: AcademicPositionUpdate,
): Promise<AcademicPosition> {
  return send(itemUrl(scholarRef, "academic-positions", positionId), "PATCH", payload);
}

export function deleteAcademicPosition(scholarRef: string, positionId: string): Promise<void> {
  return remove(itemUrl(scholarRef, "academic-positions", positionId));
}
