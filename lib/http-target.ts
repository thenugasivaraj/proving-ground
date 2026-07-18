export const FORBIDDEN_HEADER_NAMES = new Set(["host", "content-length", "connection", "transfer-encoding", "cookie", "set-cookie"]);

export function validateEndpointUrl(value: string) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only HTTP and HTTPS endpoint URLs are allowed.");
  if (url.username || url.password) throw new Error("Put credentials in the optional auth header, not in the URL.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host === "0.0.0.0" || host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:") || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host === "169.254.169.254") throw new Error("Local and private-network endpoint URLs are not allowed.");
  return url;
}

export function fetchPublicEndpoint(url: URL, init: RequestInit, fetcher: typeof fetch = fetch) {
  // Cloudflare Workers accepts a URL string or Request here, not a URL object.
  // Canonicalizing after validation also ensures the exact validated destination is used.
  return fetcher(url.toString(), init);
}

export function fillRequestTemplate(template: string, scenarioInput: string) {
  const escapedInput = JSON.stringify(scenarioInput).slice(1, -1);
  return JSON.parse(template.replaceAll("{{scenario_input}}", escapedInput)) as unknown;
}

export function readJsonPath(value: unknown, path: string): unknown {
  const normalized = path.trim().replace(/^\$\.?/, "").replace(/\[(\d+)\]/g, ".$1");
  const segments = normalized.split(".").filter(Boolean);
  let current = value;
  for (const segment of segments) {
    if (current === null || typeof current !== "object" || !(segment in current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function endpointError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") return "The endpoint timed out after 30 seconds.";
  if (error instanceof Error && /Only HTTP|credentials|Local and private|auth header|request template|response JSON path|valid JSON/i.test(error.message)) return error.message;
  return "The endpoint request failed. Check the URL and network availability, then retry.";
}
