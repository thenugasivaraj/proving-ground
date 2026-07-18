import { getDb } from "../../../db";
import { assessments } from "../../../db/schema";
import { runAssessment } from "../../../lib/evaluator";
import type { TargetAgentConfig } from "../../../lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  try {
    const config = (await request.json()) as TargetAgentConfig;
    if (!config.name?.trim() || !config.systemPrompt?.trim()) return Response.json({ error: "Agent name and system prompt are required." }, { status: 400 });
    if (!Array.isArray(config.tools) || config.tools.length < 1 || config.tools.length > 2) return Response.json({ error: "Choose one or two mock tools." }, { status: 400 });
    const assessment = await runAssessment(config);
    try {
      await (await getDb()).insert(assessments).values({ agentName: assessment.agentName, score: assessment.overallScore, tier: assessment.tier, scenarioCount: assessment.results.length });
    } catch (databaseError) {
      console.error("Assessment completed but leaderboard persistence failed", databaseError);
    }
    return Response.json({ assessment });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : "Assessment failed." }, { status: 500 });
  }
}
