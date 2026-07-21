import { getDb } from "../../../db";
import { assessments } from "../../../db/schema";
import { runAssessment } from "../../../lib/evaluator";
import { persistedAgentName, shouldPersistAssessment } from "../../../lib/seed";
import { z } from "zod";

export const runtime = "nodejs";

const inlineConfigSchema = z.object({
  type: z.literal("inline"),
  name: z.string().trim().min(1, "Enter an agent name.").max(80, "Agent name must be 80 characters or fewer."),
  systemPrompt: z.string().trim().min(1, "Enter a system prompt.").max(20_000, "System prompt is too long."),
  tools: z.array(z.object({
    name: z.string().trim().min(1, "Every tool needs a name.").max(64).regex(/^[a-zA-Z0-9_-]+$/, "Tool names may contain only letters, numbers, underscores, and hyphens."),
    description: z.string().trim().min(1, "Every tool needs a description.").max(500),
    behavior: z.enum(["order_lookup", "ticket_creator"]),
  })).min(1, "Choose at least one mock tool.").max(2, "Choose no more than two mock tools."),
}).strict();

const httpConfigSchema = z.object({
  type: z.literal("http_endpoint"),
  name: z.string().trim().min(1, "Enter a target name.").max(80),
  url: z.string().trim().url("Enter a valid HTTP or HTTPS endpoint URL."),
  authHeader: z.object({ name: z.string().trim().max(100), value: z.string().max(4_000) }).optional(),
  requestTemplate: z.string().trim().min(1, "Enter a JSON request template.").max(50_000),
  responsePath: z.string().trim().min(1, "Enter the JSON path to the reply field.").max(500),
}).strict();

const configSchema = z.discriminatedUnion("type", [inlineConfigSchema, httpConfigSchema]).superRefine((config, context) => {
  if (config.type === "inline") {
    const names = config.tools.map((mockTool) => mockTool.name.toLowerCase());
    if (new Set(names).size !== names.length) context.addIssue({ code: "custom", path: ["tools"], message: "Mock tool names must be unique." });
  } else {
    if (!config.requestTemplate.includes("{{scenario_input}}")) context.addIssue({ code: "custom", path: ["requestTemplate"], message: "The request template must include {{scenario_input}}." });
    try { JSON.parse(config.requestTemplate.replaceAll("{{scenario_input}}", "test input")); }
    catch { context.addIssue({ code: "custom", path: ["requestTemplate"], message: "The request template must be valid JSON with {{scenario_input}} inside a JSON string." }); }
    if (config.authHeader && Boolean(config.authHeader.name) !== Boolean(config.authHeader.value)) context.addIssue({ code: "custom", path: ["authHeader"], message: "Provide both the auth header name and value, or leave both blank." });
  }
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
    if (isComplete && shouldPersistAssessment(config)) {
      try {
        const scenarioCount = assessment.results.filter((result) => result.status !== "skipped").length;
        await (await getDb()).insert(assessments).values({ agentName: persistedAgentName(config), score: assessment.overallScore, tier: assessment.tier, scenarioCount });
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
