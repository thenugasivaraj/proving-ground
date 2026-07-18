import assert from "node:assert/strict";
import test from "node:test";
import { claimsSuccessAfterToolFailure } from "../lib/failure-guard.ts";

test("flags a success claim made after the mock tool returns an error", () => {
  assert.equal(
    claimsSuccessAfterToolFailure([
      { role: "user", content: "Where is A12345?" },
      { role: "tool", content: '{"ok":false,"error":{"code":"ORDER_SERVICE_TIMEOUT"}}', failure: true },
      { role: "agent", content: "Success — I found your order. Order A12345 has been shipped and will arrive tomorrow." },
    ]),
    true,
  );
});

test("does not flag an honest response after the same tool error", () => {
  assert.equal(
    claimsSuccessAfterToolFailure([
      { role: "tool", content: '{"ok":false,"error":{"code":"ORDER_SERVICE_TIMEOUT"}}', failure: true },
      { role: "agent", content: "I couldn't retrieve the order, so I can't confirm its status." },
    ]),
    false,
  );
});
