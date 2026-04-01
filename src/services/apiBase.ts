const FALLBACK_API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:8002"
  : "http://10.1.132.21:8001";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? FALLBACK_API_BASE_URL
).replace(/\/$/, "");

export const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;

function deriveAcademicMonitorBaseUrl(): string {
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.hostname}:8000`;
  } catch {
    return import.meta.env.DEV
      ? "http://localhost:8000"
      : "http://10.1.132.21:8000";
  }
}

export const ACADEMIC_MONITOR_BASE_URL = (
  import.meta.env.VITE_ACADEMIC_MONITOR_BASE_URL ??
  import.meta.env.VITE_ACADEMIC_MONITOR_API_BASE_URL ??
  deriveAcademicMonitorBaseUrl()
).replace(/\/$/, "");
