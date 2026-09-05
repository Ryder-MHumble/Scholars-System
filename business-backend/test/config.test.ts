import assert from "node:assert/strict";
import test from "node:test";
import { isModelConfigured, loadConfig } from "../src/config.js";

test("maps existing INTERNAL_LLM environment variables to portrait model config", () => {
  const config = loadConfig({
    BUSINESS_PORT: "8002",
    INTERNAL_LLM_CHAT_COMPLETIONS_URL: "https://llm.example.test/hub/v1/chat/completions",
    INTERNAL_LLM_QUESTION_MODEL: "glm",
    INTERNAL_LLM_API_KEY: "secret-value",
  });
  assert.equal(config.llmBaseUrl, "https://llm.example.test/hub/v1");
  assert.equal(config.llmModel, "glm");
  assert.equal(config.llmApiKey, "secret-value");
  assert.equal(isModelConfigured(config), true);
});

test("explicit LLM variables override INTERNAL_LLM fallbacks", () => {
  const config = loadConfig({
    LLM_BASE_URL: "https://override.example.test/v1",
    LLM_MODEL: "override-model",
    LLM_API_KEY: "override-key",
    INTERNAL_LLM_CHAT_COMPLETIONS_URL: "https://internal.example.test/v1/chat/completions",
    INTERNAL_LLM_QUESTION_MODEL: "internal-model",
    INTERNAL_LLM_API_KEY: "internal-key",
  });
  assert.equal(config.llmBaseUrl, "https://override.example.test/v1");
  assert.equal(config.llmModel, "override-model");
  assert.equal(config.llmApiKey, "override-key");
});
