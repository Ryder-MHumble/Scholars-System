import { cachedFetch, fetchWithTimeout } from "@/services/requestUtils";
import {
  BASE_URL,
  SCHOLAR_REQUEST_TIMEOUT_MS,
  SCHOLAR_DETAIL_CACHE_TTL_MS,
  SCHOLAR_LIST_CACHE_TTL_MS,
  SCHOLAR_LIST_FETCH_CONCURRENCY,
  SCHOLAR_LIST_MAX_PAGES,
} from "./constants";
import {
  buildScholarListParams,
  createScholarListError,
  scholarUniversityCache,
  scholarUniversityInFlight,
  buildUniversityCacheKey,
  normalizeScholarProjectFields,
  UNIVERSITY_CACHE_TTL_MS,
} from "./helpers";
import type {
  BackendInstitutionHierarchyResponse,
  ScholarDetail,
  ScholarListItem,
  ScholarListResponse,
  ScholarListFilters,
  ScholarStatsResponse,
  ScholarUniversityItem,
  UniversityOption,
} from "./types";

// ====== University hierarchy ======

export async function fetchScholarUniversities(filters?: {
  region?: string;
  affiliation_type?: string;
  is_adjunct_supervisor?: boolean;
}): Promise<ScholarUniversityItem[]> {
  const cacheKey = buildUniversityCacheKey(filters);
  const now = Date.now();
  const cached = scholarUniversityCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  const inFlight = scholarUniversityInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const params = new URLSearchParams();
  params.set("view", "hierarchy");
  params.set("entity_type", "organization");
  if (filters?.region) params.set("region", filters.region);
  if (filters?.affiliation_type)
    params.set("org_type", filters.affiliation_type);
  if (filters?.is_adjunct_supervisor)
    params.set("is_adjunct_supervisor", "true");
  const query = params.toString();
  const reqPromise = (async () => {
    const res = await fetch(
      `${BASE_URL}/api/institutions${query ? `?${query}` : ""}`,
    );
    if (!res.ok)
      throw new Error(`Failed to fetch scholar universities: ${res.status}`);
    const data: BackendInstitutionHierarchyResponse = await res.json();

    // Transform the new API response to match the old format
    // Backend returns: { organizations: [...] }
    const organizations = data.organizations ?? data.items ?? [];
    const transformed = organizations.map((inst) => ({
      institution_id: String(inst.id ?? "").trim() || undefined,
      university: String(inst.name ?? "").trim(),
      scholar_count: inst.scholar_count || 0,
      departments: (inst.departments ?? []).map((dept) => ({
        id: String(dept.id ?? "").trim() || undefined,
        name: String(dept.name ?? "").trim(),
        scholar_count: dept.scholar_count || 0,
      })),
    }));

    scholarUniversityCache.set(cacheKey, {
      expiresAt: Date.now() + UNIVERSITY_CACHE_TTL_MS,
      data: transformed,
    });
    return transformed;
  })();

  scholarUniversityInFlight.set(cacheKey, reqPromise);
  try {
    return await reqPromise;
  } finally {
    scholarUniversityInFlight.delete(cacheKey);
  }
}

// ====== Scholar list ======

export async function fetchScholarList(
  page: number = 1,
  pageSize: number = 20,
  filters?: ScholarListFilters,
  signal?: AbortSignal,
): Promise<ScholarListResponse> {
  const params = buildScholarListParams(page, pageSize, filters);
  const url = `${BASE_URL}/api/scholars?${params}`;

  try {
    const data = await cachedFetch<ScholarListResponse>(url, {
      signal,
      ttl: SCHOLAR_LIST_CACHE_TTL_MS,
      timeoutMs: SCHOLAR_REQUEST_TIMEOUT_MS,
    });
    return {
      ...data,
      items: data.items.map((item) => normalizeScholarProjectFields(item)),
    };
  } catch (error) {
    throw createScholarListError(error, "Failed to fetch scholar list");
  }
}

export async function fetchAllScholars(
  filters?: ScholarListFilters,
  signal?: AbortSignal,
): Promise<ScholarListItem[]> {
  // First, get the first page to know the total count
  const firstPageParams = buildScholarListParams(1, 50, filters);

  const firstRes = await fetchWithTimeout(
    `${BASE_URL}/api/scholars?${firstPageParams}`,
    { signal },
    SCHOLAR_REQUEST_TIMEOUT_MS,
  );
  const firstDataRaw: ScholarListResponse = await firstRes.json();
  const firstData: ScholarListResponse = {
    ...firstDataRaw,
    items: firstDataRaw.items.map((item) =>
      normalizeScholarProjectFields(item),
    ),
  };

  // If all data fits in first page, return it
  if (firstData.total <= 50) {
    return firstData.items;
  }

  // Otherwise, fetch all pages
  const allScholars: ScholarListItem[] = [...firstData.items];
  const totalPages = Math.min(firstData.total_pages, SCHOLAR_LIST_MAX_PAGES);
  const remainingPageResults: ScholarListItem[][] = [];

  let nextPage = 2;
  async function fetchNextPage(): Promise<void> {
    while (nextPage <= totalPages) {
      const page = nextPage;
      nextPage += 1;
      const params = buildScholarListParams(page, 50, filters);

      const res = await fetchWithTimeout(
        `${BASE_URL}/api/scholars?${params}`,
        { signal },
        SCHOLAR_REQUEST_TIMEOUT_MS,
      );
      const pageData = (await res.json()) as ScholarListResponse;
      remainingPageResults[page - 2] = pageData.items.map((item) =>
        normalizeScholarProjectFields(item),
      );
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const workerCount = Math.min(
    SCHOLAR_LIST_FETCH_CONCURRENCY,
    Math.max(0, totalPages - 1),
  );
  await Promise.all(Array.from({ length: workerCount }, () => fetchNextPage()));
  remainingPageResults.forEach((items) => {
    allScholars.push(...items);
  });

  return allScholars;
}

// ====== Scholar detail ======

export async function fetchScholarDetail(
  urlHash: string,
  signal?: AbortSignal,
): Promise<ScholarDetail> {
  const url = `${BASE_URL}/api/scholars/${urlHash}`;
  const data = await cachedFetch<ScholarDetail>(url, {
    signal,
    ttl: SCHOLAR_DETAIL_CACHE_TTL_MS,
    timeoutMs: SCHOLAR_REQUEST_TIMEOUT_MS,
  });
  return normalizeScholarProjectFields(data);
}

// ====== Stats ======

export async function fetchScholarStats(): Promise<ScholarStatsResponse> {
  return cachedFetch<ScholarStatsResponse>(`${BASE_URL}/api/scholars/stats`, {
    ttl: SCHOLAR_LIST_CACHE_TTL_MS,
    timeoutMs: SCHOLAR_REQUEST_TIMEOUT_MS,
  });
}

// ====== Universities list ======

export async function fetchUniversities(): Promise<UniversityOption[]> {
  // Use stats endpoint to get universities and departments
  const stats = await fetchScholarStats();
  const universityMap = new Map<string, Set<string>>();

  // Build university -> departments mapping
  stats.by_department.forEach((item) => {
    if (!universityMap.has(item.university)) {
      universityMap.set(item.university, new Set());
    }
    universityMap.get(item.university)!.add(item.department);
  });

  // Convert to UniversityOption array
  return Array.from(universityMap.entries())
    .map(([university, departments]) => ({
      university,
      departments: Array.from(departments).sort(),
    }))
    .sort((a, b) => a.university.localeCompare(b.university));
}
