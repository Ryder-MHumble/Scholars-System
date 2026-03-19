import { useState, useEffect, useCallback } from "react";
import { fetchInstitutionList } from "@/services/institutionApi";
import type {
  InstitutionListItem,
  InstitutionListResponse,
} from "@/types/institution";

interface InstitutionFilters {
  entity_type?: string;
  region?: string;
  org_type?: string;
  classification?: string;
  sub_classification?: string;
  keyword?: string;
  view?: "flat" | "hierarchical";
}

export function useInstitutions(
  pageSize = 50,
  filters?: InstitutionFilters,
  initialPage = 1,
  enabled = true,
) {
  const [institutions, setInstitutions] = useState<InstitutionListItem[]>([]);
  const [pagination, setPagination] = useState<
    Omit<InstitutionListResponse, "items">
  >({
    total: 0,
    page: initialPage,
    page_size: pageSize,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (page: number) => {
      if (!enabled) return;
      try {
        setLoading(true);
        setError(null);
        const data = await fetchInstitutionList(page, pageSize, {
          ...filters,
          view: "flat",
        });
        setInstitutions(data.items);
        setPagination({
          total: data.total,
          page: data.page,
          page_size: data.page_size,
          total_pages: data.total_pages,
        });
      } catch (err) {
        console.error("Failed to load institutions:", err);
        setError(err instanceof Error ? err.message : "加载失败");
        setInstitutions([]);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, filters, enabled],
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setInstitutions([]);
      setPagination({
        total: 0,
        page: 1,
        page_size: pageSize,
        total_pages: 1,
      });
      return;
    }
    loadPage(initialPage);
  }, [enabled, initialPage, loadPage, pageSize]);

  return { institutions, pagination, loading, error, loadPage };
}
