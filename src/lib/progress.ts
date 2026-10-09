import "server-only";
import type { AttemptRecord } from "@/game/engine";
import { getDb } from "./db";

export async function getUserAttempts(userId: string): Promise<AttemptRecord[]> {
  const rows = await getDb().attempt.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 2000,
  });
  return rows.map((r) => ({
    scenarioSlug: r.scenarioSlug,
    choiceId: r.choiceId,
    correct: r.correct,
    at: r.createdAt.toISOString(),
  }));
}
