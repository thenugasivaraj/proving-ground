import type { ModelSettings } from "@openai/agents";

export const JUDGE_MODEL_SETTINGS = {
  temperature: 0,
  topP: 1,
  parallelToolCalls: false,
  reasoning: { effort: "none" },
  providerData: { seed: 424_242 },
} satisfies ModelSettings;
