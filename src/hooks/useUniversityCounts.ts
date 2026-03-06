/**
 * 获取高校/院系学者数量的自定义 Hook
 * 使用 /api/v1/institutions/scholars 获取完整的机构列表及学者数量
 * 用于构建院校选择器和侧边栏树的动态计数
 */
import { useEffect, useState } from "react";
import { fetchAllInstitutions } from "@/services/institutionApi";
import type { InstitutionDepartmentListItem } from "@/types/institution";

export interface UniversityData {
  id: string;
  name: string;
  count: number;
  scholarCount: number;
  departments: InstitutionDepartmentListItem[];
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
          const uniData: UniversityData = {
            id: inst.id,
            name: inst.name,
            count: inst.departments.length,
            scholarCount: inst.scholar_count,
            departments: inst.departments,
          };
          unis.push(uniData);
          countsMap[inst.name] = inst.scholar_count;
          total += inst.scholar_count;

          // Add department counts
          for (const dept of inst.departments) {
            countsMap[`${inst.name}::${dept.name}`] = dept.scholar_count;
          }
        }

        // Sort by scholar count descending
        unis.sort((a, b) => b.scholarCount - a.scholarCount);

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
