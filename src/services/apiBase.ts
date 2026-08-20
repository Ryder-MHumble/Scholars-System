const currentHost =
  typeof window !== "undefined" && window.location.hostname
    ? window.location.hostname
    : "localhost";

const FALLBACK_API_BASE_URL = `http://${currentHost}:8001`;

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? FALLBACK_API_BASE_URL
).replace(/\/$/, "");

export const API_V1_BASE_URL = `${API_BASE_URL}/api`;
