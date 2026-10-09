import { BALL_ID, type Choice, type Move, type Point, type Scenario } from "./schema";

export type Positions = Record<string, Point>;

export type Outcome = {
  choice: Choice;
  correct: boolean;
  correctChoice: Choice;
  timeline: Move[][];
};

export class UnknownChoiceError extends Error {
  constructor(slug: string, choiceId: string) {
    super(`Scenario "${slug}" has no choice "${choiceId}"`);
    this.name = "UnknownChoiceError";
  }
}

export function initialPositions(scenario: Scenario): Positions {
  const positions: Positions = { [BALL_ID]: { ...scenario.ball } };
  for (const avatar of scenario.avatars) positions[avatar.id] = { ...avatar.position };
  return positions;
}

/** Groups moves by step, in step order. Moves within a step play at the same time. */
export function buildTimeline(moves: Move[]): Move[][] {
  const byStep = new Map<number, Move[]>();
  for (const move of moves) byStep.set(move.step, [...(byStep.get(move.step) ?? []), move]);
  return [...byStep.entries()].sort(([a], [b]) => a - b).map(([, group]) => group);
}

export function applyTimeline(start: Positions, timeline: Move[][]): Positions {
  const positions: Positions = { ...start };
  for (const step of timeline) for (const move of step) positions[move.target] = { ...move.to };
  return positions;
}

export function evaluateChoice(scenario: Scenario, choiceId: string): Outcome {
  const choice = scenario.choices.find((c) => c.id === choiceId);
  if (!choice) throw new UnknownChoiceError(scenario.slug, choiceId);
  const correctChoice = scenario.choices.find((c) => c.correct) ?? choice;
  return {
    choice,
    correct: choice.correct,
    correctChoice,
    timeline: buildTimeline(choice.moves),
  };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
