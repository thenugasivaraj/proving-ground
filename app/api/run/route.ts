import { getDb } from "../../../db";
import { assessments } from "../../../db/schema";
import { runAssessment } from "../../../lib/evaluator";
import { z } from "zod";

export const runtime = "nodejs";

const configSchema = z.object({
  name: z.string().trim().min(1, "Enter an agent name.").max(80, "Agent name must be 80 characters or fewer."),
  systemPrompt: z.string().trim().min(1, "Enter a system prompt.").max(20_000, "System prompt is too long."),
  tools: z.array(z.object({
    name: z.string().trim().min(1, "Every tool needs a name.").max(64).regex(/^[a-zA-Z0-9_-]+$/, "Tool names may contain only letters, numbers, underscores, and hyphens."),
    description: z.string().trim().min(1, "Every tool needs a description.").max(500),
    behavior: z.enum(["order_lookup", "ticket_creator"]),
  })).min(1, "Choose at least one mock tool.").max(2, "Choose no more than two mock tools."),
}).strict().superRefine((config, context) => {
  const names = config.tools.map((mockTool) => mockTool.name.toLowerCase());
  if (new Set(names).size !== names.length) context.addIssue({ code: "custom", path: ["tools"], message: "Mock tool names must be unique." });
});

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try { payload = await request.json(); }
    catch { return Response.json({ error: "The target agent configuration is not valid JSON." }, { status: 400 }); }
    const parsed = configSchema.safeParse(payload);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "The target agent configuration is malformed." }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return Response.json({ error: "OpenAI is not configured for this deployment. Add OPENAI_API_KEY and try again." }, { status: 503 });
    const config = parsed.data;
    const assessment = await runAssessment(config);
    const isComplete = assessment.results.every((result) => result.status !== "could_not_run");
    if (isComplete) {
      try {
        await (await getDb()).insert(assessments).values({ agentName: assessment.agentName, score: assessment.overallScore, tier: assessment.tier, scenarioCount: assessment.results.length });
      } catch (databaseError) {
        console.error("Assessment completed but leaderboard persistence failed", databaseError);
      }
    }
    return Response.json({ assessment });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Proving Ground could not start this assessment. Check the configuration and try again." }, { status: 500 });
  }
}
