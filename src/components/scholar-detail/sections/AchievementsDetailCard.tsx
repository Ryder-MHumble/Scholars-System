import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  Edit3,
  ExternalLink,
  FileText,
  FolderGit2,
  GitFork,
  Loader2,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Trophy,
} from "lucide-react";
import type {
  AcademicPosition,
  AcademicPositionCreate,
  OpenSourceProject,
  OpenSourceProjectCreate,
  ResearchProject,
  ResearchProjectCreate,
  ScholarDetail,
  AwardRecord,
} from "@/services/scholarApi";
import {
  batchAcademicPositions,
  batchOpenSourceProjects,
  createAcademicPosition,
  createOpenSourceProject,
  createResearchProject,
  deleteAcademicPosition,
  deleteOpenSourceProject,
  deleteResearchProject,
  fetchAcademicPositions,
  fetchOpenSourceProjects,
  fetchResearchProjects,
  updateAcademicPosition,
  updateOpenSourceProject,
  updateResearchProject,
} from "@/services/scholarResourcesApi";
import { BaseModal } from "@/components/common/BaseModal";
import {
  EditScholarResourceModal,
  type EditableScholarResource,
  type ScholarResourceKind,
  type ScholarResourcePayload,
} from "@/components/scholar-detail/modals/EditScholarResourceModal";
import { cn } from "@/utils/cn";
import { slideInUp } from "@/utils/animations";
import {
  parseAcademicPositionsFromText,
  parseOpenSourceProjectsFromText,
} from "@/utils/textParsers";
import {
  extractAchievementTags,
  getAchievementTagKind,
  hasTwoInstitutesAchievement,
  isTwoInstitutesPublication,
  TWO_INSTITUTES_ACHIEVEMENT_TAG,
  type AchievementTag,
} from "@/utils/scholarAchievementTags";

interface AchievementsDetailCardProps {
  scholar: ScholarDetail;
  onShowAchievementsModal: () => void;
  relationSlot?: ReactNode;
}

export function AchievementsDetailCard({
  scholar,
  onShowAchievementsModal,
  relationSlot,
}: AchievementsDetailCardProps) {
  const [activeTab, setActiveTab] = useState<
    | "publications"
    | "patents"
    | "awards"
    | "research"
    | "openSource"
  >("publications");
  const [researchProjects, setResearchProjects] = useState<ResearchProject[]>([]);
  const [openSourceProjects, setOpenSourceProjects] = useState<OpenSourceProject[]>([]);
  const [academicPositions, setAcademicPositions] = useState<AcademicPosition[]>([]);
  const [loading, setLoading] = useState({
    research: true,
    openSource: true,
    positions: true,
  });
  const [resourceErrors, setResourceErrors] = useState({
    research: "",
    openSource: "",
    positions: "",
  });
  const [resourceEditor, setResourceEditor] = useState<{
    kind: ScholarResourceKind;
    item?: EditableScholarResource;
  } | null>(null);
  const [showPositionsBatch, setShowPositionsBatch] = useState(false);
  const [showOpenSourceBatch, setShowOpenSourceBatch] = useState(false);
  const [positionsExpanded, setPositionsExpanded] = useState(false);
  const achievementTags = extractAchievementTags(scholar);
  const venueTags = achievementTags.filter(
    (tag) => getAchievementTagKind(tag) === "venue",
  );
  const competitionTags = achievementTags.filter(
    (tag) => getAchievementTagKind(tag) === "competition",
  );
  const hasTwoInstitutesPapers = hasTwoInstitutesAchievement(scholar);
  const allAwards = scholar.awards ?? [];
  const awardsOnly = allAwards.filter((a) => a.level !== "Grant");
  const loadResearchProjects = useCallback(async () => {
    setLoading((current) => ({ ...current, research: true }));
    setResourceErrors((current) => ({ ...current, research: "" }));
    try {
      setResearchProjects(await fetchResearchProjects(scholar.url_hash));
    } catch (error) {
      setResourceErrors((current) => ({
        ...current,
        research: error instanceof Error ? error.message : "科研项目加载失败",
      }));
    } finally {
      setLoading((current) => ({ ...current, research: false }));
    }
  }, [scholar.url_hash]);

  const loadOpenSourceProjects = useCallback(async () => {
    setLoading((current) => ({ ...current, openSource: true }));
    setResourceErrors((current) => ({ ...current, openSource: "" }));
    try {
      setOpenSourceProjects(await fetchOpenSourceProjects(scholar.url_hash));
    } catch (error) {
      setResourceErrors((current) => ({
        ...current,
        openSource: error instanceof Error ? error.message : "开源项目加载失败",
      }));
    } finally {
      setLoading((current) => ({ ...current, openSource: false }));
    }
  }, [scholar.url_hash]);

  const loadAcademicPositions = useCallback(async () => {
    setLoading((current) => ({ ...current, positions: true }));
    setResourceErrors((current) => ({ ...current, positions: "" }));
    try {
      setAcademicPositions(await fetchAcademicPositions(scholar.url_hash));
    } catch (error) {
      setResourceErrors((current) => ({
        ...current,
        positions: error instanceof Error ? error.message : "学术兼职加载失败",
      }));
    } finally {
      setLoading((current) => ({ ...current, positions: false }));
    }
  }, [scholar.url_hash]);

  useEffect(() => {
    void loadResearchProjects();
    void loadOpenSourceProjects();
    void loadAcademicPositions();
  }, [loadAcademicPositions, loadOpenSourceProjects, loadResearchProjects]);

  useEffect(() => {
    const refresh = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== scholar.url_hash) return;
      void loadOpenSourceProjects();
      void loadAcademicPositions();
    };
    window.addEventListener("scholar-resources-updated", refresh);
    return () => window.removeEventListener("scholar-resources-updated", refresh);
  }, [loadAcademicPositions, loadOpenSourceProjects, scholar.url_hash]);

  const tabs = [
    {
      key: "publications" as const,
      label: "代表论文",
      count: scholar.representative_publications?.length ?? 0,
      icon: BookOpen,
    },
    {
      key: "patents" as const,
      label: "专利",
      count: scholar.patents?.length ?? 0,
      icon: Award,
    },
    {
      key: "awards" as const,
      label: "获奖",
      count: awardsOnly.length,
      icon: Trophy,
    },
    {
      key: "research" as const,
      label: "科研项目",
      count: researchProjects.length,
      icon: FileText,
    },
    {
      key: "openSource" as const,
      label: "开源项目",
      count: openSourceProjects.length,
      icon: FolderGit2,
    },
  ];
  const saveResource = async (payload: ScholarResourcePayload) => {
    if (!resourceEditor) return;
    const { kind, item } = resourceEditor;
    if (kind === "research") {
      if (item) {
        await updateResearchProject(
          scholar.url_hash,
          item.id,
          payload as ResearchProjectCreate,
        );
      } else {
        await createResearchProject(scholar.url_hash, payload as ResearchProjectCreate);
      }
      await loadResearchProjects();
    } else if (kind === "openSource") {
      if (item) {
        await updateOpenSourceProject(
          scholar.url_hash,
          item.id,
          payload as OpenSourceProjectCreate,
        );
      } else {
        await createOpenSourceProject(scholar.url_hash, payload as OpenSourceProjectCreate);
      }
      await loadOpenSourceProjects();
    } else {
      if (item) {
        await updateAcademicPosition(
          scholar.url_hash,
          item.id,
          payload as AcademicPositionCreate,
        );
      } else {
        await createAcademicPosition(scholar.url_hash, payload as AcademicPositionCreate);
      }
      await loadAcademicPositions();
    }
  };

  const batchSaveAcademicPositions = async (rows: AcademicPositionCreate[]) => {
    await batchAcademicPositions(scholar.url_hash, rows);
    await loadAcademicPositions();
  };

  const batchSaveOpenSourceProjects = async (rows: OpenSourceProjectCreate[]) => {
    await batchOpenSourceProjects(scholar.url_hash, rows);
    await loadOpenSourceProjects();
  };

  const deleteResource = async (
    kind: ScholarResourceKind,
    item: EditableScholarResource,
    itemLabel: string,
  ) => {
    if (!window.confirm(`确认删除“${itemLabel}”？`)) return;
    try {
      if (kind === "research") {
        await deleteResearchProject(scholar.url_hash, item.id);
        await loadResearchProjects();
      } else if (kind === "openSource") {
        await deleteOpenSourceProject(scholar.url_hash, item.id);
        await loadOpenSourceProjects();
      } else {
        await deleteAcademicPosition(scholar.url_hash, item.id);
        await loadAcademicPositions();
      }
    } catch (error) {
      setResourceErrors((current) => ({
        ...current,
        [kind]: error instanceof Error ? error.message : "删除失败",
      }));
    }
  };

  return (
    <motion.div
      data-testid="scholar-achievements-card"
      variants={slideInUp}
      className="bg-white"
    >
      {relationSlot && <div className="mb-5">{relationSlot}</div>}

      <section
        data-testid="scholar-academic-positions-module"
        className="mb-5 border-b border-gray-200 bg-white"
      >
        <div className="flex items-center gap-2 py-3">
          <button
            type="button"
            aria-label={positionsExpanded ? "收起学术兼职" : "展开学术兼职"}
            aria-expanded={positionsExpanded}
            onClick={() => setPositionsExpanded((current) => !current)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <BriefcaseBusiness className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-semibold text-gray-900">学术兼职</span>
            <span className="text-xs text-gray-400">{academicPositions.length}</span>
            {positionsExpanded ? (
              <ChevronUp className="ml-1 h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
            )}
          </button>
          <div className="ml-auto">
            <button
              type="button"
              aria-label="编辑学术兼职"
              title="编辑学术兼职"
              onClick={() => setResourceEditor({ kind: "positions" })}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-primary-50 hover:text-primary-700"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {positionsExpanded && <div className="pb-4">
          <ResourceState
            loading={loading.positions}
            error={resourceErrors.positions}
            retryLabel="重试学术兼职"
            onRetry={loadAcademicPositions}
          >
            <AcademicPositionsSection
              positions={academicPositions}
              onEdit={(item) => setResourceEditor({ kind: "positions", item })}
              onDelete={(item) =>
                void deleteResource("positions", item, `${item.organization} ${item.title}`)
              }
            />
          </ResourceState>
        </div>}
      </section>

      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">学术成果</h3>
        <button
          type="button"
          aria-label="编辑学术成果"
          title="编辑学术成果"
          onClick={onShowAchievementsModal}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-700"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </div>

      {(achievementTags.length > 0 || hasTwoInstitutesPapers) && (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
          <span className="shrink-0 text-xs font-semibold text-gray-500">学术标识</span>
          <AchievementTagGroup label="顶刊顶会" tags={venueTags} />
          <AchievementTagGroup label="竞赛" tags={competitionTags} />
          {hasTwoInstitutesPapers && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {TWO_INSTITUTES_ACHIEVEMENT_TAG}
            </span>
          )}
        </div>
      )}

      <div data-testid="scholar-achievement-tabs" className="mb-4 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-x-1 sm:flex sm:flex-wrap sm:items-center">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex min-w-0 items-center justify-center gap-1.5 border-b-2 px-2 py-2 text-xs transition-colors sm:justify-start sm:px-3 sm:text-sm",
                activeTab === tab.key
                  ? "text-primary-700 border-primary-600 bg-primary-50/40"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50",
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className="text-xs text-gray-400">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "publications" && <PublicationsSection scholar={scholar} />}
      {activeTab === "patents" && <PatentsSection scholar={scholar} />}
      {activeTab === "awards" && <AwardsSection awards={awardsOnly} />}
      {activeTab === "research" && (
        <ResourceState
          loading={loading.research}
          error={resourceErrors.research}
          retryLabel="重试科研项目"
          onRetry={loadResearchProjects}
        >
          <ResearchProjectsSection
            projects={researchProjects}
            onAdd={() => setResourceEditor({ kind: "research" })}
            onEdit={(item) => setResourceEditor({ kind: "research", item })}
            onDelete={(item) => void deleteResource("research", item, item.name)}
          />
        </ResourceState>
      )}
      {activeTab === "openSource" && (
        <ResourceState
          loading={loading.openSource}
          error={resourceErrors.openSource}
          retryLabel="重试开源项目"
          onRetry={loadOpenSourceProjects}
        >
          <OpenSourceProjectsSection
            projects={openSourceProjects}
            onDelete={(item) => void deleteResource("openSource", item, item.name)}
          />
        </ResourceState>
      )}
      {resourceEditor && (
        <EditScholarResourceModal
          kind={resourceEditor.kind}
          item={resourceEditor.item}
          onClose={() => setResourceEditor(null)}
          onSubmit={saveResource}
        />
      )}
      {showPositionsBatch && (
        <AcademicPositionsBatchModal
          onClose={() => setShowPositionsBatch(false)}
          onSubmit={async (rows) => {
            await batchSaveAcademicPositions(rows);
            setShowPositionsBatch(false);
          }}
        />
      )}
      {showOpenSourceBatch && (
        <OpenSourceProjectsBatchModal
          onClose={() => setShowOpenSourceBatch(false)}
          onSubmit={async (rows) => {
            await batchSaveOpenSourceProjects(rows);
            setShowOpenSourceBatch(false);
          }}
        />
      )}
    </motion.div>
  );
}

function AcademicPositionsBatchModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (rows: AcademicPositionCreate[]) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const rows = useMemo(() => parseAcademicPositionsFromText(text), [text]);

  const submit = async () => {
    if (rows.length === 0) return;
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit(rows);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "学术兼职批量导入失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      title="批量识别学术兼职"
      maxWidth="2xl"
      closeOnBackdropClick={!isSubmitting}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            取消
          </button>
          <button type="button" onClick={() => void submit()} disabled={rows.length === 0 || isSubmitting} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            提交 {rows.length > 0 ? `${rows.length} 条` : ""}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-800">粘贴学术兼职文本</p>
          <p className="mt-1 text-xs text-gray-500">
            每行一条，支持“机构 | 职务 | 开始 | 结束”和“职务：...；机构：...”格式。
          </p>
        </div>
        <textarea
          aria-label="粘贴学术兼职文本"
          value={text}
          rows={7}
          disabled={isSubmitting}
          onChange={(event) => setText(event.target.value)}
          placeholder={"武汉大学人工智能学院 | 兼职导师 | 2024-01 | 至今\n职务：顾问委员会委员；机构：北京中关村学院；开始：2025-09-01；结束：2026-09-01；类型：委员会"}
          className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
        />
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="rounded-md border border-blue-100 bg-blue-50/30 p-3">
          <p className="mb-2 text-xs font-medium text-blue-700">
            自动识别预览 {rows.length} 条
          </p>
          {rows.length === 0 ? (
            <p className="py-3 text-center text-xs text-gray-400">
              粘贴内容后在这里预览
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={`${row.organization}-${row.title}-${index}`} className="rounded border border-blue-100 bg-white px-3 py-2">
                  <p className="text-sm font-medium text-gray-800">
                    {row.organization} · {row.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {[row.position_type, row.start_date, row.is_current ? "至今" : row.end_date]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

function OpenSourceProjectsBatchModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (rows: OpenSourceProjectCreate[]) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const rows = useMemo(() => parseOpenSourceProjectsFromText(text), [text]);

  const submit = async () => {
    if (rows.length === 0) return;
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit(rows);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "开源项目批量导入失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      title="批量识别开源项目"
      maxWidth="2xl"
      closeOnBackdropClick={!isSubmitting}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">取消</button>
          <button type="button" onClick={() => void submit()} disabled={rows.length === 0 || isSubmitting} className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            提交 {rows.length > 0 ? `${rows.length} 条` : ""}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-800">粘贴开源项目文本</p>
          <p className="mt-1 text-xs text-gray-500">每行一条，格式为“项目名称 | 仓库 URL | 语言 | Stars | Forks | 平台”。</p>
        </div>
        <textarea
          aria-label="粘贴开源项目文本"
          value={text}
          rows={7}
          disabled={isSubmitting}
          onChange={(event) => setText(event.target.value)}
          placeholder="Scholar Toolkit | https://github.com/example/toolkit | TypeScript | 128 | 9 | GitHub"
          className="w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
        />
        {error && <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
        <div className="rounded-md border border-blue-100 bg-blue-50/30 p-3">
          <p className="mb-2 text-xs font-medium text-blue-700">自动识别预览 {rows.length} 条</p>
          {rows.length === 0 ? <p className="py-3 text-center text-xs text-gray-400">粘贴内容后在这里预览</p> : (
            <div className="space-y-2">
              {rows.map((row, index) => <div key={`${row.name}-${index}`} className="rounded border border-blue-100 bg-white px-3 py-2"><p className="text-sm font-medium text-gray-800">{row.name}</p><p className="mt-1 text-xs text-gray-500">{[row.platform, row.language, row.stars != null ? `${row.stars} Stars` : ""].filter(Boolean).join(" · ")}</p></div>)}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

function AchievementTagGroup({
  label,
  tags,
}: {
  label: string;
  tags: AchievementTag[];
}) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-gray-400">{label}</span>
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            getAchievementTagKind(tag) === "competition"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-violet-100 bg-violet-50 text-violet-700",
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

/* -- Publications -- */
function PublicationsSection({ scholar }: { scholar: ScholarDetail }) {
  const pubs = scholar.representative_publications;
  return (
    <div className="mb-5">
      {pubs && pubs.length > 0 ? (
        <>
          <div className="space-y-3">
            {pubs.map((pub, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 leading-snug">
                        {pub.title || "论文"}
                      </p>
                      {pub.is_corresponding && (
                        <span className="inline-block text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded mt-1">
                          通讯作者
                        </span>
                      )}
                      {isTwoInstitutesPublication(pub) && (
                        <span className="mt-1 inline-block rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700">
                          {TWO_INSTITUTES_ACHIEVEMENT_TAG}
                        </span>
                      )}
                    </div>
                    {pub.citation_count !== undefined &&
                      pub.citation_count > 0 && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          被引 {pub.citation_count}
                        </span>
                      )}
                  </div>
                  {pub.venue && (
                    <p className="text-xs text-gray-500 mb-1">
                      {pub.venue}
                      {pub.year && ` (${pub.year})`}
                    </p>
                  )}
                  {!pub.venue && pub.project_group_name && (
                    <p className="text-xs text-gray-500 mb-1">
                      项目组：{pub.project_group_name}
                      {pub.year && ` (${pub.year})`}
                    </p>
                  )}
                  {pub.authors && (
                    <p className="text-xs text-gray-400 truncate">
                      {pub.authors}
                    </p>
                  )}
                  {pub.doi && (
                    <p className="mt-1 text-xs text-gray-400 break-all">
                      DOI: {pub.doi}
                    </p>
                  )}
                </div>
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
          {scholar.publications_count > 0 && (
            <p className="text-xs text-gray-400 text-center mt-3 pt-3 border-t border-gray-100">
              总计约 {scholar.publications_count} 篇，可前往{" "}
              <ScholarLink url={scholar.dblp_url} label="DBLP" /> 或{" "}
              <ScholarLink
                url={scholar.google_scholar_url}
                label="Google Scholar"
              />{" "}
              查看全部
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">
          论文详情暂未收录
          {(scholar.dblp_url || scholar.google_scholar_url) && (
            <>
              ，可前往 <ScholarLink url={scholar.dblp_url} label="DBLP" /> 或{" "}
              <ScholarLink
                url={scholar.google_scholar_url}
                label="Google Scholar"
              />{" "}
              查看
            </>
          )}
        </p>
      )}
    </div>
  );
}

/* -- Patents -- */
function PatentsSection({ scholar }: { scholar: ScholarDetail }) {
  const patents = scholar.patents;
  return (
    <div className="mb-1">
      {patents && patents.length > 0 ? (
        <div className="space-y-3">
          {patents.map((patent, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-800 leading-snug">
                    {patent.title || "专利"}
                  </p>
                  {patent.year && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {patent.year}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-1">
                  {patent.patent_no && (
                    <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                      {patent.patent_no}
                    </span>
                  )}
                  {patent.patent_type && (
                    <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                      {patent.patent_type}
                    </span>
                  )}
                  {patent.status && (
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded border",
                        patent.status === "已授权"
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-blue-50 border-blue-200 text-blue-700",
                      )}
                    >
                      {patent.status}
                    </span>
                  )}
                </div>
                {patent.inventors && (
                  <p className="text-xs text-gray-400 truncate">
                    发明人: {patent.inventors}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">暂无专利数据</p>
      )}
    </div>
  );
}

/* -- Awards -- */
function AwardsSection({
  awards,
}: {
  awards: AwardRecord[];
}) {
  return (
    <div className="mb-1">
      {awards.length > 0 ? (
        <div className="space-y-3">
          {awards.map((award, i) => {
            let medal: { label: string; color: string } | null = null;
            try {
              const desc = JSON.parse(award.description || "{}");
              if (desc.medal === "gold") {
                medal = { label: "金奖", color: "bg-amber-50 border-amber-300 text-amber-800" };
              } else if (desc.medal === "silver") {
                medal = { label: "提名", color: "bg-slate-50 border-slate-300 text-slate-600" };
              }
            } catch {
              /* not JSON */
            }
            const link = (() => {
              try {
                return JSON.parse(award.description || "{}").link || "";
              } catch {
                return "";
              }
            })();
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-800 leading-snug">
                      {award.title || "奖项"}
                    </p>
                    {award.year && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {award.year}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs mb-1">
                    {medal && (
                      <span className={`px-1.5 py-0.5 rounded border ${medal.color}`}>
                        {medal.label}
                      </span>
                    )}
                    {award.grantor && (
                      <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 text-gray-600">
                        {award.grantor}
                      </span>
                    )}
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-primary-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        详情
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">
          暂无荣誉奖项数据
        </p>
      )}
    </div>
  );
}

function ResourceState({
  loading,
  error,
  retryLabel,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string;
  retryLabel: string;
  onRetry: () => Promise<void>;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        加载中
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          aria-label={retryLabel}
          onClick={() => void onRetry()}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          重试
        </button>
      </div>
    );
  }
  return children;
}

function ResearchProjectsSection({
  projects,
  onAdd,
  onEdit,
  onDelete,
}: {
  projects: ResearchProject[];
  onAdd: () => void;
  onEdit: (item: ResearchProject) => void;
  onDelete: (item: ResearchProject) => void;
}) {
  return (
    <div className="mb-1">
      <div className="mb-3 flex justify-end">
        <button type="button" onClick={onAdd} aria-label="新增科研项目" className="ml-auto inline-flex items-center gap-1 rounded-md border border-primary-100 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100">
          <Plus className="h-3.5 w-3.5" /> 新增
        </button>
      </div>
      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-800 leading-snug">
                    {project.name}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-xs text-gray-400">
                      {formatPeriod(project.start_date, project.end_date)}
                    </span>
                    <ResourceActions label="科研项目" name={project.name} onEdit={() => onEdit(project)} onDelete={() => onDelete(project)} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
                  {project.role && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">{project.role}</span>}
                  {project.organization && <span>{project.organization}</span>}
                  {project.status && <span>{project.status}</span>}
                </div>
                {project.description && (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">
          暂无科研项目数据
        </p>
      )}
    </div>
  );
}

function OpenSourceProjectsSection({
  projects,
  onDelete,
}: {
  projects: OpenSourceProject[];
  onDelete: (item: OpenSourceProject) => void;
}) {
  const rankedProjects = useMemo(
    () =>
      [...projects].sort((a, b) => {
        const byStars = (b.stars ?? -1) - (a.stars ?? -1);
        if (byStars !== 0) return byStars;
        return a.name.localeCompare(b.name, "zh-CN");
      }),
    [projects],
  );
  return (
    <div className="mb-1">
      {projects.length > 0 ? (
        <div className="border-y border-gray-200 bg-white">
          <div className="grid grid-cols-[minmax(0,1fr)_72px_64px] items-center border-b border-gray-100 py-2 text-[11px] font-medium text-gray-400">
            <span>项目仓库</span>
            <span className="text-right">Stars</span>
            <span aria-hidden="true" />
          </div>

          <div>
            {rankedProjects.map((project) => (
              <div key={project.id} className="group grid grid-cols-[minmax(0,1fr)_72px_64px] items-center gap-2 border-b border-gray-100 py-3 transition-colors last:border-0 hover:bg-gray-50/60">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <FolderGit2 className="h-4 w-4 shrink-0 text-gray-400" />
                    <p className="truncate text-sm font-semibold leading-snug text-gray-900">{project.name}</p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                    {project.platform && <span>{project.platform}</span>}
                    {project.repository_url && (
                      <span className="max-w-[220px] truncate text-gray-400">
                        {formatRepositoryHost(project.repository_url)}
                      </span>
                    )}
                    {project.language && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">
                        {project.language}
                      </span>
                    )}
                    {project.role && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">
                        {project.role}
                      </span>
                    )}
                    {project.status && <span>{project.status}</span>}
                  </div>
                  {project.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {formatCompactNumber(project.stars)}
                  </div>
                  {typeof project.forks === "number" && (
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-gray-400">
                      <GitFork className="h-3 w-3" />
                      {formatCompactNumber(project.forks)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1">
                  {project.repository_url && (
                    <a
                      href={project.repository_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="打开仓库"
                      title="打开仓库"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary-600 transition-colors hover:bg-primary-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(project)}
                    aria-label={`删除开源项目：${project.name}`}
                    title="删除"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-y border-dashed border-gray-200 px-4 py-8 text-center">
          <FolderGit2 className="mx-auto h-7 w-7 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">暂无开源项目数据</p>
        </div>
      )}
    </div>
  );
}

function formatCompactNumber(value?: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toLocaleString("zh-CN");
}

function formatRepositoryHost(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/|\/$/g, "");
    return path ? `${parsed.hostname}/${path.split("/").slice(0, 2).join("/")}` : parsed.hostname;
  } catch {
    return url;
  }
}

function AcademicPositionsSection({
  positions,
  onEdit,
  onDelete,
}: {
  positions: AcademicPosition[];
  onEdit: (item: AcademicPosition) => void;
  onDelete: (item: AcademicPosition) => void;
}) {
  return (
    <div className="mb-1">
      {positions.length > 0 ? (
        <div className="space-y-3">
          {positions.map((position) => (
            <div key={position.id} className="border-b border-gray-100 py-3 transition-colors last:border-0 hover:bg-gray-50/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{position.organization}</p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {[position.department, position.title].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {position.is_current ? (
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700">当前兼职</span>
                  ) : (
                    <span className="text-xs text-gray-400">{formatPeriod(position.start_date, position.end_date)}</span>
                  )}
                  <ResourceActions label="学术兼职" name={`${position.organization} ${position.title}`} onEdit={() => onEdit(position)} onDelete={() => onDelete(position)} />
                </div>
              </div>
              {position.description && <p className="mt-2 text-xs leading-relaxed text-gray-500">{position.description}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-gray-400">暂无学术兼职数据</p>
      )}
    </div>
  );
}

function formatPeriod(start?: string | null, end?: string | null): string {
  const startLabel = start?.slice(0, 7) ?? "";
  const endLabel = end?.slice(0, 7) ?? "";
  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
  if (startLabel) return `${startLabel} 至今`;
  return endLabel;
}

function ResourceActions({
  label,
  name,
  onEdit,
  onDelete,
}: {
  label: string;
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center">
      <button type="button" onClick={onEdit} aria-label={`编辑${label}：${name}`} title="编辑" className="rounded p-1 text-gray-400 hover:bg-primary-50 hover:text-primary-600">
        <Edit3 className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onDelete} aria-label={`删除${label}：${name}`} title="删除" className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* -- Scholar link helper -- */
function ScholarLink({ url, label }: { url?: string; label: string }) {
  if (!url) return <>{label}</>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-600 hover:underline"
    >
      {label}
    </a>
  );
}
