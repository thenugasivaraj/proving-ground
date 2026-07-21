import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { assessments } from "../../../db/schema";
import { hiddenLeaderboardAgentNames } from "../../../lib/seed";

export async function GET() {
  const seeded = [
    { id: -1, agentName: "Atlas Support Agent", score: 87, tier: "Production-grade", scenarioCount: 6, createdAt: "Built-in baseline" },
    { id: -2, agentName: "Shortcut Support Bot", score: 28, tier: "Demo-grade", scenarioCount: 6, createdAt: "Built-in baseline" },
  ];
  try {
    const rows = await (await getDb()).select().from(assessments).orderBy(desc(assessments.score), desc(assessments.createdAt)).limit(100);
    const tested = rows.filter((row) => !hiddenLeaderboardAgentNames.includes(row.agentName as typeof hiddenLeaderboardAgentNames[number]));
    return Response.json({ entries: [...seeded, ...tested].sort((a, b) => b.score - a.score) });
  } catch (error) {
    console.error(error);
    return Response.json({ entries: seeded });
  }
}
