import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { assessments } from "../../../db/schema";

export async function GET() {
  try {
    const rows = await (await getDb()).select().from(assessments).orderBy(desc(assessments.score), desc(assessments.createdAt)).limit(100);
    return Response.json({ entries: rows });
  } catch (error) {
    console.error(error);
    return Response.json({ entries: [] });
  }
}
