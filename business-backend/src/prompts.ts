import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { NormalizedPortraitInput, PortraitType } from "./domain.js";

const promptFiles: Record<PortraitType, string> = {
  potential_student: "potential-student.v1.2.md",
  external_expert: "external-expert.v1.2.md",
};

export interface PromptBundle {
  system: string;
  user: string;
  hash: string;
}

export interface PromptDefinition {
  system: string;
  portrait: string;
  hash: string;
}

async function readPrompt(name: string): Promise<string> {
  return readFile(new URL(`../prompts/${name}`, import.meta.url), "utf8");
}

export async function loadPromptDefinition(portraitType: PortraitType): Promise<PromptDefinition> {
  const [contract, portraitPrompt] = await Promise.all([
    readPrompt("evidence-contract.v1.2.md"),
    readPrompt(promptFiles[portraitType]),
  ]);
  const system = contract.trim();
  const portrait = portraitPrompt.trim();
  const hash = createHash("sha256").update(`${system}\n${portrait}\n${outputContract}`).digest("hex");
  return { system, portrait, hash };
}

export async function loadPromptBundle(input: NormalizedPortraitInput): Promise<PromptBundle> {
  const definition = await loadPromptDefinition(input.portrait_type);
  const user = `${definition.portrait}\n\n## 输出结构\n${outputContract}\n\n## 输入 JSON\n${JSON.stringify(input)}`;
  return { system: definition.system, user, hash: definition.hash };
}

const outputContract = JSON.stringify(
  {
    analysis_status: "completed | insufficient | needs_review",
    core_conclusion: "string",
    dimensions: [
      {
        section_code: "string",
        dimension_code: "string",
        evidence_state: "positive | insufficient | negative",
        review_state: "clear | conflict",
        evaluation_method: "model_data | human_judgment | hybrid",
        score: "number 0-100 | null",
        confidence: "number 0-1 | null",
        conclusion: "string",
        evidence_ids: ["existing evidence_id"],
        missing_inputs: ["string"],
        conflict_reason: "string | null",
      },
    ],
    highlight_signals: ["string"],
    recommendation_reasons: ["string"],
    recommended_actions: ["string"],
    missing_data: ["string"],
    cooperation_message: "string | null",
  },
  null,
  2,
);
