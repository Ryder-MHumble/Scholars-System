/**
 * 获取高校/院系学者数量的自定义 Hook
 * 使用 /api/institutions?view=hierarchy 从机构数据聚合，支持 region/org_type 过滤
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchScholarUniversities,
  fetchScholarUniversityDepartments,
} from "@/services/scholarApi";
import type { InstitutionDepartmentListItem } from "@/types/institution";

export interface UniversityData {
  id: string;
  institutionId?: string;
  name: string;
  region?: string | null;
  orgType?: string | null;
  count: number;
  scholarCount: number;
  departmentCount: number;
  departmentsLoaded: boolean;
  departments: InstitutionDepartmentListItem[];
}

export function useUniversityCounts(filters?: {
  region?: string;
  affiliation_type?: string;
  is_adjunct_supervisor?: boolean;
  refreshSeed?: number;
}) {
  const [universities, setUniversities] = useState<UniversityData[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const departmentRequestRef = useRef<Set<string>>(new Set());

  const region = filters?.region;
  const affiliationType = filters?.affiliation_type;
  const isAdjunctSupervisor = filters?.is_adjunct_supervisor;
  const refreshSeed = filters?.refreshSeed;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const items = await fetchScholarUniversities({
          region,
          affiliation_type: affiliationType,
          is_adjunct_supervisor: isAdjunctSupervisor,
          include_departments: false,
        });
        if (cancelled) return;

        const unis: UniversityData[] = [];
        const countsMap: Record<string, number> = {};
        let total = 0;

        for (const item of items) {
          const uniData: UniversityData = {
            id: item.university,
            institutionId: item.institution_id,
            name: item.university,
            region: item.region,
            orgType: item.org_type,
            count: item.scholar_count,
            scholarCount: item.scholar_count,
            departmentCount: item.department_count ?? item.departments.length,
            departmentsLoaded: item.departments.length > 0,
            departments: [],
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
        if (cancelled) return;
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load university data";
        console.error("Failed to fetch scholar universities:", err);
        setError(errorMsg);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [region, affiliationType, isAdjunctSupervisor, refreshSeed]);

  const loadDepartments = useCallback(async (institutionId?: string, universityName?: string) => {
    if (!institutionId) return;
    const requestKey = `${institutionId}::${universityName ?? ""}`;
    if (departmentRequestRef.current.has(requestKey)) return;

    const target = universities.find(
      (uni) => uni.institutionId === institutionId || uni.name === universityName,
    );
    if (!target || target.departmentsLoaded) return;

    departmentRequestRef.current.add(requestKey);
    try {
      const departments = await fetchScholarUniversityDepartments(institutionId);
      setUniversities((prev) =>
        prev.map((uni) => {
          if (uni.institutionId !== institutionId && uni.name !== universityName) {
            return uni;
          }
          return {
            ...uni,
            departmentCount: departments.length,
            departmentsLoaded: true,
            departments: departments.map((d) => ({
              id: d.name,
              name: d.name,
              scholar_count: d.scholar_count,
              org_name: "",
            })),
          };
        }),
      );
      setCounts((prev) => {
        const next = { ...prev };
        for (const dept of departments) {
          next[`${universityName ?? target.name}::${dept.name}`] = dept.scholar_count;
        }
        return next;
      });
    } finally {
      departmentRequestRef.current.delete(requestKey);
    }
  }, [universities]);

  return { universities, counts, totalCount, loading, error, loadDepartments };
}
