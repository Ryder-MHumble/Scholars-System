import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchScholarList,
  deleteScholar,
  type ScholarListResponse,
} from "@/services/scholarApi";
import { useUniversityCounts } from "@/hooks/useUniversityCounts";
import type { UniNode } from "@/components/common/UniversitySidebarTree";

const PAGE_SIZE = 20;

export function useScholarList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeUni = searchParams.get("university");
  const activeDept = searchParams.get("department");
  const pageParam = searchParams.get("page");

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(pageParam ? parseInt(pageParam, 10) : 1);

  /* API state */
  const [apiData, setApiData] = useState<ScholarListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingHash, setDeletingHash] = useState<string | null>(null);

  /* University counts */
  const {
    universities,
    totalCount,
    loading: uniLoading,
    error: uniError,
  } = useUniversityCounts();

  const uniNodes = useMemo<UniNode[]>(
    () =>
      universities.map((uni) => ({
        name: uni.name,
        departments: Object.entries(uni.departments).map(([name, count]) => ({
          name,
          count,
        })),
        count: uni.count,
      })),
    [universities],
  );

  /* Fetch paginated data */
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchScholarList(page, PAGE_SIZE, {
      university: activeUni ?? undefined,
      department: activeDept ?? undefined,
      search: query.trim() || undefined,
    })
      .then((res) => {
        setApiData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "加载失败");
        setIsLoading(false);
      });
  }, [page, activeUni, activeDept, query]);

  /* Sync page to URL */
  useEffect(() => {
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
  ].filter((c) => c.label);

  const hasAnyFilter = filterChips.length > 0 || !!query;

  return {
    // Sidebar data
    uniNodes,
    totalCount,
    uniLoading,
    uniError,
    activeUni,
    activeDept,
    handleSelectUni,
    handleSelectDept,

    // Search & filter
    query,
    setQuery,
    filterChips,
    hasAnyFilter,
    clearAll,

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
  };
}
