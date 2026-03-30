import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CalendarDays,
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
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState<"leadership" | "departments" | "timeline">("leadership");

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

  useEffect(() => {
    if (activeWorkbenchTab === "leadership" && leadershipCount <= 0) {
      if (departmentCount > 0) {
        setActiveWorkbenchTab("departments");
        return;
      }
      if (timelineCount > 0) {
        setActiveWorkbenchTab("timeline");
      }
    }
  }, [activeWorkbenchTab, leadershipCount, departmentCount, timelineCount]);

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

  const hasActivities =
    (institution.recruitment_events?.length ?? 0) > 0 ||
    (institution.visit_exchanges?.length ?? 0) > 0 ||
    (institution.cooperation_focus?.length ?? 0) > 0;
  const yearStudentMetrics = resolveYearStudentMetrics(institution);

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#eef2ff_0%,#f8fafc_36%,#f1f5f9_100%)]">
      <div className="max-w-[1380px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-5">
        <HeroHeader
          institution={institution}
          onBack={goBackToList}
          onEdit={() => setEditOpen(true)}
          onDelete={() => setDeleteOpen(true)}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
          <main className="xl:col-span-8 space-y-4 md:space-y-5">
            <SectionCard
              title="机构协同台"
              icon={NotebookPen}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="grid w-full grid-cols-3 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    onClick={() => setActiveWorkbenchTab("leadership")}
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
                    onClick={() => setActiveWorkbenchTab("departments")}
                    className={
                      activeWorkbenchTab === "departments"
                        ? "min-w-0 px-2 py-1.5 rounded-lg text-[13px] md:text-sm font-semibold bg-white text-blue-700 shadow-sm whitespace-nowrap"
                        : "min-w-0 px-2 py-1.5 rounded-lg text-[13px] md:text-sm font-medium text-slate-600 hover:text-slate-800 whitespace-nowrap"
                    }
                  >
                    院系结构
                    <span className="ml-1 text-[11px] md:text-xs opacity-80">({departmentCount})</span>
                  </button>
                  <button
                    onClick={() => setActiveWorkbenchTab("timeline")}
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
                      <DepartmentList departments={institution.departments || []} />
                    ) : (
                      <EmptyState text="暂无院系数据" />
                    )}
                  </>
                )}

                {activeWorkbenchTab === "timeline" && (
                  <>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">
                      维护该机构与两院之间的重要共建往来，用于沉淀可追溯的合作历史（来访、授课、论坛、联合活动等）。
                    </p>
                    {cobuildTimeline.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center">
                        <p className="text-sm text-slate-500">暂无共建纪要，建议先录入近一年的重点合作事件。</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cobuildTimeline.map((item, idx) => (
                          <motion.article
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                            className="relative rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/70 p-3.5 md:p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex flex-col items-center justify-center">
                                <CalendarClock className="w-3.5 h-3.5 mb-1" />
                                <span className="text-[11px] font-semibold">{formatTimelineDate(item.happened_on)}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <h3 className="text-[15px] font-bold text-slate-800 leading-snug">{item.title}</h3>
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => openEditTimeline(item)}
                                      disabled={timelineSaving}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-slate-200 text-slate-700 hover:bg-white"
                                    >
                                      <PencilLine className="w-3 h-3" />
                                      编辑
                                    </button>
                                    <button
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
                                <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-slate-500">
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

            {hasActivities && (
              <SectionCard title="合作动态" icon={CalendarDays}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ParagraphList title="招募活动" items={institution.recruitment_events || []} />
                  <ParagraphList title="访问交流" items={institution.visit_exchanges || []} />
                </div>
                {(institution.cooperation_focus?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      合作重点
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(institution.cooperation_focus || []).map((item, idx) => (
                        <Tag key={`${item}-${idx}`}>{item}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}
          </main>

          <aside className="xl:col-span-4 space-y-4 xl:sticky xl:top-4 self-start">
            <SectionCard title="核心数据" icon={BookOpen} compact>
              <div className="grid grid-cols-2 gap-2.5">
                <MetricCard icon={Users} label="学者总数" value={institution.scholar_count} />
                {yearStudentMetrics.length > 0 ? (
                  yearStudentMetrics.map((item) => (
                    <MetricCard
                      key={item.year}
                      icon={GraduationCap}
                      label={`${item.year.slice(-2)}级学生`}
                      value={item.value}
                    />
                  ))
                ) : (
                  <>
                    <MetricCard
                      icon={GraduationCap}
                      label="24级学生"
                      value={institution.student_count_24}
                    />
                    <MetricCard
                      icon={GraduationCap}
                      label="25级学生"
                      value={institution.student_count_25}
                    />
                  </>
                )}
                <MetricCard
                  icon={BookOpen}
                  label="学生总数"
                  value={institution.student_count_total}
                />
                <div className="col-span-2">
                  <MetricCard icon={UserCog} label="导师数" value={institution.mentor_count} />
                </div>
              </div>
            </SectionCard>

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

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.12 }}
              className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 border border-blue-500/20 shadow-lg"
            >
              <p className="text-sm font-bold text-white">学者数据库</p>
              <p className="mt-1 text-xs text-blue-100 leading-relaxed">
                该机构当前收录
                <span className="mx-1 text-white font-extrabold text-base">
                  {institution.scholar_count ?? 0}
                </span>
                位学者，可进入学者库查看详情。
              </p>
              <button
                onClick={() =>
                  navigate(`/?tab=scholars&university=${encodeURIComponent(institution.name)}`)
                }
                className="mt-3 w-full px-3 py-2 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                查看全部学者
              </button>
            </motion.div>
          </aside>
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
  onBack,
  onEdit,
  onDelete,
}: {
  institution: InstitutionDetail;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
        <div className="flex items-center justify-between gap-3 mb-4">
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 text-xs border border-white/10">
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
    </motion.header>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  count,
  compact = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count?: number;
  compact?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.45)]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
      <div className={`flex items-center gap-3 border-b border-slate-100 ${compact ? "px-4 py-3.5" : "px-4 py-4"}`}>
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-[15px] font-bold text-slate-800">{title}</h2>
        {count != null && (
          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {count}
          </span>
        )}
      </div>
      <div className={compact ? "p-3.5" : "p-4"}>{children}</div>
    </motion.section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 font-semibold">{label}</span>
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <p className={`mt-1 text-xl font-extrabold ${value != null ? "text-slate-800" : "text-slate-300"}`}>
        {value ?? "—"}
      </p>
    </div>
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

function ParagraphList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <p
            key={`${item}-${idx}`}
            className="text-sm text-slate-700 bg-white rounded-lg px-2.5 py-2 border border-slate-100"
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function DepartmentList({ departments }: { departments: InstitutionDetail["departments"] }) {
  const maxCount = Math.max(...departments.map((d) => d.scholar_count), 1);

  return (
    <div className="space-y-2.5">
      {departments.map((dept) => (
        <motion.div
          key={dept.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-slate-200 bg-slate-50/40 px-3 py-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 leading-snug truncate">{dept.name}</p>
              {dept.org_name && dept.org_name !== dept.name && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{dept.org_name}</p>
              )}
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {dept.scholar_count} 学者
            </span>
          </div>

          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              style={{ width: `${(dept.scholar_count / maxCount) * 100}%` }}
            />
          </div>

          {(dept.sources?.length ?? 0) > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(dept.sources || []).map((src) => (
                <span
                  key={src.source_id}
                  className={
                    src.is_enabled
                      ? "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700"
                      : "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-200 text-slate-600"
                  }
                >
                  {src.source_name}
                  {src.scholar_count > 0 && ` · ${src.scholar_count}`}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 italic">{text}</p>;
}
