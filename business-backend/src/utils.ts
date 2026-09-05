import { createHash } from "node:crypto";

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value);
}

export function asBoolean(value: unknown): boolean {
  return value === true || asString(value).length > 0;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const secretKey = /(password|token|secret|authorization|api[_-]?key)/i;
const emailKey = /(^|_)(email|mail)($|_)/i;
const phoneKey = /(^|_)(phone|mobile|telephone)($|_)/i;
const emailValue = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phoneValue = /(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)/g;
const bearerValue = /\bBearer\s+[A-Z0-9._~+/=-]+/gi;
const apiKeyValue = /\bsk-[A-Z0-9_-]{8,}/gi;

function redactText(value: string): string {
  return value
    .replace(emailValue, "[redacted-email]")
    .replace(phoneValue, "[redacted-phone]")
    .replace(bearerValue, "[redacted-credential]")
    .replace(apiKeyValue, "[redacted-credential]");
}

export function sanitizeForAnalysis(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeForAnalysis);
  if (typeof value === "string") return redactText(value);
  if (value === null || typeof value !== "object") return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (secretKey.test(key)) continue;
    if (emailKey.test(key)) {
      sanitized.has_email = asBoolean(item);
      continue;
    }
    if (phoneKey.test(key)) {
      sanitized.has_phone = asBoolean(item);
      continue;
    }
    sanitized[key] = sanitizeForAnalysis(item);
  }
  return sanitized;
}
