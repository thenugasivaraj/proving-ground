import type { ModelSettings } from "@openai/agents";

export const JUDGE_MODEL_SETTINGS = {
  parallelToolCalls: false,
  reasoning: { effort: "none" },
} satisfies ModelSettings;
