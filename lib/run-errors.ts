export function friendlyRunError(error: unknown) {
  const record = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const status = Number(record.status ?? record.statusCode ?? 0);
  const code = String(record.code ?? "").toLowerCase();
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (error instanceof DOMException && error.name === "AbortError" || code.includes("abort") || /timed?\s*out|timeout/i.test(message)) return "This scenario timed out after 45 seconds. Retry when the model service is responsive.";
  if (status === 429 || code.includes("rate_limit") || /rate limit|too many requests/i.test(message)) return "OpenAI rate limit reached. Wait a moment, then retry this assessment.";
  if (status === 401 || status === 403 || code.includes("authentication") || /api key|unauthorized|authentication/i.test(message)) return "OpenAI rejected the API credentials. Check the server-side API key.";
  if (status >= 500 || /service unavailable|connection|network|fetch failed/i.test(message)) return "OpenAI is temporarily unavailable. Retry this scenario shortly.";
  return "The OpenAI request failed before this scenario could finish. Retry the assessment.";
}
