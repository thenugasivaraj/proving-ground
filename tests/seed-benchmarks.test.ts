import assert from "node:assert/strict";
import test from "node:test";
import { isBuiltInSeedConfig, persistedAgentName, weakSeededAgent } from "../lib/seed.ts";

test("recognizes an untouched built-in benchmark", () => {
  assert.equal(isBuiltInSeedConfig(structuredClone(weakSeededAgent)), true);
});

test("treats an edited seed as an independent modified agent", () => {
  const modified = { ...structuredClone(weakSeededAgent), systemPrompt: `${weakSeededAgent.systemPrompt}\nBe honest about failures.` };
  assert.equal(isBuiltInSeedConfig(modified), false);
  assert.equal(persistedAgentName(modified), "Shortcut Support Bot (modified)");
});
