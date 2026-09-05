import { API_BASE_URL } from "@/services/apiBase";

export type PortraitRecordType = "scholar" | "student";
export type PortraitAssessmentStatus = "queued" | "running" | "completed" | "insufficient" | "needs_review" | "failed";

export interface PortraitTraitsPayload {
  entity_type: "student" | "expert";
  affiliation_scope: "internal" | "external" | "unknown";
  student_stage: "internal" | "applied" | "potential" | "unknown" | null;
  relationship_traits: Array<Record<string, unknown>>;
  human_judgments: Array<Record<string, unknown>>;
  confirmed_by: string;
  confirmed_at: string;
}

export interface PortraitDimension {
  section_code: string;
  dimension_code: string;
  dimension_label: string;
  display_order: number;
  weight: number | null;
  evidence_state: "positive" | "insufficient" | "negative";
  review_state: "clear" | "conflict";
  evaluation_method: "model_data" | "human_judgment" | "hybrid";
  score: number | null;
  confidence: number | null;
  conclusion: string;
  evidence?: unknown[];
  evidence_ids?: string[];
  missing_inputs: string[];
  conflict_reason: string | null;
}

export interface PortraitAssessment {
  id: string;
  source_record_type: PortraitRecordType;
  source_record_id: string;
  portrait_type: "potential_student" | "external_expert";
  status: PortraitAssessmentStatus;
  core_conclusion: string | null;
  weighted_score: number | null;
  evidence_coverage: number | null;
  recommendation_level: string | null;
  error_code: string | null;
  error_message: string | null;
  output_snapshot?: {
    analysis_status?: string;
    core_conclusion?: string;
    highlight_signals?: string[];
    recommendation_reasons?: string[];
    recommended_actions?: string[];
    missing_data?: string[];
    cooperation_message?: string | null;
  } | null;
  dimensions: PortraitDimension[];
}

export interface PortraitEnqueueResponse {
  id: string;
  status: PortraitAssessmentStatus;
  created: boolean;
}

export class PortraitApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "PortraitApiError";
  }
}

async function parseError(response: Response): Promise<Error> {
  try {
    const body = await response.json() as { error?: { message?: string }; detail?: string };
    return new PortraitApiError(body.error?.message || body.detail || `请求失败（${response.status}）`, response.status);
  } catch {
    return new PortraitApiError(`请求失败（${response.status}）`, response.status);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
  });
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<T>;
}

export function confirmPortraitTraits(recordType: PortraitRecordType, recordId: string, traits: PortraitTraitsPayload): Promise<unknown> {
  return request(`/api/subjects/${recordType}/${encodeURIComponent(recordId)}/traits`, {
    method: "PUT",
    body: JSON.stringify(traits),
  });
}

export function enqueuePortraitAssessment(recordType: PortraitRecordType, recordId: string, idempotencyKey: string): Promise<PortraitEnqueueResponse> {
  return request("/api/portrait-assessments", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ source_record_type: recordType, source_record_id: recordId, requested_by: "scholars-system" }),
  });
}

export function fetchPortraitAssessment(id: string, signal?: AbortSignal): Promise<PortraitAssessment> {
  return request(`/api/portrait-assessments/${encodeURIComponent(id)}`, { signal });
}

export function fetchLatestPortrait(recordType: PortraitRecordType, recordId: string, signal?: AbortSignal): Promise<PortraitAssessment> {
  return request(`/api/subjects/${recordType}/${encodeURIComponent(recordId)}/portraits/latest`, { signal });
}

export async function startPortraitAssessment(recordType: PortraitRecordType, recordId: string, traits: PortraitTraitsPayload): Promise<PortraitEnqueueResponse> {
  await confirmPortraitTraits(recordType, recordId, traits);
  const idempotencyKey = `portrait-${recordType}-${recordId}-v1`;
  return enqueuePortraitAssessment(recordType, recordId, idempotencyKey);
}
