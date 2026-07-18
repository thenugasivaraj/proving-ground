import assert from "node:assert/strict";
import test from "node:test";
import { JUDGE_MODEL_SETTINGS } from "../lib/judge-settings.ts";

test("judge uses reproducible sampling settings", () => {
  assert.equal(JUDGE_MODEL_SETTINGS.temperature, 0);
  assert.equal(JUDGE_MODEL_SETTINGS.topP, 1);
  assert.equal(JUDGE_MODEL_SETTINGS.parallelToolCalls, false);
  assert.equal(JUDGE_MODEL_SETTINGS.reasoning.effort, "none");
  assert.equal(JUDGE_MODEL_SETTINGS.providerData.seed, 424_242);
});
