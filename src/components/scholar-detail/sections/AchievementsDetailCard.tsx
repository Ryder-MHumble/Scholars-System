import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Edit3,
  ExternalLink,
  FileText,
  FolderGit2,
  Loader2,
  Plus,
  RefreshCw,
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
import {
  EditScholarResourceModal,
  type EditableScholarResource,
  type ScholarResourceKind,
  type ScholarResourcePayload,
} from "@/components/scholar-detail/modals/EditScholarResourceModal";
import { cn } from "@/utils/cn";
import { slideInUp } from "@/utils/animations";
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
}

export function AchievementsDetailCard({
  scholar,
  onShowAchievementsModal,
}: AchievementsDetailCardProps) {
  const [activeTab, setActiveTab] = useState<
    | "publications"
    | "patents"
    | "awards"
    | "research"
    | "openSource"
    | "positions"
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
    {
      key: "positions" as const,
      label: "学术兼职",
      count: academicPositions.length,
      icon: BriefcaseBusiness,
    },
  ];
  const isIndependentResource = ["research", "openSource", "positions"].includes(
    activeTab,
  );
  const activeResourceKind = isIndependentResource
    ? (activeTab as ScholarResourceKind)
    : null;

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
      variants={slideInUp}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">学者成就</h3>
        <button
          type="button"
          aria-label={activeResourceKind ? `新增${resourceLabel(activeResourceKind)}` : "编辑学者成就"}
          onClick={() => {
            if (activeResourceKind) {
              setResourceEditor({ kind: activeResourceKind });
            } else {
              onShowAchievementsModal();
            }
          }}
          className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary-50 px-2.5 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100"
        >
          {isIndependentResource ? <Plus className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
          {isIndependentResource ? "新增" : "编辑"}
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

      <div className="mb-4 border-b border-gray-100">
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
            onEdit={(item) => setResourceEditor({ kind: "openSource", item })}
            onDelete={(item) => void deleteResource("openSource", item, item.name)}
          />
        </ResourceState>
      )}
      {activeTab === "positions" && (
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
      )}
      {resourceEditor && (
        <EditScholarResourceModal
          kind={resourceEditor.kind}
          item={resourceEditor.item}
          onClose={() => setResourceEditor(null)}
          onSubmit={saveResource}
        />
      )}
    </motion.div>
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
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-600">代表性论文</h4>
        {pubs && pubs.length > 0 && (
          <span className="text-xs text-gray-400">{pubs.length} 篇</span>
        )}
      </div>
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
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-600">专利</h4>
        {patents && patents.length > 0 && (
          <span className="text-xs text-gray-400">{patents.length} 项</span>
        )}
      </div>
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
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-600">荣誉奖项</h4>
        {awards.length > 0 && (
          <span className="text-xs text-gray-400">{awards.length} 个</span>
        )}
      </div>
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
  onEdit,
  onDelete,
}: {
  projects: ResearchProject[];
  onEdit: (item: ResearchProject) => void;
  onDelete: (item: ResearchProject) => void;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-600">科研项目</h4>
        {projects.length > 0 && (
          <span className="text-xs text-gray-400">{projects.length} 项</span>
        )}
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
  onEdit,
  onDelete,
}: {
  projects: OpenSourceProject[];
  onEdit: (item: OpenSourceProject) => void;
  onDelete: (item: OpenSourceProject) => void;
}) {
  return (
    <div className="mb-1">
      <div className="mb-3 flex items-center gap-2">
        <FolderGit2 className="h-4 w-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-600">开源项目</h4>
        {projects.length > 0 && <span className="text-xs text-gray-400">{projects.length} 项</span>}
      </div>
      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:border-primary-200">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-snug text-gray-800">{project.name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    {project.repository_url && (
                      <a
                        href={project.repository_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="打开仓库"
                        title="打开仓库"
                        className="rounded p-1 text-primary-600 hover:bg-primary-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <ResourceActions label="开源项目" name={project.name} onEdit={() => onEdit(project)} onDelete={() => onDelete(project)} />
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                  {project.platform && <span>{project.platform}</span>}
                  {project.language && <span>{project.language}</span>}
                  {project.role && <span>{project.role}</span>}
                  {project.stars != null && <span>{project.stars.toLocaleString("zh-CN")} Stars</span>}
                  {project.forks != null && <span>{project.forks.toLocaleString("zh-CN")} Forks</span>}
                </div>
                {project.description && <p className="mt-2 text-xs leading-relaxed text-gray-500">{project.description}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-gray-400">暂无开源项目数据</p>
      )}
    </div>
  );
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
      <div className="mb-3 flex items-center gap-2">
        <BriefcaseBusiness className="h-4 w-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-600">学术兼职</h4>
        {positions.length > 0 && <span className="text-xs text-gray-400">{positions.length} 项</span>}
      </div>
      {positions.length > 0 ? (
        <div className="space-y-3">
          {positions.map((position) => (
            <div key={position.id} className="rounded-lg border border-gray-100 p-3 transition-colors hover:border-primary-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{position.organization}</p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {[position.department, position.title].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {position.is_current ? (
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700">当前任职</span>
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

function resourceLabel(kind: ScholarResourceKind): string {
  if (kind === "research") return "科研项目";
  if (kind === "openSource") return "开源项目";
  return "学术兼职";
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
