import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchScholarList,
  fetchAllScholars,
  deleteScholar,
  invalidateScholarListCache,
  invalidateScholarUniversityCache,
  type ScholarListFilters,
  type ScholarListResponse,
} from "@/services/scholarApi";
import { useUniversityCounts } from "@/hooks/useUniversityCounts";
import type { UniNode } from "@/components/common/UniversitySidebarTree";
import { parseSubtabFilter } from "@/utils/institutionClassifier";
import { exportScholarsToExcel } from "@/utils/scholarExporter";
import {
  PROJECT_CATEGORIES,
  normalizeProjectSubcategoryLabel,
} from "@/constants/projectCategories";
import {
  type ChineseIdentityFilter,
  type StudentIdentityFilter,
} from "@/utils/scholarIdentity";
import {
  type AchievementTagToken,
  formatAchievementTagToken,
  parseAchievementTagToken,
} from "@/utils/scholarAchievementTags";

const PAGE_SIZE = 20;

function parsePageParam(value: string | null): number {
  const parsed = value ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object" || !("name" in err)) {
    return false;
  }
  return (
    String((err as { name?: unknown }).name) === "AbortError"
  );
}

function getListErrorMessage(err: unknown): string {
  if (
    err instanceof Error &&
    err.message.includes("Request timeout after")
  ) {
    return "数据加载超时，请稍后重试";
  }
  return err instanceof Error ? err.message : "加载失败";
}

const PROJECT_SUBTAB_FILTER: Record<
  string,
  { category?: string; subcategory?: string }
> = {
  education: { category: "教育培养" },
  sci_edu_committee: { category: "教育培养", subcategory: "科技教育委员会" },
  academic_committee: { category: "教育培养", subcategory: "学术委员会" },
  teaching_committee: { category: "教育培养", subcategory: "教学委员会" },
  student_mentor: { category: "教育培养", subcategory: "学院学生高校导师" },
  fulltime_mentor: { category: "教育培养", subcategory: "全职导师" },
  industry_mentor: { category: "教育培养", subcategory: "产业导师" },
  parttime_mentor: { category: "教育培养", subcategory: "兼职导师" },
  research: { category: "科研学术" },
  research_project: { category: "科研学术", subcategory: "科研立项" },
  talent: { category: "人才引育" },
  zhuogong: { category: "人才引育", subcategory: "卓工公派" },
};

interface MentorTypeGroup {
  label: string;
  options: string[];
}

const PROJECT_PRIMARY_OPTIONS = Object.keys(PROJECT_CATEGORIES);
const MENTOR_FILTER_GROUPS: MentorTypeGroup[] = [
  { label: "通用", options: ["全部", "全部共建导师"] },
  ...PROJECT_PRIMARY_OPTIONS.map((category) => ({
    label: category,
    options: [
      category,
      ...Array.from(
        PROJECT_CATEGORIES[category as keyof typeof PROJECT_CATEGORIES]
          .subcategories,
      ),
    ],
  })),
];

const MENTOR_FILTER_OPTIONS: string[] = Array.from(
  new Set(MENTOR_FILTER_GROUPS.flatMap((group) => group.options)),
);
const STUDENT_IDENTITY_OPTIONS: StudentIdentityFilter[] = [
  "全部",
  "学生",
  "非学生",
];
const CHINESE_IDENTITY_OPTIONS: ChineseIdentityFilter[] = [
  "全部",
  "华人",
  "非华人",
  "待判定",
];

function normalizeStudentIdentityFilter(
  value: string | null,
): StudentIdentityFilter {
  return STUDENT_IDENTITY_OPTIONS.includes(value as StudentIdentityFilter)
    ? (value as StudentIdentityFilter)
    : "全部";
}

function normalizeChineseIdentityFilter(
  value: string | null,
): ChineseIdentityFilter {
  return CHINESE_IDENTITY_OPTIONS.includes(value as ChineseIdentityFilter)
    ? (value as ChineseIdentityFilter)
    : "全部";
}

function normalizeAchievementTagFilters(value: string | null): AchievementTagToken[] {
  if (!value) return [];
  const tags = value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  return Array.from(
    new Set(
      tags
        .map((tag) => parseAchievementTagToken(tag)?.token)
        .filter((tag): tag is AchievementTagToken => Boolean(tag)),
    ),
  );
}

interface UseScholarListOptions {
  enableMentorFilter?: boolean;
}

export function useScholarList(options: UseScholarListOptions = {}) {
  const enableMentorFilter = options.enableMentorFilter ?? true;
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab");
  const activeUni = searchParams.get("university");
  const activeDept = searchParams.get("department");
  const pageParam = searchParams.get("page");
  const mentorType = enableMentorFilter
    ? (searchParams.get("mentor_type") ?? "全部")
    : "全部";
  const studentIdentity = normalizeStudentIdentityFilter(
    searchParams.get("student_identity"),
  );
  const chineseIdentity = normalizeChineseIdentityFilter(
    searchParams.get("chinese_identity"),
  );
  const achievementTagsParam =
    searchParams.get("achievement_tags") ?? searchParams.get("achievement_tag");
  const achievementTags = useMemo(
    () => normalizeAchievementTagFilters(achievementTagsParam),
    [achievementTagsParam],
  );
  const activeSubTab = searchParams.get("subtab");
  const participatedEventId = searchParams.get("participated_event_id");
  const eventTitle = searchParams.get("event_title");

  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(parsePageParam(pageParam));
  const [reloadSeed, setReloadSeed] = useState(0);
  const [universityReloadSeed, setUniversityReloadSeed] = useState(0);
  const prevQueryRef = useRef(query);
  const listRequestSeqRef = useRef(0);
  const pageUpdateSourceRef = useRef<"url" | null>(null);

  /* API state */
  const [apiData, setApiData] = useState<ScholarListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingHash, setDeletingHash] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [eventScopedUniNodes, setEventScopedUniNodes] = useState<UniNode[]>([]);
  const [eventScopedUniLoading, setEventScopedUniLoading] = useState(false);
  const [eventScopedUniError, setEventScopedUniError] = useState<string | null>(
    null,
  );
  const [projectScopedUniNodes, setProjectScopedUniNodes] = useState<UniNode[]>(
    [],
  );
  const [projectScopedUniLoading, setProjectScopedUniLoading] = useState(false);
  const [projectScopedUniError, setProjectScopedUniError] = useState<
    string | null
  >(null);

  // 根据当前 subtab 过滤机构节点
  const { region: subtabRegion, type: subtabType } = useMemo(
    () => parseSubtabFilter(activeSubTab),
    [activeSubTab],
  );

  // 将前端分类值映射到后端 API 参数
  const apiRegion = useMemo(() => {
    if (subtabRegion === "domestic") return "国内";
    if (subtabRegion === "international") return "国际";
    return undefined;
  }, [subtabRegion]);

  const apiAffiliationType = useMemo(() => {
    if (subtabType === "university") return "高校";
    if (subtabType === "company") return "企业";
    if (subtabType === "research_institute") return "研究机构";
    if (subtabType === "other") return "其他";
    return undefined;
  }, [subtabType]);

  const projectFilter = useMemo(
    () => (activeTab === "projects" ? PROJECT_SUBTAB_FILTER[activeSubTab ?? ""] ?? {} : {}),
    [activeTab, activeSubTab],
  );
  const mentorApiFilter = useMemo<
    Pick<
      ScholarListFilters,
      | "is_adjunct_supervisor"
      | "is_cobuild_scholar"
      | "project_category"
      | "project_subcategory"
    >
  >(() => {
    if (!mentorType || mentorType === "全部") return {};
    if (mentorType === "全部共建导师") return { is_cobuild_scholar: true };
    if (mentorType === "兼职导师") {
      return {
        is_adjunct_supervisor: true,
        project_subcategory: "兼职导师",
      };
    }
    if (PROJECT_PRIMARY_OPTIONS.includes(mentorType)) {
      return { project_category: mentorType };
    }
    return {
      project_subcategory:
        normalizeProjectSubcategoryLabel(mentorType) || mentorType,
    };
  }, [mentorType]);
  const effectiveProjectCategory =
    mentorApiFilter.project_category ?? projectFilter.category;
  const effectiveProjectSubcategory =
    mentorApiFilter.project_subcategory ?? projectFilter.subcategory;
  const effectiveAdjunctSupervisor = mentorApiFilter.is_adjunct_supervisor;
  const effectiveCobuildScholar = mentorApiFilter.is_cobuild_scholar;
  const apiStudentIdentity = useMemo<boolean | undefined>(() => {
    if (studentIdentity === "学生") return true;
    if (studentIdentity === "非学生") return false;
    return undefined;
  }, [studentIdentity]);
  const apiChineseIdentity = useMemo<boolean | undefined>(() => {
    if (chineseIdentity === "华人") return true;
    if (chineseIdentity === "非华人") return false;
    return undefined;
  }, [chineseIdentity]);
  const apiChineseIdentityStatus = useMemo<"unknown" | undefined>(() => {
    if (chineseIdentity === "待判定") return "unknown";
    return undefined;
  }, [chineseIdentity]);
  const normalizedQuery = query.trim();
  const apiListFilters = useMemo<ScholarListFilters>(
    () => ({
      university: activeUni ?? undefined,
      department: activeDept ?? undefined,
      search: normalizedQuery || undefined,
      participated_event_id: participatedEventId ?? undefined,
      is_chinese: apiChineseIdentity,
      is_current_student: apiStudentIdentity,
      chinese_identity: apiChineseIdentityStatus,
      achievement_tags: achievementTags.length > 0 ? achievementTags : undefined,
      is_adjunct_supervisor: effectiveAdjunctSupervisor,
      is_cobuild_scholar: effectiveCobuildScholar,
      region: apiRegion,
      affiliation_type: apiAffiliationType,
      project_category: effectiveProjectCategory,
      project_subcategory: effectiveProjectSubcategory,
    }),
    [
      activeUni,
      activeDept,
      normalizedQuery,
      participatedEventId,
      apiChineseIdentity,
      apiChineseIdentityStatus,
      apiStudentIdentity,
      achievementTags,
      effectiveAdjunctSupervisor,
      effectiveCobuildScholar,
      apiRegion,
      apiAffiliationType,
      effectiveProjectCategory,
      effectiveProjectSubcategory,
    ],
  );

  /* University counts — filtered by current subtab */
  const {
    universities,
    totalCount: defaultTotalCount,
    loading: defaultUniLoading,
    error: defaultUniError,
  } = useUniversityCounts({
    region: apiRegion,
    affiliation_type: apiAffiliationType,
    is_adjunct_supervisor: effectiveAdjunctSupervisor,
    refreshSeed: universityReloadSeed,
  });

  // uniNodes already filtered by backend, no client-side re-filtering needed
  const filteredUniNodes = useMemo<UniNode[]>(() => {
    if (!Array.isArray(universities)) return [];
    return universities.map((uni) => ({
      name: uni.name,
      departments: uni.departments.map((dept) => ({
        name: dept.name,
        count: dept.scholar_count,
      })),
      count: uni.scholarCount,
    }));
  }, [universities]);

  useEffect(() => {
    setEventScopedUniNodes([]);
    setEventScopedUniError(null);
    setEventScopedUniLoading(false);
  }, [participatedEventId]);

  useEffect(() => {
    setProjectScopedUniNodes([]);
    setProjectScopedUniError(null);
    setProjectScopedUniLoading(false);
  }, [activeTab]);

  const effectiveUniNodes = participatedEventId && eventScopedUniNodes.length > 0
    ? eventScopedUniNodes
    : activeTab === "projects" && projectScopedUniNodes.length > 0
      ? projectScopedUniNodes
      : filteredUniNodes;
  const effectiveTotalCount = useMemo(
    () => effectiveUniNodes.reduce((sum, uni) => sum + uni.count, 0),
    [effectiveUniNodes],
  );
  const effectiveUniLoading = participatedEventId
    ? eventScopedUniLoading
    : activeTab === "projects"
      ? projectScopedUniLoading
      : defaultUniLoading;
  const effectiveUniError = participatedEventId
    ? eventScopedUniError
    : activeTab === "projects"
      ? projectScopedUniError
      : defaultUniError;

  /* Fetch paginated data — cancel in-flight request on dep change */
  useEffect(() => {
    const controller = new AbortController();
    const requestSeq = listRequestSeqRef.current + 1;
    listRequestSeqRef.current = requestSeq;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      fetchScholarList(page, PAGE_SIZE, apiListFilters, controller.signal)
        .then((res) => {
          if (controller.signal.aborted || requestSeq !== listRequestSeqRef.current) {
            return;
          }
          setApiData(res);
          if (res.page !== page) {
            setPage(res.page);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          if (
            controller.signal.aborted ||
            requestSeq !== listRequestSeqRef.current ||
            isAbortError(err)
          ) {
            return;
          }
          setError(getListErrorMessage(err));
          setIsLoading(false);
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    page,
    reloadSeed,
    query,
    mentorType,
    studentIdentity,
    chineseIdentity,
    achievementTags,
    apiListFilters,
    activeTab,
    activeSubTab,
    projectFilter,
    normalizedQuery,
  ]);

  /* Sync external URL page changes back to local state. */
  useEffect(() => {
    const urlPage = parsePageParam(pageParam);
    setPage((currentPage) => {
      if (urlPage === currentPage) return currentPage;
      pageUpdateSourceRef.current = "url";
      return urlPage;
    });
  }, [pageParam]);

  /* Sync page to URL — only write when URL value actually differs */
  useEffect(() => {
    if (pageUpdateSourceRef.current === "url") {
      pageUpdateSourceRef.current = null;
      return;
    }
    const currentPage = parsePageParam(pageParam);
    if (currentPage === page) return; // already in sync, skip
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", String(page));
    }
    setSearchParams(newParams, { replace: true });
  }, [page, pageParam, searchParams, setSearchParams]);

  /* Reset page only when query actually changes after initial mount */
  useEffect(() => {
    if (prevQueryRef.current === query) return;
    prevQueryRef.current = query;
    setPage(1);
  }, [query]);

  const handleSelectUni = (name: string | null) => {
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (name) {
      newParams.set("university", name);
      newParams.delete("department");
    } else {
      newParams.delete("university");
      newParams.delete("department");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleSelectDept = (uniName: string, deptName: string) => {
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("university", uniName);
    newParams.set("department", deptName);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleChangeMentorType = (nextType: string) => {
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (!nextType || nextType === "全部") {
      newParams.delete("mentor_type");
    } else {
      newParams.set("mentor_type", nextType);
    }
    newParams.delete("is_adjunct_supervisor");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleChangeStudentIdentity = (nextValue: StudentIdentityFilter) => {
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (nextValue === "全部") {
      newParams.delete("student_identity");
    } else {
      newParams.set("student_identity", nextValue);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleChangeChineseIdentity = (nextValue: ChineseIdentityFilter) => {
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (nextValue === "全部") {
      newParams.delete("chinese_identity");
    } else {
      newParams.set("chinese_identity", nextValue);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleChangeAchievementTags = (nextValues: AchievementTagToken[]) => {
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    const uniqueValues = Array.from(new Set(nextValues));
    newParams.delete("achievement_tag");
    if (uniqueValues.length === 0) {
      newParams.delete("achievement_tags");
    } else {
      newParams.set("achievement_tags", uniqueValues.join(","));
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const applyAdvancedFilters = (nextFilters: {
    mentorType?: string;
    studentIdentity?: StudentIdentityFilter;
    chineseIdentity?: ChineseIdentityFilter;
    achievementTags?: AchievementTagToken[];
  }) => {
    setPage(1);
    const newParams = new URLSearchParams(searchParams);

    if (nextFilters.mentorType !== undefined) {
      if (!nextFilters.mentorType || nextFilters.mentorType === "全部") {
        newParams.delete("mentor_type");
      } else {
        newParams.set("mentor_type", nextFilters.mentorType);
      }
      newParams.delete("is_adjunct_supervisor");
    }

    if (nextFilters.studentIdentity !== undefined) {
      if (nextFilters.studentIdentity === "全部") {
        newParams.delete("student_identity");
      } else {
        newParams.set("student_identity", nextFilters.studentIdentity);
      }
    }

    if (nextFilters.chineseIdentity !== undefined) {
      if (nextFilters.chineseIdentity === "全部") {
        newParams.delete("chinese_identity");
      } else {
        newParams.set("chinese_identity", nextFilters.chineseIdentity);
      }
    }

    if (nextFilters.achievementTags !== undefined) {
      const uniqueValues = Array.from(new Set(nextFilters.achievementTags));
      newParams.delete("achievement_tag");
      if (uniqueValues.length === 0) {
        newParams.delete("achievement_tags");
      } else {
        newParams.set("achievement_tags", uniqueValues.join(","));
      }
    }

    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const resetAdvancedFilters = () => {
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("mentor_type");
    newParams.delete("student_identity");
    newParams.delete("chinese_identity");
    newParams.delete("achievement_tag");
    newParams.delete("achievement_tags");
    newParams.delete("is_adjunct_supervisor");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const clearAll = () => {
    setPage(1);
    setQuery("");
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  };

  const handleClearParticipatedEvent = () => {
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("participated_event_id");
    newParams.delete("event_title");
    newParams.delete("page");
    setSearchParams(newParams);
  };

  const handleDeleteScholar = async (urlHash: string, name: string) => {
    if (!urlHash?.trim()) {
      setError(`删除失败：学者 ${name} 缺少有效ID`);
      return;
    }
    if (!window.confirm(`确定要删除 ${name} 吗？此操作不可撤销。`)) {
      return;
    }

    setDeletingHash(urlHash);
    try {
      await deleteScholar(urlHash);
      invalidateScholarUniversityCache();
      setPage(1);
      setUniversityReloadSeed((prev) => prev + 1);
      setReloadSeed((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingHash(null);
    }
  };

  const refreshList = () => {
    invalidateScholarListCache();
    invalidateScholarUniversityCache();
    setUniversityReloadSeed((prev) => prev + 1);
    setReloadSeed((prev) => prev + 1);
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const allScholars = await fetchAllScholars(apiListFilters);
      exportScholarsToExcel(allScholars);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "导出失败";
      alert(errorMsg);
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const items = apiData?.items ?? [];

  const filterChips: { label: string; onRemove: () => void }[] = [
    ...(participatedEventId
      ? [
          {
            label: `活动：${eventTitle?.trim() || `ID ${participatedEventId}`}`,
            onRemove: handleClearParticipatedEvent,
          },
        ]
      : []),
    ...(activeUni
      ? [{ label: activeUni, onRemove: () => handleSelectUni(null) }]
      : []),
    ...(activeDept
      ? [
          {
            label: activeDept,
            onRemove: () => handleSelectUni(activeUni),
          },
        ]
      : []),
    ...(mentorType && mentorType !== "全部"
      ? [
          {
            label: `共建导师：${mentorType}`,
            onRemove: () => handleChangeMentorType("全部"),
          },
        ]
      : []),
    ...(studentIdentity !== "全部"
      ? [
          {
            label: `人员身份：${studentIdentity}`,
            onRemove: () => handleChangeStudentIdentity("全部"),
          },
        ]
      : []),
    ...(chineseIdentity !== "全部"
      ? [
          {
            label: `华人身份：${chineseIdentity}`,
            onRemove: () => handleChangeChineseIdentity("全部"),
          },
        ]
      : []),
    ...(achievementTags.length > 0
      ? [
          {
            label: `学术标识：${achievementTags.map(formatAchievementTagToken).join("、")}`,
            onRemove: () => handleChangeAchievementTags([]),
          },
        ]
      : []),
  ].filter((c) => c.label);

  const hasAnyFilter = filterChips.length > 0 || !!query;
  const advancedFilterCount = [
    enableMentorFilter && mentorType && mentorType !== "全部",
    studentIdentity !== "全部",
    chineseIdentity !== "全部",
    achievementTags.length > 0,
  ].filter(Boolean).length;

  return {
    // Sidebar data
    filteredUniNodes: effectiveUniNodes,
    totalCount: participatedEventId ? effectiveTotalCount : defaultTotalCount,
    uniLoading: effectiveUniLoading,
    uniError: effectiveUniError,
    activeUni,
    activeDept,
    activeSubTab,
    handleSelectUni,
    handleSelectDept,

    // Search & filter
    query,
    setQuery,
    searchInput,
    setSearchInput,
    filterChips,
    hasAnyFilter,
    clearAll,
    mentorType,
    studentIdentity,
    chineseIdentity,
    achievementTags,
    advancedFilterCount,
    mentorTypeOptions: [...MENTOR_FILTER_OPTIONS],
    mentorTypeGroups: MENTOR_FILTER_GROUPS.map((group) => ({
      label: group.label,
      options: [...group.options],
    })),
    handleChangeMentorType,
    handleChangeStudentIdentity,
    handleChangeChineseIdentity,
    handleChangeAchievementTags,
    applyAdvancedFilters,
    resetAdvancedFilters,

    // Data & pagination
    items,
    page,
    setPage,
    totalPages: apiData?.total_pages ?? 1,
    total: apiData?.total ?? 0,
    isLoading,
    error,
    refreshList,

    // Delete
    deletingHash,
    handleDeleteScholar,

    // Export
    handleExportToExcel,
    isExporting,
  };
}
