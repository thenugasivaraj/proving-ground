import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const assessments = sqliteTable("assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agentName: text("agent_name").notNull(),
  score: integer("score").notNull(),
  tier: text("tier").notNull(),
  scenarioCount: integer("scenario_count").notNull().default(6),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
