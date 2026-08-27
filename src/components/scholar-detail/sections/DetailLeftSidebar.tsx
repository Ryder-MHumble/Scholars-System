import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Award,
  BarChart3,
  Building2,
  GraduationCap,
  Briefcase,
  User,
  BookOpen,
  Phone,
  ChevronDown,
  ChevronUp,
  Edit3,
  Globe,
  Github,
  Linkedin,
  IdCard,
  Database,
  FlaskConical,
  Link2,
  Twitter,
  FileText,
  UserSearch,
  Quote,
} from "lucide-react";
import { resolveProfileLinks, type ScholarDetail } from "@/services/scholarApi";
import { SideLabel } from "@/components/scholar-detail/shared/SideLabel";
import { getInitial } from "@/utils/avatar";
import { staggerContainer, slideInLeft } from "@/utils/animations";

const BIO_LIMIT = 200;

interface DetailLeftSidebarProps {
  scholar: ScholarDetail;
  onEditProfile?: () => void;
}

type IdentityTag = {
  label: "华人" | "非华人" | "待判定";
  className: string;
};

export function DetailLeftSidebar({
  scholar,
  onEditProfile,
}: DetailLeftSidebarProps) {
  const [bioExpanded, setBioExpanded] = useState(false);

  const bioText = scholar.bio ?? "";
  const bioNeedsExpand = bioText.length > BIO_LIMIT;
  const profileLinks = resolveProfileLinks(scholar);
  const identityTag = getChineseIdentityTag(scholar.custom_fields);
  const showMetrics = scholar.url_hash !== "new";
  const metrics = [
    {
      label: "H-index",
      value: scholar.h_index,
      icon: BarChart3,
      iconClassName: "text-sky-500",
    },
    {
      label: "论文数",
      value: scholar.publications_count,
      icon: FileText,
      iconClassName: "text-emerald-500",
    },
    {
      label: "引用数",
      value: scholar.citations_count,
      icon: Quote,
      iconClassName: "text-violet-500",
    },
  ];
  const metricsUpdatedAt = formatMetricDate(scholar.metrics_updated_at);

  const eduItems =
    scholar.education && scholar.education.length > 0
      ? scholar.education
      : scholar.phd_institution
        ? [
            {
              degree: "博士",
              institution: scholar.phd_institution,
              major: "",
              year: scholar.phd_year || "",
              end_year: "",
            },
          ]
        : [];

  return (
    <motion.aside
      className="w-[400px] shrink-0 max-xl:w-full"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={slideInLeft}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-shrink-0 relative">
              <ScholarAvatar
                key={scholar.photo_url || scholar.name}
                name={scholar.name}
                photoUrl={scholar.photo_url}
              />
              <span
                className={`absolute left-2 bottom-2 rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur ${identityTag.className}`}
              >
                {identityTag.label}
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="text-lg font-bold text-gray-900 leading-snug truncate">
                {scholar.name}
              </h2>
              {scholar.name_en && (
                <p className="text-xs text-gray-400">{scholar.name_en}</p>
              )}
              {scholar.university && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="truncate">{scholar.university}</span>
                </div>
              )}
              {scholar.department && (
                <p className="text-xs text-gray-500">{scholar.department}</p>
              )}
              {scholar.position && (
                <p className="text-sm font-medium text-gray-700">
                  {scholar.position}
                </p>
              )}
            </div>
          </div>

          <ProfileLinkIcons profileLinks={profileLinks} />

          {showMetrics && (
            <>
              <div className="mt-4 mb-4 rounded-xl border border-gray-100 bg-gray-50/80 overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  {metrics.map((metric) => {
                    const MetricIcon = metric.icon;
                    return (
                      <div key={metric.label} className="px-3 py-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                          <MetricIcon className={`w-3.5 h-3.5 ${metric.iconClassName}`} />
                          <span>{metric.label}</span>
                        </div>
                        <div className="mt-1 text-lg font-semibold text-gray-900 leading-none">
                          {formatMetricValue(metric.value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {metricsUpdatedAt && (
                <p className="mb-4 text-[11px] text-gray-400">
                  指标更新时间：{metricsUpdatedAt}
                </p>
              )}
            </>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex flex-wrap gap-1.5">
              {scholar.academic_titles.length > 0 && (
                <>
                  {scholar.academic_titles.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700"
                    >
                      <Award className="h-3 w-3 shrink-0" />
                      <span className="truncate">{t}</span>
                    </span>
                  ))}
                </>
              )}
              {scholar.is_academician && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                  <Award className="h-3 w-3" />
                  院士
                </span>
              )}
            </div>
            {onEditProfile && (
              <button
                type="button"
                onClick={onEditProfile}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-3 text-xs font-medium text-white transition-colors hover:bg-primary-700"
              >
                <Edit3 className="h-3.5 w-3.5" />
                编辑资料
              </button>
            )}
          </div>

        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <SideLabel icon={Mail} title="联系方式" />
          <div className="space-y-2.5">
            {scholar.email && (
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <a
                  href={`mailto:${scholar.email}`}
                  className="hover:text-primary-600 truncate transition-colors text-gray-600"
                >
                  {scholar.email}
                </a>
              </div>
            )}
            {scholar.phone && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{scholar.phone}</span>
              </div>
            )}
            {scholar.office && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{scholar.office}</span>
              </div>
            )}
            {!scholar.email && !scholar.phone && !scholar.office && (
              <p className="text-xs text-gray-300 italic">暂无联系方式</p>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <SideLabel icon={User} title="个人简介" />
          {bioText ? (
            <>
              <p className="text-sm text-gray-600 leading-relaxed">
                {bioNeedsExpand && !bioExpanded
                  ? `${bioText.slice(0, BIO_LIMIT)}...`
                  : bioText}
              </p>
              {bioNeedsExpand && (
                <button
                  onClick={() => setBioExpanded((v) => !v)}
                  className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {bioExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> 收起
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> 展开全文
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-300 italic">暂无个人简介</p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <SideLabel icon={GraduationCap} title="教育经历" />
          {eduItems.length === 0 ? (
            <p className="text-xs text-gray-300 italic">暂无教育经历</p>
          ) : (
            <div className="space-y-4">
              {eduItems.map((edu, i) => (
                <div key={i} className="relative pl-5">
                  <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-white shadow-sm" />
                  {i < eduItems.length - 1 && (
                    <div className="absolute left-[4px] top-4 w-0.5 h-full bg-gray-200" />
                  )}
                  <div className="space-y-1.5 min-w-0">
                    {(edu.year || edu.end_year) && (
                      <p className="text-[11px] font-medium text-gray-400">
                        {formatEducationYears(edu)}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-gray-800 leading-snug break-words">
                      {edu.institution || "院校"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {edu.degree && (
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                          {edu.degree}
                        </span>
                      )}
                      {edu.major && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          {edu.major}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <SideLabel icon={Briefcase} title="任职经历" />
          {scholar.joint_management_roles &&
          scholar.joint_management_roles.length > 0 ? (
            <div className="space-y-2">
              {scholar.joint_management_roles.map((role, i) => (
                <div key={i} className="relative pl-5">
                  <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                  <p className="text-sm text-gray-700">{role.role}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-300 italic">暂无任职经历记录</p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <SideLabel icon={BookOpen} title="研究方向" />
          {scholar.research_areas && scholar.research_areas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {scholar.research_areas.slice(0, 10).map((area) => (
                <span
                  key={area}
                  className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-100"
                >
                  {area}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-300 italic">暂无研究方向</p>
          )}
        </div>
      </motion.div>
    </motion.aside>
  );
}

function buildOrcidHref(orcid: string): string {
  return /^https?:\/\//i.test(orcid) ? orcid : `https://orcid.org/${orcid}`;
}

function formatMetricValue(value: number | null | undefined): string {
  if (typeof value !== "number" || value < 0) return "—";
  return value.toLocaleString("zh-CN");
}

function formatEducationYears(
  edu: NonNullable<ScholarDetail["education"]>[number],
): string {
  const start = String(edu.year || "").trim();
  const end = String(edu.end_year || "").trim();
  if (start && end) return `${start}-${end}`;
  return start || end || "";
}

function formatMetricDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("zh-CN");
}

function ScholarAvatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string;
}) {
  const [photoLoadError, setPhotoLoadError] = useState(false);

  if (photoUrl && !photoLoadError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="w-[120px] h-[120px] rounded-2xl object-cover border border-gray-200 shadow-sm"
        onError={() => setPhotoLoadError(true)}
      />
    );
  }

  return (
    <div className="w-[120px] h-[120px] rounded-2xl flex items-center justify-center text-4xl font-bold bg-primary-600 text-white shadow-sm">
      {getInitial(name)}
    </div>
  );
}

function readNestedBoolean(
  customFields: Record<string, unknown> | undefined,
  groupKey: string,
  valueKey: string,
): boolean | null {
  const group = customFields?.[groupKey];
  if (!group || typeof group !== "object") return null;
  const value = (group as Record<string, unknown>)[valueKey];
  return typeof value === "boolean" ? value : null;
}

function getChineseIdentityTag(
  customFields: Record<string, unknown> | undefined,
): IdentityTag {
  const isChinese =
    readNestedBoolean(customFields, "profile_flags", "is_chinese") ??
    readNestedBoolean(customFields, "metadata_profile", "is_chinese");

  if (isChinese === true) {
    return {
      label: "华人",
      className: "border-emerald-200 bg-emerald-50/95 text-emerald-700",
    };
  }
  if (isChinese === false) {
    return {
      label: "非华人",
      className: "border-slate-200 bg-slate-50/95 text-slate-700",
    };
  }
  return {
    label: "待判定",
    className: "border-gray-200 bg-white/95 text-gray-500",
  };
}

function ProfileLinkIcons({
  profileLinks,
}: {
  profileLinks: ReturnType<typeof resolveProfileLinks>;
}) {
  const links = [
    {
      label: "个人主页",
      value: profileLinks.homepage,
      Icon: Globe,
      className: "hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200",
    },
    {
      label: "GitHub",
      value: profileLinks.github,
      Icon: Github,
      className: "hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300",
    },
    {
      label: "LinkedIn",
      value: profileLinks.linkedin,
      Icon: Linkedin,
      className: "hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200",
    },
    {
      label: "Google Scholar",
      value: profileLinks.google_scholar,
      Icon: GraduationCap,
      className:
        "hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200",
    },
    {
      label: "ORCID",
      value: profileLinks.orcid,
      href: profileLinks.orcid ? buildOrcidHref(profileLinks.orcid) : "",
      Icon: IdCard,
      className:
        "hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200",
    },
    {
      label: "DBLP",
      value: profileLinks.dblp,
      Icon: Database,
      className:
        "hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200",
    },
    {
      label: "X (Twitter)",
      value: profileLinks.x,
      Icon: Twitter,
      className:
        "hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300",
    },
    {
      label: "OpenReview",
      value: profileLinks.openreview,
      Icon: FileText,
      className:
        "hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200",
    },
    {
      label: "AMiner",
      value: profileLinks.aminer,
      Icon: UserSearch,
      className:
        "hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200",
    },
    {
      label: "实验室网站",
      value: profileLinks.lab,
      Icon: FlaskConical,
      className: "hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200",
    },
    ...profileLinks.other.map((value, index) => ({
      label: `其他链接 ${index + 1}`,
      value,
      Icon: Link2,
      className:
        "hover:text-primary-600 hover:bg-primary-50 hover:border-primary-200",
    })),
  ].filter((item) => item.value);

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-start gap-2">
      {links.map((link) => {
        const Icon = link.Icon;
        return (
          <a
            key={`${link.label}-${link.value}`}
            href={"href" in link && link.href ? link.href : link.value}
            target="_blank"
            rel="noopener noreferrer"
            title={link.label}
            aria-label={link.label}
            className={`group/link relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors ${link.className}`}
          >
            <Icon className="h-4.5 w-4.5" />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/link:opacity-100 group-focus-visible/link:opacity-100">
              {link.label}
              <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gray-900" />
            </span>
          </a>
        );
      })}
    </div>
  );
}
