import assert from "node:assert/strict";
import test from "node:test";
import { fetchPublicEndpoint, fillRequestTemplate, readJsonPath, validateEndpointUrl } from "../lib/http-target.ts";

test("safely substitutes scenario input into a JSON request", () => {
  const body = fillRequestTemplate('{"message":"{{scenario_input}}"}', 'Say "hello"\nand continue');
  assert.deepEqual(body, { message: 'Say "hello"\nand continue' });
});

test("reads dotted and array response paths", () => {
  const payload = { choices: [{ message: { content: "Agent reply" } }] };
  assert.equal(readJsonPath(payload, "choices[0].message.content"), "Agent reply");
  assert.equal(readJsonPath(payload, "$.choices[0].missing"), undefined);
});

test("blocks obvious private endpoint targets", () => {
  assert.throws(() => validateEndpointUrl("http://127.0.0.1:3000/agent"), /private-network/);
  assert.throws(() => validateEndpointUrl("http://169.254.169.254/latest/meta-data"), /private-network/);
  assert.equal(validateEndpointUrl("https://api.example.com/agent").hostname, "api.example.com");
});

test("passes a canonical public HTTPS string to the Workers fetch API", async () => {
  let received: RequestInfo | URL | undefined;
  const fakeFetch: typeof fetch = async (input) => {
    received = input;
    return new Response("{}", { status: 200 });
  };

  await fetchPublicEndpoint(validateEndpointUrl("https://api.openai.com/v1/responses"), { method: "POST" }, fakeFetch);
  assert.equal(received, "https://api.openai.com/v1/responses");
  assert.equal(typeof received, "string");
});
