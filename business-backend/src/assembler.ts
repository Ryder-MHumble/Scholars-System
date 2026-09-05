import { readFile } from "node:fs/promises";
import { z } from "zod";
import type { DeanAgentClient, DeanAgentResponse } from "./deanAgent.js";
import {
  normalizedPortraitInputSchema,
  type NormalizedEvidence,
  type NormalizedPortraitInput,
  type PortraitType,
  type SourceRecordType,
  type TraitWrite,
} from "./domain.js";
import { asArray, asBoolean, asRecord, asString, sanitizeForAnalysis, sha256, stableJson } from "./utils.js";

const directionsSchema = z.object({
  version: z.string(),
  groups: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
      subfields: z.array(z.string()),
    }),
  ),
});

let directionCache: z.infer<typeof directionsSchema> | null = null;

async function loadDirections(): Promise<z.infer<typeof directionsSchema>> {
  if (directionCache) return directionCache;
  const text = await readFile(new URL("../config/academy-directions.v1.json", import.meta.url), "utf8");
  directionCache = directionsSchema.parse(JSON.parse(text));
  return directionCache;
}

function responseItems(response: DeanAgentResponse): { items: unknown[]; total: number; sourceUpdatedAt: string | null } {
  const body = asRecord(response.body);
  const nested = asRecord(body.data);
  const value = Object.keys(nested).length > 0 ? nested : body;
  const items = asArray(value.items ?? value.papers ?? value.results);
  const total = Number(value.total ?? items.length);
  const sourceUpdatedAt = asString(value.updated_at ?? value.metrics_updated_at) || null;
  return { items, total: Number.isFinite(total) ? total : items.length, sourceUpdatedAt };
}

function addEvidence(
  evidence: NormalizedEvidence[],
  sourceType: NormalizedEvidence["source_type"],
  sourceEndpoint: string,
  sourceId: string,
  sourcePath: string,
  observedAt: string,
  payload: unknown,
): void {
  const sanitized = sanitizeForAnalysis(payload);
  const safePayload = asRecord(sanitized);
  if (Object.keys(safePayload).length === 0) return;
  const evidenceId = `ev_${sha256(`${sourceType}|${sourceEndpoint}|${sourceId}|${sourcePath}|${stableJson(safePayload)}`).slice(0, 24)}`;
  if (evidence.some((item) => item.evidence_id === evidenceId)) return;
  evidence.push({
    evidence_id: evidenceId,
    source_type: sourceType,
    source_endpoint: sourceEndpoint,
    source_id: sourceId,
    source_path: sourcePath,
    observed_at: observedAt,
    payload: safePayload,
  });
}

function addArrayEvidence(
  evidence: NormalizedEvidence[],
  response: DeanAgentResponse,
  sourcePath: string,
  values: unknown,
): void {
  asArray(values).forEach((item, index) => {
    const record = asRecord(item);
    const sourceId = asString(
      record.id ?? record.publication_id ?? record.paper_id ?? record.project_id ??
      record.activity_id ?? record.scholar_id ?? record.student_id ?? record.target_key,
    ) || `${response.endpoint}#${index}`;
    addEvidence(evidence, "deanagent", response.endpoint, sourceId, `${sourcePath}/${index}`, response.fetchedAt, item);
  });
}

function profileFromDetail(detail: Record<string, unknown>): Record<string, unknown> {
  return {
    name: detail.name ?? detail.name_cn ?? detail.name_en ?? "",
    institution: detail.university ?? detail.home_university ?? detail.institution ?? detail.school ?? "",
    position: detail.position ?? detail.degree_type ?? detail.target_type ?? "",
    research_areas: detail.research_areas ?? detail.keywords ?? detail.major ?? [],
    education: detail.education ?? [],
    bio: detail.bio ?? detail.bio_en ?? "",
    profile_url: detail.profile_url ?? "",
    profile_links: detail.profile_links ?? {},
    github_url: detail.github_url ?? "",
    lab_url: detail.lab_url ?? "",
    has_email: asBoolean(detail.email),
    has_phone: asBoolean(detail.phone),
    source_updated_at: detail.updated_at ?? detail.metrics_updated_at ?? detail.relation_updated_at ?? null,
  };
}

function addDetailEvidence(evidence: NormalizedEvidence[], response: DeanAgentResponse, fallbackId: string): void {
  const detail = asRecord(response.body);
  const sourceId = asString(detail.id ?? detail.scholar_id ?? detail.student_id ?? detail.target_key) || fallbackId;
  addEvidence(evidence, "deanagent", response.endpoint, sourceId, "/profile", response.fetchedAt, profileFromDetail(detail));
  addEvidence(evidence, "deanagent", response.endpoint, sourceId, "/metrics", response.fetchedAt, {
    h_index: detail.h_index ?? null,
    citations_count: detail.citations_count ?? null,
    publications_count: detail.publications_count ?? detail.paper_count ?? null,
    metrics_updated_at: detail.metrics_updated_at ?? null,
  });
  addArrayEvidence(evidence, response, "/representative_publications", detail.representative_publications);
  addArrayEvidence(evidence, response, "/awards", detail.awards);
  addArrayEvidence(evidence, response, "/patents", detail.patents);
  addArrayEvidence(evidence, response, "/joint_research_projects", detail.joint_research_projects);
  addArrayEvidence(evidence, response, "/joint_management_roles", detail.joint_management_roles);
  addArrayEvidence(evidence, response, "/supervised_students", detail.supervised_students);
  addArrayEvidence(evidence, response, "/academic_exchange_records", detail.academic_exchange_records);
  addArrayEvidence(evidence, response, "/scholar_activities", detail.scholar_activities);
  addArrayEvidence(evidence, response, "/event_tags", detail.event_tags);
  addArrayEvidence(evidence, response, "/project_tags", detail.project_tags);
  addArrayEvidence(evidence, response, "/coauthors", detail.coauthors);
  if (asString(detail.institute_relation_notes)) {
    addEvidence(evidence, "deanagent", response.endpoint, sourceId, "/institute_relation_notes", response.fetchedAt, {
      content: detail.institute_relation_notes,
      updated_by: detail.relation_updated_by ?? "",
      updated_at: detail.relation_updated_at ?? null,
    });
  }
}

export interface AssembledInput {
  input: NormalizedPortraitInput;
  inputHash: string;
}

export async function assemblePortraitInput(
  client: DeanAgentClient,
  sourceRecordType: SourceRecordType,
  sourceRecordId: string,
  portraitType: PortraitType,
  traits: TraitWrite,
  now = new Date(),
): Promise<AssembledInput> {
  const responses =
    sourceRecordType === "scholar"
      ? await client.loadScholar(sourceRecordId)
      : sourceRecordType === "student"
        ? await client.loadStudent(sourceRecordId)
        : await client.loadAcademicStudent(sourceRecordId);
  const [detailResponse, relatedResponse] = responses;
  if (!detailResponse || !relatedResponse) throw new Error("DeanAgent returned an incomplete response set");

  const detail = asRecord(detailResponse.body);
  const profile = profileFromDetail(detail);
  const evidence: NormalizedEvidence[] = [];
  addDetailEvidence(evidence, detailResponse, sourceRecordId);

  const related = responseItems(relatedResponse);
  related.items.slice(0, 100).forEach((item, index) => {
    addEvidence(
      evidence,
      "deanagent",
      relatedResponse.endpoint,
      asString(
        asRecord(item).id ?? asRecord(item).publication_id ?? asRecord(item).paper_id ??
        asRecord(item).project_id ?? asRecord(item).activity_id,
      ) || `${relatedResponse.endpoint}#${index}`,
      `/items/${index}`,
      relatedResponse.fetchedAt,
      item,
    );
  });

  for (const relationship of traits.relationship_traits) {
    addEvidence(
      evidence,
      "business_trait",
      "business://talent_subject_trait_sets",
      relationship.source_id,
      relationship.source_path ?? `/relationships/${relationship.code}`,
      relationship.occurred_at ?? traits.confirmed_at,
      relationship,
    );
  }
  for (const judgment of traits.human_judgments) {
    addEvidence(
      evidence,
      "human_judgment",
      "business://talent_subject_trait_sets/human_judgments",
      judgment.id,
      `/human_judgments/${judgment.id}`,
      judgment.judged_at,
      judgment,
    );
  }

  const academyDirections = await loadDirections();
  addEvidence(
    evidence,
    "rubric_config",
    "git://business-backend/config/academy-directions.v1.json",
    `academy-directions:${academyDirections.version}`,
    "/academy_directions",
    now.toISOString(),
    academyDirections,
  );

  const hasEmail = asBoolean(detail.email);
  const hasPhone = asBoolean(detail.phone);
  const input = normalizedPortraitInputSchema.parse({
    schema_version: "portrait-input.v1",
    as_of: now.toISOString(),
    portrait_type: portraitType,
    subject: {
      source_system: "deanagent",
      source_record_type: sourceRecordType,
      source_record_id: sourceRecordId,
      entity_type: traits.entity_type,
      name: asString(profile.name),
      institution: asString(profile.institution),
      position: asString(profile.position),
      has_email: hasEmail,
      has_phone: hasPhone,
      contact_available: hasEmail || hasPhone,
    },
    traits,
    academy_directions: academyDirections,
    cooperation_eligible:
      portraitType === "external_expert" &&
      (traits.relationship_traits.length > 0 || traits.human_judgments.length > 0),
    evidence,
    source_manifest: responses.map((response, index) => {
      const relatedData = index === 0 ? { items: [response.body], total: 1, sourceUpdatedAt: asString(detail.updated_at) || null } : responseItems(response);
      return {
        endpoint: response.endpoint,
        fetched_at: response.fetchedAt,
        item_count: Math.min(relatedData.items.length, 100),
        truncated: relatedData.total > 100,
        source_updated_at: relatedData.sourceUpdatedAt,
      };
    }),
  });

  return { input, inputHash: sha256(stableJson(input)) };
}
