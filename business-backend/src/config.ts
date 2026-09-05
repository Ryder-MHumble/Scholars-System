import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

function readDotEnv(path: string): Record<string, string> {
  try {
    const values: Record<string, string> = {};
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const key = match[1];
      if (!key) continue;
      const raw = match[2] ?? "";
      values[key] = raw.replace(/^(['"])(.*)\1$/, "$2");
    }
    return values;
  } catch {
    return {};
  }
}

function effectiveEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (env !== process.env) return env;
  return {
    ...readDotEnv(resolve(process.cwd(), ".env")),
    ...readDotEnv(resolve(process.cwd(), "..", ".env")),
    ...env,
  };
}

function internalBaseUrl(value: string | undefined): string | undefined {
  return value?.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, "");
}

const positiveInteger = (fallback: number) =>
  z.preprocess(
    (value) => (value === undefined || value === "" ? fallback : Number(value)),
    z.number().int().positive(),
  );

const configSchema = z.object({
  BUSINESS_HOST: z.string().default("127.0.0.1"),
  BUSINESS_PORT: positiveInteger(8002),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://scholars:scholars_local_dev@127.0.0.1:5433/scholars_business"),
  DEANAGENT_BASE_URL: z.string().url().default("http://127.0.0.1:8001"),
  DEANAGENT_TOKEN: z.string().optional(),
  LLM_PROVIDER: z.string().min(1).default("company_internal"),
  LLM_BASE_URL: z.string().url().default("https://llm.inner.bza.edu.cn/hub/v1"),
  LLM_MODEL: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  WORKER_POLL_MS: positiveInteger(1000),
  WORKER_LEASE_SECONDS: positiveInteger(120),
  WORKER_MAX_ATTEMPTS: positiveInteger(3),
});

export type AppConfig = {
  host: string;
  port: number;
  databaseUrl: string;
  deanAgentBaseUrl: string;
  deanAgentToken?: string;
  llmProvider: string;
  llmBaseUrl: string;
  llmModel?: string;
  llmApiKey?: string;
  workerPollMs: number;
  workerLeaseSeconds: number;
  workerMaxAttempts: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const effective = effectiveEnvironment(env);
  const parsed = configSchema.parse({
    ...effective,
    LLM_BASE_URL: effective.LLM_BASE_URL || internalBaseUrl(effective.INTERNAL_LLM_CHAT_COMPLETIONS_URL),
    LLM_MODEL: effective.LLM_MODEL || effective.INTERNAL_LLM_QUESTION_MODEL,
    LLM_API_KEY: effective.LLM_API_KEY || effective.INTERNAL_LLM_API_KEY,
  });
  return {
    host: parsed.BUSINESS_HOST,
    port: parsed.BUSINESS_PORT,
    databaseUrl: parsed.DATABASE_URL,
    deanAgentBaseUrl: parsed.DEANAGENT_BASE_URL.replace(/\/$/, ""),
    deanAgentToken: parsed.DEANAGENT_TOKEN || undefined,
    llmProvider: parsed.LLM_PROVIDER,
    llmBaseUrl: parsed.LLM_BASE_URL.replace(/\/$/, ""),
    llmModel: parsed.LLM_MODEL || undefined,
    llmApiKey: parsed.LLM_API_KEY || undefined,
    workerPollMs: parsed.WORKER_POLL_MS,
    workerLeaseSeconds: parsed.WORKER_LEASE_SECONDS,
    workerMaxAttempts: parsed.WORKER_MAX_ATTEMPTS,
  };
}

export function isModelConfigured(config: AppConfig): boolean {
  return Boolean(config.llmModel && config.llmApiKey);
}
