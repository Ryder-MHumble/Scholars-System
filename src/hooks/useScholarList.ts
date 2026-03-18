import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchScholarList,
  fetchAllScholars,
  deleteScholar,
  type ScholarListResponse,
} from "@/services/scholarApi";
import { useUniversityCounts } from "@/hooks/useUniversityCounts";
import type { UniNode } from "@/components/common/UniversitySidebarTree";
import { parseSubtabFilter } from "@/utils/institutionClassifier";
import { exportScholarsToExcel } from "@/utils/scholarExporter";

const PAGE_SIZE = 20;

export function useScholarList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeUni = searchParams.get("university");
  const activeDept = searchParams.get("department");
  const pageParam = searchParams.get("page");
  const isJointMentor = searchParams.get("is_adjunct_supervisor") === "true";
  const activeSubTab = searchParams.get("subtab");

  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(pageParam ? parseInt(pageParam, 10) : 1);

  /* API state */
  const [apiData, setApiData] = useState<ScholarListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingHash, setDeletingHash] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  /* University counts — filtered by current subtab */
  const {
    universities,
    totalCount,
    loading: uniLoading,
    error: uniError,
  } = useUniversityCounts({
    region: apiRegion,
    affiliation_type: apiAffiliationType,
    is_adjunct_supervisor: isJointMentor || undefined,
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

  /* Fetch paginated data — cancel in-flight request on dep change */
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    fetchScholarList(
      page,
      PAGE_SIZE,
      {
        university: activeUni ?? undefined,
        department: activeDept ?? undefined,
        search: query.trim() || undefined,
        is_adjunct_supervisor: isJointMentor || undefined,
        region: apiRegion,
        affiliation_type: apiAffiliationType,
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
    activeUni,
    activeDept,
    query,
    isJointMentor,
    apiRegion,
    apiAffiliationType,
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
  }, [page, setSearchParams]);

  /* Reset page on query change */
  useEffect(() => {
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

  const handleToggleJointMentor = () => {
    const newParams = new URLSearchParams(searchParams);
    if (isJointMentor) {
      newParams.delete("is_adjunct_supervisor");
    } else {
      newParams.set("is_adjunct_supervisor", "true");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const clearAll = () => {
    setQuery("");
    setSearchParams(new URLSearchParams());
  };

  const handleDeleteScholar = async (urlHash: string, name: string) => {
    if (!window.confirm(`确定要删除 ${name} 吗？此操作不可撤销。`)) {
      return;
    }

    setDeletingHash(urlHash);
    try {
      await deleteScholar(urlHash);
      setIsLoading(true);
      fetchScholarList(1, PAGE_SIZE, {
        university: activeUni ?? undefined,
        department: activeDept ?? undefined,
        search: query.trim() || undefined,
        is_adjunct_supervisor: isJointMentor || undefined,
        region: apiRegion,
        affiliation_type: apiAffiliationType,
      })
        .then((res) => {
          setApiData(res);
          setPage(1);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message ?? "刷新失败");
          setIsLoading(false);
        });
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingHash(null);
    }
  };

  const refreshList = () => {
    setIsLoading(true);
    setError(null);
    fetchScholarList(page, PAGE_SIZE, {
      university: activeUni ?? undefined,
      department: activeDept ?? undefined,
      search: query.trim() || undefined,
      is_adjunct_supervisor: isJointMentor || undefined,
      region: apiRegion,
      affiliation_type: apiAffiliationType,
    })
      .then((res) => {
        setApiData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "加载失败");
        setIsLoading(false);
      });
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const allScholars = await fetchAllScholars({
        university: activeUni ?? undefined,
        department: activeDept ?? undefined,
        search: query.trim() || undefined,
        is_adjunct_supervisor: isJointMentor || undefined,
        region: apiRegion,
        affiliation_type: apiAffiliationType,
      });
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
    ...(isJointMentor
      ? [{ label: "兼职导师", onRemove: handleToggleJointMentor }]
      : []),
  ].filter((c) => c.label);

  const hasAnyFilter = filterChips.length > 0 || !!query;

  return {
    // Sidebar data
    filteredUniNodes,
    totalCount,
    uniLoading,
    uniError,
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
    isJointMentor,
    handleToggleJointMentor,

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
