import { z } from "zod";

export const AttemptRecordSchema = z.object({
  scenarioSlug: z.string(),
  choiceId: z.string(),
  correct: z.boolean(),
  at: z.iso.datetime(),
});

export type AttemptRecord = z.infer<typeof AttemptRecordSchema>;

export type ScenarioProgress = {
  slug: string;
  attempts: number;
  firstTryCorrect: boolean;
  everCorrect: boolean;
};

export type ProgressSummary = {
  byScenario: Record<string, ScenarioProgress>;
  attempted: number;
  firstTryCorrect: number;
  total: number;
};

export function summarizeProgress(attempts: AttemptRecord[], slugs: string[]): ProgressSummary {
  const known = new Set(slugs);
  const byScenario: Record<string, ScenarioProgress> = {};
  const ordered = [...attempts].sort((a, b) => a.at.localeCompare(b.at));

  for (const attempt of ordered) {
    if (!known.has(attempt.scenarioSlug)) continue;
    const current = byScenario[attempt.scenarioSlug];
    if (!current) {
      byScenario[attempt.scenarioSlug] = {
        slug: attempt.scenarioSlug,
        attempts: 1,
        firstTryCorrect: attempt.correct,
        everCorrect: attempt.correct,
      };
    } else {
      current.attempts += 1;
      current.everCorrect ||= attempt.correct;
    }
  }

  const values = Object.values(byScenario);
  return {
    byScenario,
    attempted: values.length,
    firstTryCorrect: values.filter((p) => p.firstTryCorrect).length,
    total: slugs.length,
  };
}
