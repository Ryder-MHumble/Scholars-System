import { fetchWithTimeout } from "@/services/requestUtils";
import { BASE_URL, SCHOLAR_WRITE_TIMEOUT_MS } from "./constants";
import { invalidateScholarListCache } from "./helpers";
import type {
  StudentCreate,
  StudentListResponse,
  StudentPatch,
  StudentRecord,
} from "./types";

// ====== Student CRUD ======

export async function fetchStudents(
  urlHash: string,
): Promise<StudentListResponse> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/${urlHash}/students`,
    {},
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`Failed to fetch students: ${res.status}`);
  return res.json();
}

export async function createStudent(
  urlHash: string,
  data: StudentCreate,
): Promise<StudentRecord> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/${urlHash}/students`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`Failed to create student: ${res.status}`);
  invalidateScholarListCache();
  return res.json();
}

export async function patchStudent(
  urlHash: string,
  studentId: string,
  data: StudentPatch,
): Promise<StudentRecord> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/${urlHash}/students/${studentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`Failed to update student: ${res.status}`);
  invalidateScholarListCache();
  return res.json();
}

export async function deleteStudent(
  urlHash: string,
  studentId: string,
): Promise<void> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/scholars/${urlHash}/students/${studentId}`,
    {
      method: "DELETE",
    },
    SCHOLAR_WRITE_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`Failed to delete student: ${res.status}`);
  invalidateScholarListCache();
}
