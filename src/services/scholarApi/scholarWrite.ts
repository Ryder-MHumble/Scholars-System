import { fetchWithTimeout } from "@/services/requestUtils";
import { BASE_URL, SCHOLAR_WRITE_TIMEOUT_MS } from "./constants";
import {
  invalidateScholarListCache,
  buildScholarPayload,
  buildRelationPayload,
  normalizeScholarProjectFields,
} from "./helpers";
import type {
  AchievementsPatch,
  BatchScholarCreate,
  BatchScholarCreateResponse,
  NewScholarUpdate,
  RelationPatch,
  ScholarCreate,
  ScholarDetail,
  ScholarDetailPatch,
} from "./types";

// ====== Scholar write operations ======

export async function patchScholarRelation(
  urlHash: string,
  data: RelationPatch,
): Promise<ScholarDetail> {
  const payload = buildRelationPayload(data);
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/${urlHash}/relation`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`Failed to update relation: ${res.status}`);
  const updated: ScholarDetail = await res.json();
  invalidateScholarListCache();
  return normalizeScholarProjectFields(updated);
}

export async function patchScholarDetail(
  urlHash: string,
  data: ScholarDetailPatch,
): Promise<ScholarDetail> {
  const payload = buildScholarPayload(data);
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/${urlHash}/basic`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok)
    throw new Error(`Failed to update scholar detail: ${res.status}`);
  const updated: ScholarDetail = await res.json();
  invalidateScholarListCache();
  return normalizeScholarProjectFields(updated);
}

export async function postScholarUpdate(
  urlHash: string,
  data: NewScholarUpdate,
): Promise<ScholarDetail> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/${urlHash}/updates`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`Failed to post update: ${res.status}`);
  const updated: ScholarDetail = await res.json();
  invalidateScholarListCache();
  return normalizeScholarProjectFields(updated);
}

export async function deleteScholarUpdate(
  urlHash: string,
  updateIdx: number,
): Promise<ScholarDetail> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/${urlHash}/updates/${updateIdx}`,
    {
      method: "DELETE",
    },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`Failed to delete update: ${res.status}`);
  const updated: ScholarDetail = await res.json();
  invalidateScholarListCache();
  return normalizeScholarProjectFields(updated);
}

export async function patchScholarAchievements(
  urlHash: string,
  data: AchievementsPatch,
): Promise<ScholarDetail> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/${urlHash}/achievements`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`Failed to update achievements: ${res.status}`);
  const updated: ScholarDetail = await res.json();
  invalidateScholarListCache();
  return normalizeScholarProjectFields(updated);
}

// ====== Delete scholar ======

export async function deleteScholar(urlHash: string): Promise<void> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/${urlHash}`,
    {
      method: "DELETE",
    },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`Failed to delete scholar: ${res.status}`);
  invalidateScholarListCache();
}

// ====== Create scholars ======

export async function createScholar(
  data: ScholarCreate,
): Promise<ScholarDetail> {
  const payload = buildScholarPayload(data);
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok) {
    let detail = "";
    try {
      const payload = await res.json();
      detail = String(payload?.detail || "").trim();
    } catch {
      // ignore non-json response
    }
    throw new Error(
      detail
        ? `Failed to create scholar: ${res.status} (${detail})`
        : `Failed to create scholar: ${res.status}`,
    );
  }
  const created: ScholarDetail = await res.json();
  invalidateScholarListCache();
  return normalizeScholarProjectFields(created);
}

export async function batchCreateScholars(
  scholars: BatchScholarCreate[],
): Promise<BatchScholarCreateResponse> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/batch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scholars }),
    },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok)
    throw new Error(`Failed to batch create scholars: ${res.status}`);
  invalidateScholarListCache();
  return res.json();
}
