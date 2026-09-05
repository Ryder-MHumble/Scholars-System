import type { AppConfig } from "./config.js";
import { modelPortraitOutputSchema, type ModelPortraitOutput, type NormalizedPortraitInput } from "./domain.js";
import { AppError } from "./errors.js";
import type { PromptBundle } from "./prompts.js";
import { validatePortraitOutput, type ValidatedDimension } from "./rubrics.js";
import { asArray, asRecord, asString, sanitizeForAnalysis } from "./utils.js";

export interface ValidatedModelResult {
  output: ModelPortraitOutput;
  dimensions: ValidatedDimension[];
}

export interface PortraitModel {
  analyze(bundle: PromptBundle, input: NormalizedPortraitInput): Promise<ValidatedModelResult>;
}

function responseContent(body: unknown): string {
  const choice = asRecord(asArray(asRecord(body).choices)[0]);
  const message = asRecord(choice.message);
  const content = message.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  return "";
}

function parseAndValidate(content: string, input: NormalizedPortraitInput): ValidatedModelResult {
  let raw: unknown;
  try {
    raw = sanitizeForAnalysis(JSON.parse(content));
  } catch {
    throw new AppError("MODEL_OUTPUT_INVALID", "Model output was not strict JSON", false, 502);
  }
  try {
    return validatePortraitOutput(raw, input, (value) => modelPortraitOutputSchema.parse(value));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown validation failure";
    throw new AppError("MODEL_OUTPUT_INVALID", message, false, 502);
  }
}

export class ChatCompletionsModel implements PortraitModel {
  constructor(private readonly config: AppConfig) {}

  private async request(messages: Array<{ role: "system" | "user"; content: string }>): Promise<string> {
    if (!this.config.llmModel || !this.config.llmApiKey) {
      throw new AppError("MODEL_NOT_CONFIGURED", "LLM_MODEL and LLM_API_KEY are required", false, 503);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    try {
      const response = await fetch(`${this.config.llmBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.config.llmApiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.llmModel,
          temperature: 0,
          response_format: { type: "json_object" },
          messages,
        }),
        signal: controller.signal,
      });
      const text = await response.text();
      let body: unknown;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = null;
      }
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        const upstreamMessage = asString(asRecord(asRecord(body).error).message);
        throw new AppError(
          "MODEL_REQUEST_FAILED",
          upstreamMessage || `Model endpoint returned ${response.status}`,
          retryable,
          502,
        );
      }
      return responseContent(body);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("MODEL_TIMEOUT", "Model request exceeded 90 seconds", true, 504);
      }
      throw new AppError(
        "MODEL_REQUEST_FAILED",
        error instanceof Error ? error.message : "Model request failed",
        true,
        502,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async analyze(bundle: PromptBundle, input: NormalizedPortraitInput): Promise<ValidatedModelResult> {
    const messages: Array<{ role: "system" | "user"; content: string }> = [
      { role: "system", content: bundle.system },
      { role: "user", content: bundle.user },
    ];
    const first = await this.request(messages);
    try {
      return parseAndValidate(first, input);
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== "MODEL_OUTPUT_INVALID") throw error;
      const correction = [
        "Your previous response failed validation.",
        `Validation error: ${error.message}`,
        "Return a corrected strict JSON object only. Do not add Markdown or commentary.",
        "Previous response:",
        first,
      ].join("\n");
      const second = await this.request([...messages, { role: "user", content: correction }]);
      return parseAndValidate(second, input);
    }
  }
}
