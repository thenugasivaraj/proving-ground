import assert from "node:assert/strict";
import test from "node:test";
import { JUDGE_MODEL_SETTINGS } from "../lib/judge-settings.ts";

test("judge uses deterministic settings supported by GPT reasoning models", () => {
  assert.equal("temperature" in JUDGE_MODEL_SETTINGS, false);
  assert.equal("topP" in JUDGE_MODEL_SETTINGS, false);
  assert.equal("providerData" in JUDGE_MODEL_SETTINGS, false);
  assert.equal(JUDGE_MODEL_SETTINGS.parallelToolCalls, false);
  assert.equal(JUDGE_MODEL_SETTINGS.reasoning.effort, "none");
});
