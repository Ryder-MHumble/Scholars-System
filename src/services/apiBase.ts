const FALLBACK_API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:8002"
  : "http://10.1.132.21:8001";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? FALLBACK_API_BASE_URL
).replace(/\/$/, "");

export const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;
