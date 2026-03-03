/**
 * 获取高校/院系学者数量的自定义 Hook
 * 使用 /api/v1/faculty/stats 真实API获取数据
 * 用于构建侧边栏树的动态计数
 */
import { useEffect, useState } from "react";
import { fetchFacultyStats } from "@/services/facultyApi";

export interface UniversityData {
  name: string;
  count: number;
  departments: Record<string, number>;
}

export function useUniversityCounts() {
  const [universities, setUniversities] = useState<UniversityData[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await fetchFacultyStats();

        // Build departments map: university -> { dept -> count }
        const deptMap: Record<string, Record<string, number>> = {};
        for (const item of stats.by_department) {
          if (!deptMap[item.university]) deptMap[item.university] = {};
          deptMap[item.university][item.department] = item.count;
        }

        // Build universities array and counts map
        const unis: UniversityData[] = [];
        const countsMap: Record<string, number> = {};
        let total = 0;

        for (const item of stats.by_university) {
          const departments = deptMap[item.university] ?? {};
          unis.push({
            name: item.university,
            count: item.count,
            departments,
          });

          countsMap[item.university] = item.count;
          total += item.count;

          for (const [deptName, deptCount] of Object.entries(departments)) {
            countsMap[`${item.university}::${deptName}`] = deptCount;
          }
        }

        setUniversities(unis);
        setCounts(countsMap);
        setTotalCount(total);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load university data";
        console.error("Failed to fetch faculty stats:", err);
        setError(errorMsg);
        // Fallback: set empty data, user can still see tree
        setTotalCount(0);
        setUniversities([]);
        setCounts({});
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
  }, []);

  return { universities, counts, totalCount, loading, error };
}
