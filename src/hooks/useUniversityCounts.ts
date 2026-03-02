/**
 * 获取高校/院系学者数量的自定义 Hook
 * 从 ScholarListPage:220-255 的 loadCountsFromAPI 函数提取
 * 用于构建侧边栏树的动态计数
 */
import { useEffect, useState } from "react";
import {
  fetchFacultyList,
  type FacultyListItem,
} from "@/services/facultyApi";

export function useUniversityCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        let allItems: FacultyListItem[] = [];
        let page = 1;
        let totalPages = 1;
        let total = 0;

        // Fetch all pages to calculate counts
        while (page <= totalPages) {
          const res = await fetchFacultyList(page, 200);
          allItems = allItems.concat(res.items);
          totalPages = res.total_pages;
          total = res.total;
          page++;
        }

        // Build counts map
        const countsMap: Record<string, number> = {};
        for (const item of allItems) {
          if (item.university) {
            countsMap[item.university] =
              (countsMap[item.university] ?? 0) + 1;
          }
          if (item.university && item.department) {
            const key = `${item.university}::${item.department}`;
            countsMap[key] = (countsMap[key] ?? 0) + 1;
          }
        }

        setCounts(countsMap);
        setTotalCount(total);
      } catch {
        // Fallback: set empty counts, user can still see tree
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
  }, []);

  return { counts, totalCount, loading };
}
