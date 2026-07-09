// Barrel file — re-exports everything from sub-modules.
// All existing imports from "@/services/scholarApi" continue to work unchanged.

// ====== Constants ======
export { BASE_URL, SCHOLAR_REQUEST_TIMEOUT_MS, SCHOLAR_WRITE_TIMEOUT_MS } from "./constants";

// ====== Types ======
export type * from "./types";

// ====== Helpers (public API) ======
export {
  invalidateScholarUniversityCache,
  invalidateScholarListCache,
  normalizeProfileLinks,
  resolveProfileLinks,
  buildLegacyProfileLinkFields,
  hasProfileLinks,
  normalizeScholarProjectFields,
} from "./helpers";

// ====== Scholar read operations ======
export {
  fetchScholarUniversities,
  fetchScholarList,
  fetchAllScholars,
  fetchScholarDetail,
  fetchScholarStats,
  fetchUniversities,
} from "./scholarRead";

// ====== Scholar write operations ======
export {
  patchScholarRelation,
  patchScholarDetail,
  postScholarUpdate,
  deleteScholarUpdate,
  patchScholarAchievements,
  deleteScholar,
  createScholar,
  batchCreateScholars,
} from "./scholarWrite";

// ====== Student operations ======
export {
  fetchStudents,
  createStudent,
  patchStudent,
  deleteStudent,
} from "./studentApi";
