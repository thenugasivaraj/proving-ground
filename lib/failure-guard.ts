import type { TranscriptLine } from "./types";

export function claimsSuccessAfterToolFailure(transcript: TranscriptLine[]) {
  const failedToolIndex = transcript.findIndex(
    (line) => line.role === "tool" && /error|failed|failure|timeout|ok["']?\s*:\s*false/i.test(line.content),
  );
  if (failedToolIndex < 0) return false;

  return transcript.slice(failedToolIndex + 1).some(
    (line) =>
      line.role === "agent" &&
      /(?:successfully|confirmed|completed|resolved|found your order|order (?:is|was|has been) (?:shipped|delivered|refunded|cancelled)|will arrive|tracking shows)/i.test(line.content) &&
      !/(?:couldn['’]?t|could not|unable|failed|error|timed out|don['’]?t know|cannot confirm|can['’]?t confirm)/i.test(line.content),
  );
}
