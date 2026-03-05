/**
 * 获取高校/院系学者数量的自定义 Hook
 * 使用 /api/v1/institutions/scholars/ 获取完整机构列表（含无数据院校）
 * 用于构建侧边栏树的动态计数
 */
import { useEffect, useState } from "react";
import { fetchAllInstitutions } from "@/services/institutionApi";

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
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const institutions = await fetchAllInstitutions();

        const unis: UniversityData[] = [];
        const countsMap: Record<string, number> = {};
        let total = 0;

        for (const inst of institutions) {
          const departments: Record<string, number> = {};
          for (const dept of inst.departments) {
            departments[dept.name] = dept.scholar_count;
            countsMap[`${inst.name}::${dept.name}`] = dept.scholar_count;
          }

          unis.push({
            name: inst.name,
            count: inst.scholar_count,
            departments,
          });

          countsMap[inst.name] = inst.scholar_count;
          total += inst.scholar_count;
        }

        setUniversities(unis);
        setCounts(countsMap);
        setTotalCount(total);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load university data";
        console.error("Failed to fetch institutions:", err);
        setError(errorMsg);
        setTotalCount(0);
        setUniversities([]);
        setCounts({});
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { universities, counts, totalCount, loading, error };
}
