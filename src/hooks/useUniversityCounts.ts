/**
 * 获取高校/院系学者数量的自定义 Hook
 * 使用 /api/v1/institutions?view=hierarchy 从机构数据聚合，支持 region/org_type 过滤
 */
import { useEffect, useState } from "react";
import { fetchScholarUniversities } from "@/services/scholarApi";
import type { InstitutionDepartmentListItem } from "@/types/institution";

export interface UniversityData {
  id: string;
  name: string;
  count: number;
  scholarCount: number;
  departments: InstitutionDepartmentListItem[];
}

export function useUniversityCounts(filters?: {
  region?: string;
  affiliation_type?: string;
  is_adjunct_supervisor?: boolean;
}) {
  const [universities, setUniversities] = useState<UniversityData[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const region = filters?.region;
  const affiliationType = filters?.affiliation_type;
  const isAdjunctSupervisor = filters?.is_adjunct_supervisor;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const items = await fetchScholarUniversities({
          region,
          affiliation_type: affiliationType,
          is_adjunct_supervisor: isAdjunctSupervisor,
        });

        const unis: UniversityData[] = [];
        const countsMap: Record<string, number> = {};
        let total = 0;

        for (const item of items) {
          const uniData: UniversityData = {
            id: item.university,
            name: item.university,
            count: item.departments.length,
            scholarCount: item.scholar_count,
            departments: item.departments.map((d) => ({
              id: d.name,
              name: d.name,
              scholar_count: d.scholar_count,
              org_name: "", // Not provided by /api/v1/institutions endpoint
            })),
          };
          unis.push(uniData);
          countsMap[item.university] = item.scholar_count;
          total += item.scholar_count;

          for (const dept of item.departments) {
            countsMap[`${item.university}::${dept.name}`] = dept.scholar_count;
          }
        }

        setUniversities(unis);
        setCounts(countsMap);
        setTotalCount(total);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load university data";
        console.error("Failed to fetch scholar universities:", err);
        setError(errorMsg);
        setTotalCount(0);
        setUniversities([]);
        setCounts({});
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [region, affiliationType, isAdjunctSupervisor]);

  return { universities, counts, totalCount, loading, error };
}
