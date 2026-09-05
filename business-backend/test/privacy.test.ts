import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeForAnalysis, stableJson } from "../src/utils.js";

test("redacts contact values and removes secrets recursively", () => {
  const sanitized = sanitizeForAnalysis({
    email: "person@example.com",
    phone: "+8613812345678",
    bio: "Contact person@example.com or 13812345678; Bearer top.secret-token; sk-secret123456",
    nested: { authorization: "Bearer secret", api_key: "secret", note: "safe" },
  });
  const serialized = stableJson(sanitized);
  assert.doesNotMatch(serialized, /person@example\.com|13812345678|Bearer|sk-secret|api_key/);
  assert.match(serialized, /"has_email":true/);
  assert.match(serialized, /"has_phone":true/);
  assert.match(serialized, /\[redacted-email\]/);
  assert.match(serialized, /\[redacted-phone\]/);
});
