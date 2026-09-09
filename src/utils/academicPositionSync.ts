import type { AcademicPosition, AcademicPositionCreate } from "@/services/scholarApi";

export type AcademicPositionDraft = AcademicPositionCreate & { id?: string };

function toPayload(draft: AcademicPositionDraft): AcademicPositionCreate {
  return {
    organization: draft.organization.trim(),
    department: draft.department?.trim() || null,
    title: draft.title.trim(),
    position_type: draft.position_type?.trim() || null,
    start_date: draft.start_date || null,
    end_date: draft.is_current ? null : draft.end_date || null,
    is_current: draft.is_current === true,
    description: draft.description?.trim() || null,
    source_url: draft.source_url?.trim() || null,
    source_type: draft.source_type?.trim() || null,
    source_record_id: draft.source_record_id?.trim() || null,
    evidence: draft.evidence,
    added_by: draft.added_by?.trim() || undefined,
  };
}

export function buildAcademicPositionSyncPlan(
  existing: AcademicPosition[],
  drafts: AcademicPositionDraft[],
): {
  creates: AcademicPositionCreate[];
  updates: Array<{ id: string; payload: AcademicPositionCreate }>;
  removeIds: string[];
} {
  const existingIds = new Set(existing.map((item) => item.id));
  const retainedIds = new Set(
    drafts
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id && existingIds.has(id))),
  );

  return {
    creates: drafts.filter((item) => !item.id).map(toPayload),
    updates: drafts
      .filter((item): item is AcademicPositionDraft & { id: string } =>
        Boolean(item.id && existingIds.has(item.id)),
      )
      .map((item) => ({ id: item.id, payload: toPayload(item) })),
    removeIds: existing
      .filter((item) => !retainedIds.has(item.id))
      .map((item) => item.id),
  };
}
