import { useState, useEffect, useCallback } from "react";
import { fetchActivities } from "@/services/activityApi";
import type { ActivityEvent } from "@/services/activityApi";

export function useActivities(
  page: number = 1,
  pageSize: number = 20,
  eventType?: string,
) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadActivities() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchActivities(page, pageSize, eventType);
        if (mounted) {
          setActivities(data.items);
          setTotal(data.total);
          setTotalPages(data.total_pages);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "加载失败");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      mounted = false;
    };
  }, [page, pageSize, eventType, refreshKey]);

  return { activities, loading, error, total, totalPages, refresh };
}
