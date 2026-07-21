import assert from "node:assert/strict";
import test from "node:test";
import { hiddenLeaderboardAgentNames, isBuiltInSeedConfig, persistedAgentName, shouldPersistAssessment, weakSeededAgent } from "../lib/seed.ts";

test("recognizes an untouched built-in benchmark", () => {
  assert.equal(isBuiltInSeedConfig(structuredClone(weakSeededAgent)), true);
});

test("keeps edited Shortcut seed runs out of the demo leaderboard", () => {
  const modified = { ...structuredClone(weakSeededAgent), systemPrompt: `${weakSeededAgent.systemPrompt}\nBe honest about failures.` };
  assert.equal(isBuiltInSeedConfig(modified), false);
  assert.equal(persistedAgentName(modified), "Shortcut Support Bot (modified)");
  assert.equal(shouldPersistAssessment(modified), false);
  assert.equal(hiddenLeaderboardAgentNames.includes(persistedAgentName(modified) as typeof hiddenLeaderboardAgentNames[number]), true);
});
