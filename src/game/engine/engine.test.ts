import { describe, expect, it } from "vitest";
import {
  ScenarioSchema,
  UnknownChoiceError,
  applyTimeline,
  buildTimeline,
  evaluateChoice,
  initialPositions,
  type Scenario,
} from "./index";

const base: Scenario = {
  slug: "test-scenario",
  title: "Test scenario",
  category: "defense",
  difficulty: 1,
  summary: "A scenario used only in tests.",
  description: "Two players and a ball on an empty pitch for testing.",
  prompt: "What should you do here?",
  avatars: [
    { id: "you", team: "home", number: 5, role: "Back", position: { x: 20, y: 30 }, isYou: true },
    { id: "opp", team: "away", number: 9, role: "Forward", position: { x: 30, y: 30 } },
  ],
  ball: { x: 29, y: 30 },
  choices: [
    {
      id: "good",
      label: "The right answer",
      correct: true,
      feedback: "This is the right answer.",
      moves: [
        { target: "ball", to: { x: 40, y: 10 }, step: 1 },
        { target: "you", to: { x: 25, y: 30 }, step: 0 },
        { target: "opp", to: { x: 28, y: 30 }, step: 0 },
      ],
    },
    {
      id: "bad",
      label: "The wrong answer",
      correct: false,
      feedback: "This is the wrong answer.",
      moves: [{ target: "ball", to: { x: 10, y: 30 }, step: 0 }],
    },
  ],
  explanation: "An explanation that is long enough to pass validation.",
};

describe("buildTimeline", () => {
  it("groups moves by step in order", () => {
    const timeline = buildTimeline(base.choices[0].moves);
    expect(timeline.map((step) => step.map((m) => m.target))).toEqual([["you", "opp"], ["ball"]]);
  });
});

describe("evaluateChoice", () => {
  it("scores the correct choice", () => {
    const outcome = evaluateChoice(base, "good");
    expect(outcome.correct).toBe(true);
    expect(outcome.correctChoice.id).toBe("good");
  });

  it("scores a wrong choice and points to the right one", () => {
    const outcome = evaluateChoice(base, "bad");
    expect(outcome.correct).toBe(false);
    expect(outcome.correctChoice.id).toBe("good");
    expect(outcome.timeline).toHaveLength(1);
  });

  it("rejects unknown choices", () => {
    expect(() => evaluateChoice(base, "nope")).toThrow(UnknownChoiceError);
  });
});

describe("positions", () => {
  it("applies a timeline without mutating the start", () => {
    const start = initialPositions(base);
    const end = applyTimeline(start, evaluateChoice(base, "good").timeline);
    expect(end.ball).toEqual({ x: 40, y: 10 });
    expect(end.you).toEqual({ x: 25, y: 30 });
    expect(start.ball).toEqual({ x: 29, y: 30 });
  });
});

describe("ScenarioSchema invariants", () => {
  it("accepts the base scenario", () => {
    expect(ScenarioSchema.safeParse(base).success).toBe(true);
  });

  it("requires exactly one correct choice", () => {
    const s = { ...base, choices: base.choices.map((c) => ({ ...c, correct: true })) };
    expect(ScenarioSchema.safeParse(s).success).toBe(false);
  });

  it('requires a single home avatar with id "you"', () => {
    const s = {
      ...base,
      avatars: base.avatars.map((a) => (a.id === "you" ? { ...a, team: "away" as const } : a)),
    };
    expect(ScenarioSchema.safeParse(s).success).toBe(false);
  });

  it("rejects moves that target unknown avatars", () => {
    const s = {
      ...base,
      choices: [
        base.choices[0],
        { ...base.choices[1], moves: [{ target: "ghost", to: { x: 1, y: 1 }, step: 0 }] },
      ],
    };
    expect(ScenarioSchema.safeParse(s).success).toBe(false);
  });

  it("rejects positions off the pitch", () => {
    expect(ScenarioSchema.safeParse({ ...base, ball: { x: 101, y: 30 } }).success).toBe(false);
  });
});
