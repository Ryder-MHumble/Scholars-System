import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchScholarList,
  fetchAllScholars,
  deleteScholar,
  type ScholarListItem,
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

const PAGE_SIZE = 20;

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

const PROJECT_PARENT_SUBCATEGORY_FILTERS: Record<string, string[]> = {
  education: [
    "科技教育委员会",
    "科技育青委员会",
    "学术委员会",
    "教学委员会",
    "学院学生高校导师",
    "学院学生事务导师",
    "全职导师",
    "产业导师",
    "兼职导师",
  ],
  research: ["科研立项"],
  talent: ["卓工公派"],
};

const PROJECT_PARENT_CATEGORY_MAP: Record<string, string> = {
  education: "教育培养",
  research: "科研学术",
  talent: "人才引育",
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

function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

function getScholarMentorSubcategories(item: ScholarListItem): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const tag of item.project_tags ?? []) {
    const sub = normalizeProjectSubcategoryLabel(
      String(tag.subcategory ?? "").trim(),
    );
    if (!sub) continue;
    const key = normalizeLabel(sub);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(sub);
  }
  const legacySubcategory = normalizeProjectSubcategoryLabel(
    String(item.project_subcategory ?? "").trim(),
  );
  if (legacySubcategory) {
    const legacyKey = normalizeLabel(legacySubcategory);
    if (!seen.has(legacyKey)) {
      seen.add(legacyKey);
      result.push(legacySubcategory);
    }
  }
  return result;
}

function getScholarProjectCategories(item: ScholarListItem): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const tag of item.project_tags ?? []) {
    const category = String(tag.category ?? "").trim();
    if (!category) continue;
    const key = normalizeLabel(category);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(category);
  }
  const legacyCategory = String(item.project_category ?? "").trim();
  if (legacyCategory) {
    const key = normalizeLabel(legacyCategory);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(legacyCategory);
    }
  }
  return result;
}

function isCobuildScholar(item: ScholarListItem): boolean {
  const hasProjectTags = (item.project_tags?.length ?? 0) > 0;
  const hasLegacyProjectCategory = Boolean(
    String(item.project_category ?? "").trim() ||
      String(item.project_subcategory ?? "").trim(),
  );
  return (
    hasProjectTags ||
    hasLegacyProjectCategory ||
    Boolean(item.adjunct_supervisor?.status)
  );
}

function matchesMentorType(item: ScholarListItem, mentorType: string): boolean {
  if (!mentorType || mentorType === "全部") return true;
  if (mentorType === "全部共建导师") return isCobuildScholar(item);

  if (PROJECT_PRIMARY_OPTIONS.includes(mentorType)) {
    const target = normalizeLabel(mentorType);
    const categories = getScholarProjectCategories(item).map(normalizeLabel);
    return categories.includes(target);
  }

  const normalizedMentorType =
    normalizeProjectSubcategoryLabel(mentorType) || mentorType;

  if (mentorType === "兼职导师") {
    const subs = getScholarMentorSubcategories(item).map(normalizeLabel);
    if (subs.includes(normalizeLabel("兼职导师"))) return true;
    return Boolean(item.adjunct_supervisor?.status);
  }

  const target = normalizeLabel(normalizedMentorType);
  const subs = getScholarMentorSubcategories(item).map(normalizeLabel);
  return subs.includes(target);
}

function matchesProjectScope(
  item: ScholarListItem,
  options: {
    activeTab: string | null;
    activeSubTab: string | null;
    isProjectParentSubtab: boolean;
    projectFilter: { category?: string; subcategory?: string };
  },
): boolean {
  const { activeTab, activeSubTab, isProjectParentSubtab, projectFilter } =
    options;
  if (activeTab !== "projects") return true;
  if (!activeSubTab) return isCobuildScholar(item);

  if (isProjectParentSubtab) {
    const parentCategory = PROJECT_PARENT_CATEGORY_MAP[activeSubTab];
    const rawSubcategories =
      PROJECT_PARENT_SUBCATEGORY_FILTERS[activeSubTab] ?? [];
    const normalizedSubcategorySet = new Set(
      rawSubcategories.map((sub) =>
        normalizeLabel(normalizeProjectSubcategoryLabel(sub) || sub),
      ),
    );
    const hasCategoryMatch = parentCategory
      ? getScholarProjectCategories(item)
          .map(normalizeLabel)
          .includes(normalizeLabel(parentCategory))
      : false;
    const hasSubcategoryMatch = getScholarMentorSubcategories(item)
      .map(normalizeLabel)
      .some((sub) => normalizedSubcategorySet.has(sub));
    if (activeSubTab === "education") {
      return (
        hasCategoryMatch ||
        hasSubcategoryMatch ||
        Boolean(item.adjunct_supervisor?.status)
      );
    }
    return hasCategoryMatch || hasSubcategoryMatch;
  }

  if (projectFilter.subcategory) {
    const normalizedSubcategory =
      normalizeProjectSubcategoryLabel(projectFilter.subcategory) ||
      projectFilter.subcategory;
    const subcategoryKey = normalizeLabel(normalizedSubcategory);
    if (subcategoryKey === normalizeLabel("兼职导师")) {
      const subs = getScholarMentorSubcategories(item).map(normalizeLabel);
      return (
        subs.includes(normalizeLabel("兼职导师")) ||
        Boolean(item.adjunct_supervisor?.status)
      );
    }
    return getScholarMentorSubcategories(item)
      .map(normalizeLabel)
      .includes(subcategoryKey);
  }

  if (projectFilter.category) {
    return getScholarProjectCategories(item)
      .map(normalizeLabel)
      .includes(normalizeLabel(projectFilter.category));
  }

  return isCobuildScholar(item);
}

function buildUniNodesFromScholars(items: ScholarListItem[]): UniNode[] {
  const uniMap = new Map<string, { count: number; departments: Map<string, number> }>();

  for (const item of items) {
    const uniName = String(item.university ?? "").trim() || "未知机构";
    const deptName = String(item.department ?? "").trim();

    const uniEntry = uniMap.get(uniName) ?? {
      count: 0,
      departments: new Map<string, number>(),
    };
    uniEntry.count += 1;
    if (deptName) {
      uniEntry.departments.set(deptName, (uniEntry.departments.get(deptName) ?? 0) + 1);
    }
    uniMap.set(uniName, uniEntry);
  }

  return Array.from(uniMap.entries()).map(([name, entry]) => ({
    name,
    count: entry.count,
    departments: Array.from(entry.departments.entries()).map(([deptName, deptCount]) => ({
      name: deptName,
      count: deptCount,
    })),
  }));
}

export function useScholarList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab");
  const activeUni = searchParams.get("university");
  const activeDept = searchParams.get("department");
  const pageParam = searchParams.get("page");
  const mentorType = searchParams.get("mentor_type") ?? "全部";
  const activeSubTab = searchParams.get("subtab");
  const participatedEventId = searchParams.get("participated_event_id");
  const eventTitle = searchParams.get("event_title");

  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(pageParam ? parseInt(pageParam, 10) : 1);
  const [reloadSeed, setReloadSeed] = useState(0);
  const prevQueryRef = useRef(query);

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
  const isProjectParentSubtab = useMemo(
    () =>
      activeTab === "projects" &&
      Boolean(activeSubTab && PROJECT_PARENT_SUBCATEGORY_FILTERS[activeSubTab]),
    [activeTab, activeSubTab],
  );
  const isProjectRootTab = useMemo(
    () => activeTab === "projects" && !activeSubTab,
    [activeTab, activeSubTab],
  );
  const requiresMentorTypeFilter = useMemo(
    () => Boolean(mentorType && mentorType !== "全部"),
    [mentorType],
  );
  const needsClientFiltering =
    isProjectRootTab || isProjectParentSubtab || requiresMentorTypeFilter;

  /* University counts — filtered by current subtab */
  const {
    universities,
    totalCount: defaultTotalCount,
    loading: defaultUniLoading,
    error: defaultUniError,
  } = useUniversityCounts({
    region: apiRegion,
    affiliation_type: apiAffiliationType,
    is_adjunct_supervisor: mentorType === "兼职导师" ? true : undefined,
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
    if (!participatedEventId) {
      setEventScopedUniNodes([]);
      setEventScopedUniError(null);
      setEventScopedUniLoading(false);
      return;
    }

    const controller = new AbortController();
    setEventScopedUniLoading(true);
    setEventScopedUniError(null);

    fetchAllScholars(
      {
        participated_event_id: participatedEventId,
        region: apiRegion,
        affiliation_type: apiAffiliationType,
        is_adjunct_supervisor: mentorType === "兼职导师" ? true : undefined,
      },
      controller.signal,
    )
      .then((allItems) => {
        const mentorFiltered = allItems.filter((item) =>
          matchesMentorType(item, mentorType),
        );
        setEventScopedUniNodes(buildUniNodesFromScholars(mentorFiltered));
        setEventScopedUniLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setEventScopedUniError(err.message ?? "加载机构统计失败");
          setEventScopedUniNodes([]);
          setEventScopedUniLoading(false);
        }
      });

    return () => controller.abort();
  }, [participatedEventId, apiRegion, apiAffiliationType, mentorType]);

  useEffect(() => {
    if (activeTab !== "projects") {
      setProjectScopedUniNodes([]);
      setProjectScopedUniError(null);
      setProjectScopedUniLoading(false);
      return;
    }

    const controller = new AbortController();
    setProjectScopedUniLoading(true);
    setProjectScopedUniError(null);

    fetchAllScholars(
      {
        is_adjunct_supervisor: mentorType === "兼职导师" ? true : undefined,
        project_category: projectFilter.category,
        project_subcategory: projectFilter.subcategory,
      },
      controller.signal,
    )
      .then((allItems) => {
        const scoped = allItems.filter((item) =>
          matchesProjectScope(item, {
            activeTab,
            activeSubTab,
            isProjectParentSubtab,
            projectFilter,
          }),
        );
        const mentorFiltered = scoped.filter((item) =>
          matchesMentorType(item, mentorType),
        );
        setProjectScopedUniNodes(buildUniNodesFromScholars(mentorFiltered));
        setProjectScopedUniLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setProjectScopedUniError(err.message ?? "加载项目机构树失败");
          setProjectScopedUniNodes([]);
          setProjectScopedUniLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    activeTab,
    activeSubTab,
    isProjectParentSubtab,
    mentorType,
    projectFilter,
  ]);

  const effectiveUniNodes = participatedEventId
    ? eventScopedUniNodes
    : activeTab === "projects"
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
    setIsLoading(true);
    setError(null);
    if (needsClientFiltering) {
      const matchProjectScope = (item: ScholarListItem): boolean =>
        matchesProjectScope(item, {
          activeTab,
          activeSubTab,
          isProjectParentSubtab,
          projectFilter,
        });
      const matchMentorType = (item: ScholarListItem): boolean =>
        matchesMentorType(item, mentorType);

      fetchAllScholars(
        {
          university: activeUni ?? undefined,
          department: activeDept ?? undefined,
          search: query.trim() || undefined,
          participated_event_id: participatedEventId ?? undefined,
          is_adjunct_supervisor:
            mentorType === "兼职导师" ? true : undefined,
          region: apiRegion,
          affiliation_type: apiAffiliationType,
          project_category: projectFilter.category,
          project_subcategory: projectFilter.subcategory,
        },
        controller.signal,
      )
        .then((allItems) => {
          const filtered = allItems.filter(
            (item) => matchProjectScope(item) && matchMentorType(item),
          );
          const total = filtered.length;
          const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
          const safePage = Math.min(Math.max(page, 1), totalPages);
          const start = (safePage - 1) * PAGE_SIZE;
          const items = filtered.slice(start, start + PAGE_SIZE);
          setApiData({
            total,
            page: safePage,
            page_size: PAGE_SIZE,
            total_pages: totalPages,
            items,
          });
          if (safePage !== page) {
            setPage(safePage);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setError(err.message ?? "加载失败");
            setIsLoading(false);
          }
        });

      return () => controller.abort();
    }

    fetchScholarList(
      page,
      PAGE_SIZE,
      {
        university: activeUni ?? undefined,
        department: activeDept ?? undefined,
        search: query.trim() || undefined,
        participated_event_id: participatedEventId ?? undefined,
        is_adjunct_supervisor: mentorType === "兼职导师" ? true : undefined,
        region: apiRegion,
        affiliation_type: apiAffiliationType,
        project_category: projectFilter.category,
        project_subcategory: projectFilter.subcategory,
      },
      controller.signal,
    )
      .then((res) => {
        setApiData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message ?? "加载失败");
          setIsLoading(false);
        }
      });
    return () => controller.abort();
  }, [
    page,
    reloadSeed,
    activeUni,
    activeDept,
    query,
    participatedEventId,
    mentorType,
    apiRegion,
    apiAffiliationType,
    needsClientFiltering,
    activeTab,
    isProjectParentSubtab,
    activeSubTab,
    projectFilter.category,
    projectFilter.subcategory,
  ]);

  /* Sync page to URL — only write when URL value actually differs */
  useEffect(() => {
    const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
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
    const newParams = new URLSearchParams(searchParams);
    newParams.set("university", uniName);
    newParams.set("department", deptName);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleChangeMentorType = (nextType: string) => {
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

  const clearAll = () => {
    setQuery("");
    setSearchParams(new URLSearchParams());
  };

  const handleClearParticipatedEvent = () => {
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
      setPage(1);
      setReloadSeed((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingHash(null);
    }
  };

  const refreshList = () => {
    setReloadSeed((prev) => prev + 1);
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const allScholars = await fetchAllScholars({
        university: activeUni ?? undefined,
        department: activeDept ?? undefined,
        search: query.trim() || undefined,
        participated_event_id: participatedEventId ?? undefined,
        is_adjunct_supervisor: mentorType === "兼职导师" ? true : undefined,
        region: apiRegion,
        affiliation_type: apiAffiliationType,
        project_category: projectFilter.category,
        project_subcategory: projectFilter.subcategory,
      });
      if (!needsClientFiltering) {
        exportScholarsToExcel(allScholars);
        return;
      }

      const filteredScholars = allScholars.filter((item) => {
        const projectMatched = matchesProjectScope(item, {
          activeTab,
          activeSubTab,
          isProjectParentSubtab,
          projectFilter,
        });
        if (!projectMatched) return false;
        const mentorMatched = matchesMentorType(item, mentorType);
        return mentorMatched;
      });

      exportScholarsToExcel(filteredScholars);
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
      ? [{ label: `共建导师：${mentorType}`, onRemove: () => handleChangeMentorType("全部") }]
      : []),
  ].filter((c) => c.label);

  const hasAnyFilter = filterChips.length > 0 || !!query;

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
    mentorTypeOptions: [...MENTOR_FILTER_OPTIONS],
    mentorTypeGroups: MENTOR_FILTER_GROUPS.map((group) => ({
      label: group.label,
      options: [...group.options],
    })),
    handleChangeMentorType,

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
