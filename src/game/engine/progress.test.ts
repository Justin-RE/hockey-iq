import { describe, expect, it } from "vitest";
import { summarizeProgress, type AttemptRecord } from "./progress";

const at = (minute: number) => new Date(Date.UTC(2026, 9, 9, 12, minute)).toISOString();

describe("summarizeProgress", () => {
  it("tracks first-try and eventual correctness per scenario", () => {
    const attempts: AttemptRecord[] = [
      { scenarioSlug: "b", choiceId: "x", correct: true, at: at(5) },
      { scenarioSlug: "a", choiceId: "y", correct: true, at: at(3) },
      { scenarioSlug: "a", choiceId: "x", correct: false, at: at(1) },
      { scenarioSlug: "retired", choiceId: "x", correct: true, at: at(2) },
    ];

    const summary = summarizeProgress(attempts, ["a", "b", "c"]);

    expect(summary.byScenario.a).toEqual({
      slug: "a",
      attempts: 2,
      firstTryCorrect: false,
      everCorrect: true,
    });
    expect(summary.byScenario.b.firstTryCorrect).toBe(true);
    expect(summary.byScenario.retired).toBeUndefined();
    expect(summary).toMatchObject({ attempted: 2, firstTryCorrect: 1, total: 3 });
  });

  it("handles no attempts", () => {
    expect(summarizeProgress([], ["a"])).toMatchObject({ attempted: 0, total: 1 });
  });
});
