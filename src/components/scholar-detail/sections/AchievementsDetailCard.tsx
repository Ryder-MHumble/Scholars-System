import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Award, Trophy, ExternalLink, Edit3, FileText } from "lucide-react";
import type {
  ScholarDetail,
  AwardRecord,
  JointProject,
} from "@/services/scholarApi";
import { cn } from "@/utils/cn";
import { slideInUp } from "@/utils/animations";
import {
  extractAchievementTags,
  getAchievementTagKind,
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
    "publications" | "patents" | "awards" | "grants"
  >("publications");
  const achievementTags = extractAchievementTags(scholar);
  const venueTags = achievementTags.filter(
    (tag) => getAchievementTagKind(tag) === "venue",
  );
  const competitionTags = achievementTags.filter(
    (tag) => getAchievementTagKind(tag) === "competition",
  );
  const allAwards = scholar.awards ?? [];
  const awardsOnly = allAwards.filter((a) => a.level !== "Grant");
  const projects = scholar.joint_research_projects ?? [];
  const tabs = [
    {
      key: "publications" as const,
      label: "论文",
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
      key: "grants" as const,
      label: "科研项目",
      count: projects.length,
      icon: FileText,
    },
  ];

  return (
    <motion.div
      variants={slideInUp}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">学术成就</h3>
        <button
          onClick={onShowAchievementsModal}
          className="ml-auto flex items-center gap-1 px-2.5 py-1 text-xs bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-full transition-colors"
        >
          <Edit3 className="w-3 h-3" />
          编辑
        </button>
      </div>

      {achievementTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
          <span className="text-xs font-semibold text-gray-500">学术标识</span>
          <AchievementTagGroup label="顶刊顶会" tags={venueTags} />
          <AchievementTagGroup label="竞赛" tags={competitionTags} />
        </div>
      )}

      <div className="mb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg border-b-2 transition-colors",
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
      {activeTab === "grants" && <GrantsSection grants={projects} />}
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

/* -- Grants (科研项目) -- */
function GrantsSection({
  grants,
}: {
  grants: JointProject[];
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-600">科研项目</h4>
        {grants.length > 0 && (
          <span className="text-xs text-gray-400">{grants.length} 项</span>
        )}
      </div>
      {grants.length > 0 ? (
        <div className="space-y-3">
          {grants.map((grant, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-800 leading-snug">
                    {grant.title || "项目"}
                  </p>
                  {grant.year && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {grant.year}
                    </span>
                  )}
                </div>
                {grant.description && (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {grant.description}
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
