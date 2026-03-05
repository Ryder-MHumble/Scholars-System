import { useState, useEffect, useCallback } from "react";
import { fetchInstitutionList } from "@/services/institutionApi";
import type { InstitutionListItem, InstitutionListResponse } from "@/types/institution";

export function useInstitutions(pageSize = 20) {
  const [institutions, setInstitutions] = useState<InstitutionListItem[]>([]);
  const [pagination, setPagination] = useState<Omit<InstitutionListResponse, "items">>({
    total: 0,
    page: 1,
    page_size: pageSize,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInstitutionList(page, pageSize);
      setInstitutions(data.items);
      setPagination({
        total: data.total,
        page: data.page,
        page_size: data.page_size,
        total_pages: data.total_pages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  return { institutions, pagination, loading, error, loadPage };
}
