export function friendlyRunError(error: unknown) {
  const chain: unknown[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && !seen.has(current) && chain.length < 6) {
    seen.add(current);
    chain.push(current);
    const record = typeof current === "object" ? current as Record<string, unknown> : {};
    current = record.cause ?? record.error;
  }

  const records = chain.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  const statuses = records.map((record) => Number(record.status ?? record.statusCode ?? 0)).filter(Boolean);
  const status = statuses.find((value) => value >= 400) ?? 0;
  const code = records.map((record) => String(record.code ?? record.type ?? "")).join(" ").toLowerCase();
  const message = chain.map((item) => {
    if (item instanceof Error) return item.message;
    if (typeof item === "string") return item;
    if (item && typeof item === "object") return String((item as Record<string, unknown>).message ?? "");
    return "";
  }).join(" ");
  const aborted = chain.some((item) => item instanceof DOMException && item.name === "AbortError");

  if (aborted || code.includes("abort") || /timed?\s*out|timeout/i.test(message)) return "This scenario timed out after 45 seconds. Retry when the model service is responsive.";
  if (status === 429 || code.includes("rate_limit") || /rate limit|too many requests/i.test(message)) return "OpenAI rate limit reached. Wait a moment, then retry this assessment.";
  if (status === 401 || status === 403 || code.includes("authentication") || /api key|unauthorized|authentication/i.test(message)) return "OpenAI rejected the API credentials. Check the server-side API key.";
  if (status === 402 || code.includes("insufficient_quota") || /quota|billing limit|credit balance/i.test(message)) return "The OpenAI account has no available API quota. Check billing and usage limits, then retry.";
  if (status === 404 || code.includes("model_not_found") || /model.+not found|does not exist|no access to model/i.test(message)) return "The configured OpenAI model is unavailable to this API key. Check OPENAI_MODEL and model access.";
  if (status === 400 && /temperature|top[_ ]?p|seed|unsupported parameter|model setting/i.test(message)) return "OpenAI rejected an unsupported judge model setting. Use the model's supported deterministic settings and retry.";
  if (status >= 500 || /service unavailable|connection|network|fetch failed/i.test(message)) return "OpenAI is temporarily unavailable. Retry this scenario shortly.";
  if (status === 400 || code.includes("invalid_request")) return "OpenAI rejected the judge request as invalid. Check the configured model and structured-output compatibility.";
  return "The OpenAI request failed before this scenario could finish. Retry the assessment.";
}
