"use server";

import { z } from "zod";
import { AttemptRecordSchema, evaluateChoice } from "@/game/engine";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getScenario } from "@/scenarios";

const AttemptInput = z.object({
  slug: z.string().max(80),
  choiceId: z.string().max(80),
});

/** Correctness is recomputed on the server; the client only says which choice was picked. */
function score(slug: string, choiceId: string): boolean | null {
  const scenario = getScenario(slug);
  if (!scenario?.choices.some((c) => c.id === choiceId)) return null;
  return evaluateChoice(scenario, choiceId).correct;
}

export async function recordAttempt(slug: string, choiceId: string): Promise<{ saved: boolean }> {
  const input = AttemptInput.safeParse({ slug, choiceId });
  if (!input.success) return { saved: false };
  const correct = score(input.data.slug, input.data.choiceId);
  if (correct === null) return { saved: false };

  const user = await getSessionUser();
  if (!user) return { saved: false };

  await getDb().attempt.create({
    data: {
      userId: user.id,
      scenarioSlug: input.data.slug,
      choiceId: input.data.choiceId,
      correct,
    },
  });
  return { saved: true };
}

const ImportInput = z.array(AttemptRecordSchema).max(500);

export async function importGuestAttempts(raw: unknown): Promise<{ imported: number }> {
  const user = await getSessionUser();
  if (!user) return { imported: 0 };
  const parsed = ImportInput.safeParse(raw);
  if (!parsed.success) return { imported: 0 };

  const rows = parsed.data.flatMap((a) => {
    const correct = score(a.scenarioSlug, a.choiceId);
    return correct === null
      ? []
      : [
          {
            userId: user.id,
            scenarioSlug: a.scenarioSlug,
            choiceId: a.choiceId,
            correct,
            createdAt: new Date(a.at),
          },
        ];
  });

  const { count } = await getDb().attempt.createMany({ data: rows });
  logger.info({ userId: user.id, count }, "imported guest attempts");
  return { imported: count };
}
