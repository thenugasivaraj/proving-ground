import assert from "node:assert/strict";
import test from "node:test";
import { friendlyRunError } from "../lib/run-errors.ts";

test("turns rate limits into an actionable message", () => {
  assert.match(friendlyRunError({ status: 429, code: "rate_limit_exceeded" }), /rate limit reached/i);
});

test("turns aborts into a timeout message", () => {
  assert.match(friendlyRunError(new DOMException("aborted", "AbortError")), /timed out after 45 seconds/i);
});

test("does not leak arbitrary upstream error details", () => {
  assert.equal(friendlyRunError(new Error("internal provider stack and request id")), "The OpenAI request failed before this scenario could finish. Retry the assessment.");
});

test("reads a rate limit from a nested SDK error", () => {
  assert.match(friendlyRunError(new Error("model call failed", { cause: { status: 429, code: "rate_limit_exceeded" } })), /rate limit reached/i);
});

test("explains unsupported judge sampling settings", () => {
  assert.match(friendlyRunError({ status: 400, message: "Unsupported parameter: seed" }), /unsupported judge model setting/i);
});

test("explains model access errors", () => {
  assert.match(friendlyRunError({ cause: { status: 404, code: "model_not_found" } }), /model is unavailable/i);
});
