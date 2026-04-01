import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Edit2,
  GraduationCap,
  Handshake,
  Link2,
  NotebookPen,
  PencilLine,
  Plus,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { BaseModal } from "@/components/common/BaseModal";
import { DeleteConfirmDialog } from "@/components/institution/detail/DeleteConfirmDialog";
import { EditInstitutionModal } from "@/components/institution/detail/EditInstitutionModal";
import {
  CategoryBadge,
  PriorityBadge,
  Tag,
} from "@/components/institution/detail/InstitutionBadges";
import { LeadershipCardList, PersonList } from "@/components/institution/detail/PersonComponents";
import { UniversityLogo } from "@/components/institution/detail/UniversityLogo";
import {
  deleteInstitution,
  fetchInstitutionDetail,
  fetchInstitutionLeadership,
  patchInstitution,
} from "@/services/institutionApi";
import {
  fetchScholarUniversities,
  type ScholarUniversityItem,
} from "@/services/scholarApi";
import {
  fetchEnabledTechnologySources,
  fetchTechnologyArticlesBySourceIds,
  fetchUniversityFeedBySourceIds,
  fetchUniversitySourcesWithData,
  type SourceConfigItem,
  type UniversityFeedItem,
  type UniversitySourceItem,
} from "@/services/institutionActivityApi";
import type { InstitutionDetail, LeadershipDetailResponse } from "@/types/institution";

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

const COBUILD_TIMELINE_KEY = "academy_cobuild_timeline_v1";

type CobuildTimelineItem = {
  id: string;
  happened_on: string;
  title: string;
  detail: string;
  participants?: string;
  scene?: string;
  source_url?: string;
};

type CobuildTimelineDraft = {
  happened_on: string;
  title: string;
  detail: string;
  participants: string;
  scene: string;
  source_url: string;
};

const EMPTY_COBUILD_DRAFT: CobuildTimelineDraft = {
  happened_on: "",
  title: "",
  detail: "",
  participants: "",
  scene: "",
  source_url: "",
};

type InstitutionDynamicFeedItem = {
  id: string;
  category: string;
  title: string;
  summary: string;
  meta: string;
  url?: string;
  source_name?: string;
  published_at?: string | null;
  cover_image_url?: string;
};

const COMPANY_SOURCE_ID_ALIASES: Record<string, string[]> = {
  google_deepmind_blog: ["google", "谷歌", "deepmind"],
  meta_ai_blog: ["meta", "facebook", "脸书"],
  microsoft_ai_blog: ["microsoft", "微软"],
  openai_blog: ["openai"],
  anthropic_blog: ["anthropic"],
  mistral_ai_news: ["mistral", "mistralai"],
  xai_blog: ["xai", "x.ai"],
  cohere_blog: ["cohere"],
  stability_ai_news: ["stabilityai", "stability"],
  huggingface_blog: ["huggingface"],
  runway_blog: ["runway"],
  inflection_ai_blog: ["inflection", "inflectionai"],
  qwen_blog: ["阿里", "阿里巴巴", "alibaba", "qwen", "通义千问"],
  minimax_news: ["minimax"],
  moonshot_research: ["月之暗面", "moonshot", "kimi"],
  hunyuan_news: ["腾讯", "tencent", "混元", "hunyuan"],
  zhipu_news: ["智谱", "智谱ai", "zhipu"],
};

const INSTITUTION_EXTRA_ALIASES: Record<string, string[]> = {
  google: ["google", "谷歌", "deepmind"],
  meta: ["meta", "facebook", "脸书"],
  microsoft: ["microsoft", "微软"],
  腾讯: ["腾讯", "tencent", "混元", "hunyuan"],
  阿里巴巴: ["阿里", "阿里巴巴", "alibaba", "qwen", "通义千问"],
  月之暗面: ["月之暗面", "moonshot", "kimi"],
  智谱AI: ["智谱", "智谱ai", "zhipu"],
};

function normalizeEntityText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[（）()【】\[\]\s\-—_.,，。·/:|\\]/g, "")
    .trim();
}

function sourceNameCandidates(value: string): string[] {
  const raw = value.trim();
  if (!raw) return [];
  const candidates = new Set<string>([raw]);
  for (const sep of ["-", "—", "|", "｜", "（", "("]) {
    if (raw.includes(sep)) {
      candidates.add(raw.split(sep, 1)[0].trim());
    }
  }
  return Array.from(candidates);
}

function institutionAliasTokens(institution: InstitutionDetail): string[] {
  const rawTokens = new Set<string>();
  const name = institution.name || "";
  const orgName = institution.org_name || "";
  rawTokens.add(name);
  if (orgName) rawTokens.add(orgName);

  const extra = INSTITUTION_EXTRA_ALIASES[name];
  if (Array.isArray(extra)) {
    extra.forEach((item) => rawTokens.add(item));
  }

  const normalizedTokens = Array.from(rawTokens)
    .map((token) => normalizeEntityText(token))
    .filter((token) => token.length >= 2);

  return Array.from(new Set(normalizedTokens));
}

function tokenMatchesInstitution(token: string, institutionTokens: string[]): boolean {
  if (!token) return false;
  for (const instToken of institutionTokens) {
    if (token === instToken) return true;
    if (token.length >= 4 && instToken.includes(token)) return true;
    if (instToken.length >= 4 && token.includes(instToken)) return true;
  }
  return false;
}

function matchUniversitySourcesToInstitution(
  institution: InstitutionDetail,
  sources: UniversitySourceItem[],
): UniversitySourceItem[] {
  const instTokens = institutionAliasTokens(institution);
  return sources.filter((source) => {
    const sourceTokens = sourceNameCandidates(source.source_name)
      .map((item) => normalizeEntityText(item))
      .filter((item) => item.length >= 2);
    return sourceTokens.some((token) => tokenMatchesInstitution(token, instTokens));
  });
}

function matchTechnologySourcesToInstitution(
  institution: InstitutionDetail,
  sources: SourceConfigItem[],
): SourceConfigItem[] {
  const instTokens = institutionAliasTokens(institution);
  return sources.filter((source) => {
    const aliasTokens = (COMPANY_SOURCE_ID_ALIASES[source.id] || [])
      .map((item) => normalizeEntityText(item))
      .filter((item) => item.length >= 2);
    if (aliasTokens.some((token) => tokenMatchesInstitution(token, instTokens))) {
      return true;
    }
    const sourceTokens = sourceNameCandidates(source.name)
      .map((item) => normalizeEntityText(item))
      .filter((item) => item.length >= 2);
    return sourceTokens.some((token) => tokenMatchesInstitution(token, instTokens));
  });
}

function toCompactDateLabel(value?: string | null): string {
  if (!value) return "未知时间";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) {
    return value;
  }
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toSummary(text?: string | null, fallback?: string): string {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) return fallback || "暂无摘要";
  if (raw.length <= 120) return raw;
  return `${raw.slice(0, 120)}...`;
}

function toSafeImageUrl(value?: string | null): string | undefined {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return undefined;
}

function resolveUniversityCoverImage(item: UniversityFeedItem): string | undefined {
  const thumbnail = toSafeImageUrl(item.thumbnail);
  if (thumbnail) return thumbnail;
  if (Array.isArray(item.images)) {
    const first = item.images.find((image) => toSafeImageUrl(image?.src));
    if (first?.src) {
      return toSafeImageUrl(first.src);
    }
  }
  return undefined;
}

function parsePublishedTimestamp(value?: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return Number.NEGATIVE_INFINITY;
  return ts;
}

function buildManualInstitutionFeeds(institution: InstitutionDetail): InstitutionDynamicFeedItem[] {
  const feeds: InstitutionDynamicFeedItem[] = [
    ...(institution.recruitment_events || []).map((text, idx) => ({
      id: `manual-recruitment-${idx}`,
      category: "招募活动",
      title: text,
      summary: toSummary(text),
      meta: "机构维护字段",
    })),
    ...(institution.visit_exchanges || []).map((text, idx) => ({
      id: `manual-visit-${idx}`,
      category: "访问交流",
      title: text,
      summary: toSummary(text),
      meta: "机构维护字段",
    })),
    ...(institution.cooperation_focus || []).map((text, idx) => ({
      id: `manual-focus-${idx}`,
      category: "合作重点",
      title: text,
      summary: `围绕「${text}」推进联合培养、科研协同和学术交流。`,
      meta: "机构维护字段",
    })),
  ];
  return feeds;
}

function formatTimelineDate(value: string): string {
  const token = String(value || "").trim();
  const monthMatch = token.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) return `${monthMatch[1]}年${monthMatch[2]}月`;
  return token || "未填写时间";
}

function normalizeTimelineDate(value: string): string {
  const raw = String(value || "").trim();
  const match = raw.match(/(\d{4})[^\d]?(\d{1,2})/);
  if (!match) return raw;
  const year = match[1];
  const month = String(Math.max(1, Math.min(12, Number(match[2])))).padStart(2, "0");
  return `${year}-${month}`;
}

function parseCobuildTimeline(rawCustomFields: InstitutionDetail["custom_fields"]): CobuildTimelineItem[] {
  const raw = rawCustomFields?.[COBUILD_TIMELINE_KEY];
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const result: CobuildTimelineItem[] = [];
    parsed.forEach((item, idx) => {
      if (!item || typeof item !== "object") return;
      const obj = item as Record<string, unknown>;
      const title = String(obj.title ?? "").trim();
      const detail = String(obj.detail ?? "").trim();
      if (!title || !detail) return;
      const happenedOn = normalizeTimelineDate(String(obj.happened_on ?? ""));
      result.push({
        id: String(obj.id ?? `${happenedOn}-${idx}`),
        happened_on: happenedOn,
        title,
        detail,
        participants: String(obj.participants ?? "").trim() || undefined,
        scene: String(obj.scene ?? "").trim() || undefined,
        source_url: String(obj.source_url ?? "").trim() || undefined,
      });
    });
    result.sort((a, b) => {
      const aKey = a.happened_on || "";
      const bKey = b.happened_on || "";
      if (aKey === bKey) return b.id.localeCompare(a.id);
      return bKey.localeCompare(aKey);
    });
    return result;
  } catch {
    return [];
  }
}

function serializeCobuildTimeline(items: CobuildTimelineItem[]): string {
  const normalized = items.map((item) => ({
    id: item.id,
    happened_on: normalizeTimelineDate(item.happened_on),
    title: item.title.trim(),
    detail: item.detail.trim(),
    participants: item.participants?.trim() || "",
    scene: item.scene?.trim() || "",
    source_url: item.source_url?.trim() || "",
  }));
  return JSON.stringify(normalized);
}

function resolveYearStudentMetrics(institution: InstitutionDetail): Array<{ year: string; value: number }> {
  const merged = new Map<string, number>();

  const yearMap = institution.student_counts_by_year ?? {};
  for (const [year, value] of Object.entries(yearMap)) {
    if (!/^\d{4}$/.test(year)) continue;
    const count = Number(value ?? 0);
    if (!Number.isFinite(count) || count <= 0) continue;
    merged.set(year, count);
  }

  if (!merged.has("2024")) {
    const c24 = Number(institution.student_count_24 ?? 0);
    if (Number.isFinite(c24) && c24 > 0) merged.set("2024", c24);
  }
  if (!merged.has("2025")) {
    const c25 = Number(institution.student_count_25 ?? 0);
    if (Number.isFinite(c25) && c25 > 0) merged.set("2025", c25);
  }

  return Array.from(merged.entries())
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, value]) => ({ year, value }));
}

function applyUnifiedScholarCounts(
  institution: InstitutionDetail,
  hierarchyOrganizations: ScholarUniversityItem[],
): InstitutionDetail {
  const matchedHierarchy =
    hierarchyOrganizations.find(
      (item) => item.institution_id && item.institution_id === institution.id,
    ) ??
    hierarchyOrganizations.find(
      (item) => normalizeName(item.university) === normalizeName(institution.name),
    );

  if (!matchedHierarchy) return institution;

  const hierarchyDeptById = new Map<string, { name: string; scholar_count: number }>();
  const hierarchyDeptByName = new Map<string, { id?: string; scholar_count: number }>();
  for (const dept of matchedHierarchy.departments ?? []) {
    const deptName = String(dept.name ?? "").trim();
    if (!deptName) continue;
    if (dept.id) hierarchyDeptById.set(dept.id, { name: deptName, scholar_count: dept.scholar_count });
    hierarchyDeptByName.set(normalizeName(deptName), {
      id: dept.id,
      scholar_count: dept.scholar_count,
    });
  }

  const mergedDepartments = (institution.departments ?? []).map((dept) => {
    const byId = dept.id ? hierarchyDeptById.get(dept.id) : undefined;
    const byName = hierarchyDeptByName.get(normalizeName(dept.name));
    const matched = byId ?? byName;
    if (!matched) return dept;
    return {
      ...dept,
      scholar_count: matched.scholar_count,
    };
  });

  const existingDeptIds = new Set(mergedDepartments.map((dept) => dept.id).filter(Boolean));
  const existingDeptNames = new Set(
    mergedDepartments
      .map((dept) => normalizeName(dept.name))
      .filter((name) => name.length > 0),
  );

  for (const dept of matchedHierarchy.departments ?? []) {
    const deptName = String(dept.name ?? "").trim();
    if (!deptName) continue;
    if (dept.id && existingDeptIds.has(dept.id)) continue;
    if (existingDeptNames.has(normalizeName(deptName))) continue;

    mergedDepartments.push({
      id: dept.id ?? `${institution.id}::${deptName}`,
      name: deptName,
      org_name: null,
      parent_id: institution.id,
      scholar_count: dept.scholar_count,
      sources: [],
    });
  }

  return {
    ...institution,
    scholar_count: matchedHierarchy.scholar_count,
    departments: mergedDepartments,
  };
}

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState<InstitutionDetail | null>(null);
  const [leadership, setLeadership] = useState<LeadershipDetailResponse | null>(null);
  const [leadershipLoading, setLeadershipLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [timelineSaving, setTimelineSaving] = useState(false);
  const [timelineDraft, setTimelineDraft] = useState<CobuildTimelineDraft>(EMPTY_COBUILD_DRAFT);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState<"activities" | "leadership" | "departments" | "timeline">("activities");
  const switchWorkbenchTab = useCallback(
    (tab: "activities" | "leadership" | "departments" | "timeline") => {
      setActiveWorkbenchTab(tab);
    },
    [],
  );

  const from = (location.state as { from?: { pathname?: string; search?: string } })
    ?.from;
  const restoreInstitutionListState = (
    location.state as { restoreInstitutionListState?: unknown }
  )?.restoreInstitutionListState;

  const backHref =
    from?.pathname && from.pathname !== ""
      ? `${from.pathname}${from.search ?? ""}`
      : window.sessionStorage.getItem("institution_list_return_to") ??
        "/?tab=institutions";

  const goBackToList = () => {
    if (restoreInstitutionListState) {
      navigate(backHref, { state: { restoreInstitutionListState } });
      return;
    }
    navigate(backHref);
  };

  const loadInstitutionData = useCallback(async (
    institutionId: string,
    options?: { showPageLoading?: boolean },
  ) => {
    const showPageLoading = options?.showPageLoading ?? true;
    if (showPageLoading) setLoading(true);
    setLeadershipLoading(true);
    try {
      const [institutionDetail, leadershipDetail, hierarchyOrganizations] =
        await Promise.all([
          fetchInstitutionDetail(institutionId),
          fetchInstitutionLeadership(institutionId).catch(() => null),
          fetchScholarUniversities().catch(() => [] as ScholarUniversityItem[]),
        ]);
      setInstitution(
        applyUnifiedScholarCounts(institutionDetail, hierarchyOrganizations),
      );
      setLeadership(leadershipDetail);
    } catch {
      setInstitution(null);
    } finally {
      if (showPageLoading) setLoading(false);
      setLeadershipLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    void loadInstitutionData(id);
  }, [id, loadInstitutionData]);

  const cobuildTimeline = useMemo(
    () => parseCobuildTimeline(institution?.custom_fields),
    [institution?.custom_fields],
  );
  const leadershipCount = leadership?.leader_count ?? leadership?.leaders?.length ?? 0;
  const departmentCount = institution?.departments?.length ?? 0;
  const timelineCount = cobuildTimeline.length;
  const activitiesCount =
    (institution?.recruitment_events?.length ?? 0) +
    (institution?.visit_exchanges?.length ?? 0) +
    (institution?.cooperation_focus?.length ?? 0);

  async function handleDelete() {
    if (!institution) return;
    await deleteInstitution(institution.id);
    goBackToList();
  }

  const openCreateTimeline = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    setEditingTimelineId(null);
    setTimelineDraft({
      ...EMPTY_COBUILD_DRAFT,
      happened_on: `${now.getFullYear()}-${month}`,
    });
    setTimelineModalOpen(true);
  };

  const openEditTimeline = (item: CobuildTimelineItem) => {
    setEditingTimelineId(item.id);
    setTimelineDraft({
      happened_on: item.happened_on,
      title: item.title,
      detail: item.detail,
      participants: item.participants ?? "",
      scene: item.scene ?? "",
      source_url: item.source_url ?? "",
    });
    setTimelineModalOpen(true);
  };

  const closeTimelineModal = () => {
    if (timelineSaving) return;
    setTimelineModalOpen(false);
    setEditingTimelineId(null);
    setTimelineDraft(EMPTY_COBUILD_DRAFT);
  };

  const persistTimeline = async (nextTimeline: CobuildTimelineItem[]) => {
    if (!institution) return;
    setTimelineSaving(true);
    try {
      const mergedCustomFields = {
        ...(institution.custom_fields ?? {}),
        [COBUILD_TIMELINE_KEY]: serializeCobuildTimeline(nextTimeline),
      };
      await patchInstitution(institution.id, {
        custom_fields: mergedCustomFields,
      });
      setInstitution((prev) => (
        prev
          ? {
              ...prev,
              custom_fields: mergedCustomFields,
            }
          : prev
      ));
      setTimelineModalOpen(false);
      setEditingTimelineId(null);
      setTimelineDraft(EMPTY_COBUILD_DRAFT);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "保存共建纪要失败");
    } finally {
      setTimelineSaving(false);
    }
  };

  const handleSaveTimeline = async () => {
    const happenedOn = normalizeTimelineDate(timelineDraft.happened_on);
    const title = timelineDraft.title.trim();
    const detail = timelineDraft.detail.trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(happenedOn)) {
      window.alert("请填写有效时间，格式如 2025-10");
      return;
    }
    if (!title) {
      window.alert("请填写事件标题");
      return;
    }
    if (!detail) {
      window.alert("请填写事件内容");
      return;
    }

    const nextItem: CobuildTimelineItem = {
      id: editingTimelineId ?? `${Date.now()}`,
      happened_on: happenedOn,
      title,
      detail,
      participants: timelineDraft.participants.trim() || undefined,
      scene: timelineDraft.scene.trim() || undefined,
      source_url: timelineDraft.source_url.trim() || undefined,
    };

    let nextTimeline: CobuildTimelineItem[];
    if (editingTimelineId) {
      nextTimeline = cobuildTimeline.map((item) => (
        item.id === editingTimelineId ? nextItem : item
      ));
    } else {
      nextTimeline = [nextItem, ...cobuildTimeline];
    }
    nextTimeline.sort((a, b) => b.happened_on.localeCompare(a.happened_on));
    await persistTimeline(nextTimeline);
  };

  const handleDeleteTimeline = async (item: CobuildTimelineItem) => {
    if (timelineSaving) return;
    if (!window.confirm(`确认删除「${item.title}」吗？`)) return;
    const nextTimeline = cobuildTimeline.filter((entry) => entry.id !== item.id);
    await persistTimeline(nextTimeline);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-3 font-medium">机构不存在或加载失败</p>
          <button
            onClick={goBackToList}
            className="text-blue-600 hover:underline text-sm"
          >
            ← 返回机构库
          </button>
        </div>
      </div>
    );
  }

  const hasLeadership = (leadership?.leaders?.length ?? 0) > 0;

  const hasCooperation =
    (institution.key_departments?.length ?? 0) > 0 ||
    (institution.joint_labs?.length ?? 0) > 0 ||
    (institution.training_cooperation?.length ?? 0) > 0 ||
    (institution.academic_cooperation?.length ?? 0) > 0 ||
    (institution.talent_dual_appointment?.length ?? 0) > 0;

  const yearStudentMetrics = resolveYearStudentMetrics(institution);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <div className="max-w-[1680px] mx-auto px-3 md:px-5 py-4 md:py-6 space-y-5">
        <HeroHeader
          institution={institution}
          yearStudentMetrics={yearStudentMetrics}
          onOpenScholarList={() =>
            navigate(`/?tab=scholars&university=${encodeURIComponent(institution.name)}`)
          }
          onOpenStudentYear={(year) =>
            navigate(
              `/?tab=students&subtab=student_grade_${year}&university=${encodeURIComponent(institution.name)}`,
            )
          }
          onOpenStudentAll={() =>
            navigate(`/?tab=students&subtab=student_all&university=${encodeURIComponent(institution.name)}`)
          }
          onBack={goBackToList}
          onEdit={() => setEditOpen(true)}
          onDelete={() => setDeleteOpen(true)}
        />

        <div className="space-y-4 md:space-y-5">
          <main className="space-y-4 md:space-y-5">
            <SectionCard
              icon={NotebookPen}
              showHeader={false}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="grid w-full grid-cols-4 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => switchWorkbenchTab("activities")}
                    className={
                      activeWorkbenchTab === "activities"
                        ? "min-w-0 px-2 py-1.5 rounded-lg text-[13px] md:text-sm font-semibold bg-white text-blue-700 shadow-sm whitespace-nowrap"
                        : "min-w-0 px-2 py-1.5 rounded-lg text-[13px] md:text-sm font-medium text-slate-600 hover:text-slate-800 whitespace-nowrap"
                    }
                  >
                    机构动态
                    <span className="ml-1 text-[11px] md:text-xs opacity-80">({activitiesCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchWorkbenchTab("leadership")}
                    className={
                      activeWorkbenchTab === "leadership"
                        ? "min-w-0 px-2 py-1.5 rounded-lg text-[13px] md:text-sm font-semibold bg-white text-blue-700 shadow-sm whitespace-nowrap"
                        : "min-w-0 px-2 py-1.5 rounded-lg text-[13px] md:text-sm font-medium text-slate-600 hover:text-slate-800 whitespace-nowrap"
                    }
                  >
                    领导信息
                    <span className="ml-1 text-[11px] md:text-xs opacity-80">({leadershipCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchWorkbenchTab("departments")}
                    className={
                      activeWorkbenchTab === "departments"
                        ? "min-w-0 px-2 py-1.5 rounded-lg text-[13px] md:text-sm font-semibold bg-white text-blue-700 shadow-sm whitespace-nowrap"
                        : "min-w-0 px-2 py-1.5 rounded-lg text-[13px] md:text-sm font-medium text-slate-600 hover:text-slate-800 whitespace-nowrap"
                    }
                  >
                    二级机构
                    <span className="ml-1 text-[11px] md:text-xs opacity-80">({departmentCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchWorkbenchTab("timeline")}
                    className={
                      activeWorkbenchTab === "timeline"
                        ? "min-w-0 px-2 py-1.5 rounded-lg text-[13px] md:text-sm font-semibold bg-white text-blue-700 shadow-sm whitespace-nowrap"
                        : "min-w-0 px-2 py-1.5 rounded-lg text-[13px] md:text-sm font-medium text-slate-600 hover:text-slate-800 whitespace-nowrap"
                    }
                  >
                    两院共建纪要
                    <span className="ml-1 text-[11px] md:text-xs opacity-80">({timelineCount})</span>
                  </button>
                </div>

                {activeWorkbenchTab === "timeline" && (
                  <button
                    onClick={openCreateTimeline}
                    disabled={timelineSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Plus className="w-4 h-4" />
                    新增纪要
                  </button>
                )}
              </div>

              <div className="mt-3 min-h-[320px]">
                {activeWorkbenchTab === "activities" && (
                  <InstitutionActivityPanel institution={institution} />
                )}

                {activeWorkbenchTab === "leadership" && (
                  <>
                    {leadershipLoading ? (
                      <EmptyState text="领导信息加载中..." />
                    ) : !hasLeadership ? (
                      <EmptyState text="暂无院领导数据" />
                    ) : (
                      <LeadershipCardList leaders={leadership?.leaders || []} />
                    )}
                  </>
                )}

                {activeWorkbenchTab === "departments" && (
                  <>
                    {(institution.departments?.length ?? 0) > 0 ? (
                      <DepartmentList
                        departments={institution.departments || []}
                        onOpenDepartment={(departmentName) =>
                          navigate(
                            `/?tab=scholars&university=${encodeURIComponent(institution.name)}&department=${encodeURIComponent(departmentName)}`,
                          )
                        }
                      />
                    ) : (
                      <EmptyState text="暂无院系数据" />
                    )}
                  </>
                )}

                {activeWorkbenchTab === "timeline" && (
                  <>
                    <div className="mb-3 rounded-2xl border border-slate-200 bg-[linear-gradient(145deg,#f8fafc_0%,#ffffff_60%)] p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-slate-800">共建纪要时间线</p>
                          <p className="mt-1 text-sm text-slate-500">
                            沉淀机构与两院合作历程，建议按“时间-事件-成效”结构记录，便于复盘与展示。
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            <ClipboardList className="w-3.5 h-3.5" />
                            共 {timelineCount} 条纪要
                          </span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
                            按时间倒序
                          </span>
                        </div>
                      </div>
                    </div>
                    {cobuildTimeline.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-blue-200 bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_58%,#ffffff_100%)] px-6 py-12 text-center">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-center justify-center">
                          <CalendarClock className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="mt-4 text-[15px] font-semibold text-slate-800">暂无共建纪要</p>
                        <p className="mt-1.5 text-sm text-slate-500">可先录入近一年的重点合作事件，逐步形成完整时间线。</p>
                        <button
                          type="button"
                          onClick={openCreateTimeline}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4" />
                          立即新增第一条
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {cobuildTimeline.map((item, idx) => (
                          <motion.article
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                            className="relative rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/70 p-3.5 md:p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start gap-3.5">
                              <div className="shrink-0 w-[72px] rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex flex-col items-center justify-center py-2.5">
                                <CalendarClock className="w-3.5 h-3.5 mb-1.5" />
                                <span className="text-[11px] font-semibold">{formatTimelineDate(item.happened_on)}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <h3 className="text-[15px] font-bold text-slate-800 leading-snug">{item.title}</h3>
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openEditTimeline(item)}
                                      disabled={timelineSaving}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-slate-200 text-slate-700 hover:bg-white"
                                    >
                                      <PencilLine className="w-3 h-3" />
                                      编辑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteTimeline(item)}
                                      disabled={timelineSaving}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      删除
                                    </button>
                                  </div>
                                </div>
                                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                  {item.detail}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                  {item.participants && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                                      参与：{item.participants}
                                    </span>
                                  )}
                                  {item.scene && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                                      场景：{item.scene}
                                    </span>
                                  )}
                                  {item.source_url && (
                                    <a
                                      href={item.source_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                                    >
                                      <Link2 className="w-3 h-3" />
                                      参考链接
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.article>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </SectionCard>

            {hasCooperation && (
              <SectionCard title="合作网络" icon={Handshake}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <SubBlock title="重点合作院系" items={institution.key_departments || []} />
                  <SubBlock title="联合实验室" items={institution.joint_labs || []} />
                  <SubBlock title="培养合作" items={institution.training_cooperation || []} />
                  <SubBlock title="学术合作" items={institution.academic_cooperation || []} />
                  <div className="md:col-span-2">
                    <SubBlock title="人才双聘" items={institution.talent_dual_appointment || []} />
                  </div>
                </div>
              </SectionCard>
            )}

            {(institution.notable_scholars?.length ?? 0) > 0 && (
              <SectionCard
                title="知名学者"
                icon={Users}
                count={institution.notable_scholars?.length ?? 0}
                compact
              >
                <PersonList items={institution.notable_scholars || []} />
              </SectionCard>
            )}

          </main>
        </div>
      </div>

      <BaseModal
        isOpen={timelineModalOpen}
        onClose={closeTimelineModal}
        title={editingTimelineId ? "编辑共建纪要" : "新增共建纪要"}
        maxWidth="2xl"
        footer={(
          <>
            <button
              onClick={closeTimelineModal}
              disabled={timelineSaving}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              取消
            </button>
            <button
              onClick={() => void handleSaveTimeline()}
              disabled={timelineSaving}
              className="h-9 px-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {timelineSaving ? "保存中..." : editingTimelineId ? "保存修改" : "创建纪要"}
            </button>
          </>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">时间（YYYY-MM）*</p>
            <input
              value={timelineDraft.happened_on}
              onChange={(e) => setTimelineDraft((prev) => ({ ...prev, happened_on: e.target.value }))}
              placeholder="例如 2025-10"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </label>
          <label className="block">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">事件标题*</p>
            <input
              value={timelineDraft.title}
              onChange={(e) => setTimelineDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="例如 参加中国计算机大会并任大会..."
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </label>
          <label className="block md:col-span-2">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">事件内容*</p>
            <textarea
              rows={4}
              value={timelineDraft.detail}
              onChange={(e) => setTimelineDraft((prev) => ({ ...prev, detail: e.target.value }))}
              placeholder="记录事件背景、双方人员、活动成果等"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-y"
            />
          </label>
          <label className="block">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">参与人员</p>
            <input
              value={timelineDraft.participants}
              onChange={(e) => setTimelineDraft((prev) => ({ ...prev, participants: e.target.value }))}
              placeholder="例如 刘铁岩、刘挺、泰涛"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </label>
          <label className="block">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">活动场景</p>
            <input
              value={timelineDraft.scene}
              onChange={(e) => setTimelineDraft((prev) => ({ ...prev, scene: e.target.value }))}
              placeholder="例如 CCF大会 / 国际暑期学校"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </label>
          <label className="block md:col-span-2">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">参考链接</p>
            <input
              value={timelineDraft.source_url}
              onChange={(e) => setTimelineDraft((prev) => ({ ...prev, source_url: e.target.value }))}
              placeholder="https://..."
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </label>
        </div>
      </BaseModal>

      <AnimatePresence>
        {editOpen && (
          <EditInstitutionModal
            institution={institution}
            onClose={() => setEditOpen(false)}
            onSaved={(updated) => {
              setInstitution((prev) => (
                prev ? applyUnifiedScholarCounts(updated, []) : updated
              ));
              setEditOpen(false);
              if (id) {
                void loadInstitutionData(id, { showPageLoading: false });
              }
            }}
          />
        )}
        {deleteOpen && (
          <DeleteConfirmDialog
            name={institution.name}
            onCancel={() => setDeleteOpen(false)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function HeroHeader({
  institution,
  yearStudentMetrics,
  onOpenScholarList,
  onOpenStudentYear,
  onOpenStudentAll,
  onBack,
  onEdit,
  onDelete,
}: {
  institution: InstitutionDetail;
  yearStudentMetrics: Array<{ year: string; value: number }>;
  onOpenScholarList: () => void;
  onOpenStudentYear: (year: string) => void;
  onOpenStudentAll: () => void;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mergedYearMetrics = new Map<string, number>();
  yearStudentMetrics.forEach((item) => {
    mergedYearMetrics.set(item.year, item.value);
  });
  if (!mergedYearMetrics.has("2024") && institution.student_count_24 != null) {
    mergedYearMetrics.set("2024", Number(institution.student_count_24));
  }
  if (!mergedYearMetrics.has("2025") && institution.student_count_25 != null) {
    mergedYearMetrics.set("2025", Number(institution.student_count_25));
  }

  if (mergedYearMetrics.size === 0) {
    mergedYearMetrics.set("2024", Number(institution.student_count_24 ?? 0));
    mergedYearMetrics.set("2025", Number(institution.student_count_25 ?? 0));
  }

  const displayYearStudentMetrics = Array.from(mergedYearMetrics.entries())
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, value]) => ({ year, value }));

  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-blue-900/30 bg-gradient-to-br from-[#0b1633] via-[#152a59] to-[#2452b8] text-white shadow-[0_24px_60px_-36px_rgba(20,45,110,0.75)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(125,211,252,0.20),transparent_38%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,rgba(96,165,250,0.34),transparent_46%)]" />
      <div className="absolute -right-16 -bottom-20 w-80 h-80 rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="relative p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            机构库
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/12 hover:bg-white/22 border border-white/20 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> 编辑
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-500/18 hover:bg-rose-500/30 text-rose-100 border border-rose-300/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> 删除
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(500px,560px)] gap-4">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
            <div className="flex items-start gap-4">
              <UniversityLogo
                name={institution.name}
                id={institution.id}
                avatar={institution.avatar}
                onEditAvatar={onEdit}
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                  {institution.name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-sm text-slate-300">
                  {institution.org_name && <span className="font-medium">{institution.org_name}</span>}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 text-xs border border-white/10 text-slate-100">
                    ID: {institution.id}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {institution.category && <CategoryBadge label={institution.category} />}
                  {institution.priority && <PriorityBadge label={institution.priority} />}
                  {institution.classification && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-white/20 bg-white/10 text-slate-100">
                      {institution.classification}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-slate-950/18 backdrop-blur-sm p-3 md:p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] md:text-xs text-blue-100/90 font-medium">核心数据总览</p>
              <p className="text-[10px] md:text-[11px] text-blue-100/70">点击指标可直接进入筛选</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <HeroMetricCard
                icon={Users}
                label="学者"
                value={institution.scholar_count}
                hint="查看学者"
                clickable
                onClick={onOpenScholarList}
              />
              {displayYearStudentMetrics.map((item) => (
                <HeroMetricCard
                  key={item.year}
                  icon={GraduationCap}
                  label={`${item.year.slice(-2)}级学生`}
                  value={item.value}
                  hint="查看学生"
                  clickable
                  onClick={() => onOpenStudentYear(item.year)}
                />
              ))}
              <HeroMetricCard
                icon={BookOpen}
                label="学生总数"
                value={institution.student_count_total}
                hint="学生总览"
                clickable
                onClick={onOpenStudentAll}
              />
              <HeroMetricCard
                icon={UserCog}
                label="导师数"
                value={institution.mentor_count}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function HeroMetricCard({
  icon: Icon,
  label,
  value,
  hint,
  clickable = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number | null | undefined;
  hint?: string;
  clickable?: boolean;
  onClick?: () => void;
}) {
  const baseClass =
    "rounded-xl border px-3 py-2.5 text-left transition-all duration-150 bg-white/10 border-white/15";

  if (clickable && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} hover:bg-white/18 hover:border-white/35 hover:shadow-[0_10px_25px_-18px_rgba(165,203,255,0.9)]`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] md:text-xs text-slate-100/80 font-semibold">{label}</span>
          <Icon className="w-3.5 h-3.5 text-blue-100/80" />
        </div>
        <div className="mt-1.5 flex items-end justify-between gap-2">
          <p className="text-xl md:text-2xl font-extrabold leading-none text-white tabular-nums">
            {value ?? "—"}
          </p>
          <span className="inline-flex items-center gap-0.5 text-[10px] md:text-[11px] text-blue-100/80">
            {hint}
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className={baseClass}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] md:text-xs text-slate-100/80 font-semibold">{label}</span>
        <Icon className="w-3.5 h-3.5 text-blue-100/80" />
      </div>
      <p className="mt-1.5 text-xl md:text-2xl font-extrabold leading-none text-white tabular-nums">
        {value ?? "—"}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  count,
  compact = false,
  showHeader = true,
}: {
  title?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count?: number;
  compact?: boolean;
  showHeader?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.45)]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
      {showHeader && (
        <div className={`flex items-center gap-3 border-b border-slate-100 ${compact ? "px-4 py-3.5" : "px-4 py-4"}`}>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
          {title ? <h2 className="text-[15px] font-bold text-slate-800">{title}</h2> : null}
          {count != null && (
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {count}
            </span>
          )}
        </div>
      )}
      <div className={compact ? "p-3.5" : "p-4"}>{children}</div>
    </motion.section>
  );
}

function SubBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, idx) => (
            <Tag key={`${item}-${idx}`}>{item}</Tag>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">暂无数据</p>
      )}
    </div>
  );
}

function InstitutionActivityPanel({ institution }: { institution: InstitutionDetail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayFeeds, setDisplayFeeds] = useState<InstitutionDynamicFeedItem[]>([]);

  useEffect(() => {
    let active = true;
    const manualFeeds = buildManualInstitutionFeeds(institution);

    async function loadInstitutionFeeds() {
      setLoading(true);
      setError(null);
      try {
        const isCompany = institution.org_type === "企业" || institution.type === "company";
        const dynamicFeeds: InstitutionDynamicFeedItem[] = [];

        if (!isCompany) {
          const universitySources = await fetchUniversitySourcesWithData();
          const matchedUniversitySources = matchUniversitySourcesToInstitution(
            institution,
            universitySources,
          );
          if (matchedUniversitySources.length > 0) {
            const feedItems: UniversityFeedItem[] = await fetchUniversityFeedBySourceIds(
              matchedUniversitySources.map((item) => item.source_id),
              12,
            );
            const groupLabelMap: Record<string, string> = {
              university_news: "高校生态文章",
              ai_institutes: "AI研究机构动态",
              provincial: "省级教育动态",
              awards: "科技荣誉",
              aggregators: "教育聚合",
            };
            feedItems.forEach((item) => {
              dynamicFeeds.push({
                id: `uni-${item.id}`,
                category: groupLabelMap[item.group || ""] || "高校生态文章",
                title: item.title,
                summary: toSummary(item.content, item.title),
                meta: `${toCompactDateLabel(item.published_at)} · ${item.source_name}`,
                url: item.url,
                source_name: item.source_name,
                published_at: item.published_at,
                cover_image_url: resolveUniversityCoverImage(item),
              });
            });
          }

          // 企业标签可能还未完全规范到 institutions 表，
          // 当高校生态未命中时，补一次 technology 公司信源匹配。
          if (dynamicFeeds.length === 0) {
            const technologySources = await fetchEnabledTechnologySources();
            const matchedTechnologySources = matchTechnologySourcesToInstitution(
              institution,
              technologySources,
            );
            if (matchedTechnologySources.length > 0) {
              const sourceNameById = new Map(
                matchedTechnologySources.map((item) => [item.id, item.name]),
              );
              const sourceGroupById = new Map(
                matchedTechnologySources.map((item) => [item.id, item.group || ""]),
              );
              const articleItems = await fetchTechnologyArticlesBySourceIds(
                matchedTechnologySources.map((item) => item.id),
                12,
              );
              articleItems.forEach((item) => {
                const sourceName = sourceNameById.get(item.source_id) || item.source_id;
                const sourceGroup = sourceGroupById.get(item.source_id);
                dynamicFeeds.push({
                  id: `tech-${item.id}`,
                  category: sourceGroup === "cn_ai_company" ? "公司动态" : "国际公司博客",
                  title: item.title,
                  summary: toSummary(item.title),
                  meta: `${toCompactDateLabel(item.published_at)} · ${sourceName}`,
                  url: item.url,
                  source_name: sourceName,
                  published_at: item.published_at,
                  cover_image_url: toSafeImageUrl(item.cover_image_url),
                });
              });
            }
          }
        } else {
          const technologySources = await fetchEnabledTechnologySources();
          const matchedTechnologySources = matchTechnologySourcesToInstitution(
            institution,
            technologySources,
          );
          if (matchedTechnologySources.length > 0) {
            const sourceNameById = new Map(
              matchedTechnologySources.map((item) => [item.id, item.name]),
            );
            const sourceGroupById = new Map(
              matchedTechnologySources.map((item) => [item.id, item.group || ""]),
            );
            const articleItems = await fetchTechnologyArticlesBySourceIds(
              matchedTechnologySources.map((item) => item.id),
              12,
            );
            articleItems.forEach((item) => {
              const sourceName = sourceNameById.get(item.source_id) || item.source_id;
              const sourceGroup = sourceGroupById.get(item.source_id);
              dynamicFeeds.push({
                id: `tech-${item.id}`,
                category: sourceGroup === "cn_ai_company" ? "公司动态" : "国际公司博客",
                title: item.title,
                summary: toSummary(item.title),
                meta: `${toCompactDateLabel(item.published_at)} · ${sourceName}`,
                url: item.url,
                source_name: sourceName,
                published_at: item.published_at,
                cover_image_url: toSafeImageUrl(item.cover_image_url),
              });
            });
          }
        }

        const merged = [...dynamicFeeds, ...manualFeeds].sort((a, b) => {
          const bTime = parsePublishedTimestamp(b.published_at);
          const aTime = parsePublishedTimestamp(a.published_at);
          return bTime - aTime;
        });
        if (active) {
          setDisplayFeeds(merged);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "加载机构动态失败");
          setDisplayFeeds(manualFeeds);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInstitutionFeeds();
    return () => {
      active = false;
    };
  }, [
    institution.id,
    institution.name,
    institution.org_name,
    institution.org_type,
    institution.type,
    institution.recruitment_events,
    institution.visit_exchanges,
    institution.cooperation_focus,
  ]);

  const featured = displayFeeds[0];
  const listItems = displayFeeds.slice(1);
  const featuredCoverStyle = featured?.cover_image_url
    ? {
      backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.10) 0%, rgba(15,23,42,0.34) 100%), url("${featured.cover_image_url}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }
    : {
      backgroundImage: "linear-gradient(130deg,#dbeafe_0%,#bfdbfe_46%,#93c5fd_100%)",
    };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3.5 border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <p className="text-[17px] font-bold text-slate-800">机构动态</p>
        <p className="mt-1 text-sm text-slate-500">已接入高校生态文章与公司动态信源。</p>
      </div>

      <div className="p-4 space-y-3">
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            正在加载机构动态...
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error}
          </div>
        )}
        {featured ? (
          <article className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="h-40 px-4 py-3 flex items-end" style={featuredCoverStyle}>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-blue-700">
                  {featured.category}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50/95 text-emerald-700 border border-emerald-100">
                  最新发布
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-[18px] font-bold text-slate-900 leading-snug">{featured.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-6">{featured.summary}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">{featured.meta}</span>
                {featured.url ? (
                  <a
                    href={featured.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    阅读全文
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 inline-flex items-center gap-1">
                    暂无原文链接
                  </span>
                )}
              </div>
            </div>
          </article>
        ) : (
          <div className="rounded-xl border border-dashed border-blue-200 bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_58%,#ffffff_100%)] px-6 py-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-slate-800">暂无机构动态</p>
            <p className="mt-1.5 text-sm text-slate-500">
              当前机构未命中高校生态或公司动态信源，请检查机构名称与信源映射关系。
            </p>
          </div>
        )}

        {listItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {listItems.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-[0_10px_24px_-20px_rgba(15,23,42,0.6)] transition-shadow"
              >
                <div
                  className="h-20 px-3 py-2 flex items-start"
                  style={item.cover_image_url
                    ? {
                      backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(15,23,42,0.38) 100%), url("${item.cover_image_url}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                    : {
                      backgroundImage: "linear-gradient(135deg,#e2e8f0_0%,#cbd5e1_100%)",
                    }}
                >
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/90 text-slate-700">
                    {item.category}
                  </span>
                </div>
                <div className="p-3.5">
                  <h4 className="text-[15px] font-semibold text-slate-800 leading-snug line-clamp-2">{item.title}</h4>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.summary}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-400">{item.meta}</p>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
                      >
                        原文
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center">
            <p className="text-sm text-slate-500">暂无机构动态，等待接入真实数据后展示。</p>
          </div>
        )}

        {(institution.cooperation_focus?.length ?? 0) > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">热门标签</p>
            <div className="flex flex-wrap gap-2">
              {(institution.cooperation_focus || []).map((item, idx) => (
                <Tag key={`${item}-${idx}`}>{item}</Tag>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DepartmentList({
  departments,
  onOpenDepartment,
}: {
  departments: InstitutionDetail["departments"];
  onOpenDepartment: (departmentName: string) => void;
}) {
  const maxCount = Math.max(...departments.map((d) => d.scholar_count), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {departments.map((dept) => (
        <motion.div
          key={dept.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 hover:bg-white hover:shadow-md transition-all"
        >
          <button
            type="button"
            onClick={() => onOpenDepartment(dept.name)}
            className="w-full h-full text-left group"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-700">
                    {dept.name}
                  </p>
                  {dept.org_name && dept.org_name !== dept.name && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{dept.org_name}</p>
                  )}
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {dept.scholar_count}
                </span>
              </div>

              <div className="mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  style={{ width: `${(dept.scholar_count / maxCount) * 100}%` }}
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-500">学者规模</span>
                <span className="inline-flex items-center gap-0.5 text-blue-600 font-medium">
                  查看学者
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              {(dept.sources?.length ?? 0) > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {(dept.sources || []).slice(0, 3).map((src) => (
                    <span
                      key={src.source_id}
                      className={
                        src.is_enabled
                          ? "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700"
                          : "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600"
                      }
                    >
                      {src.source_name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 italic">{text}</p>;
}
