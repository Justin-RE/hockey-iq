import type { Category, Scenario } from "@/game/engine";
import { channelTheAttacker } from "./channel-the-attacker";
import { freeHitFiveYards } from "./free-hit-five-yards";
import { goalSideMarking } from "./goal-side-marking";
import { obstructionShielding } from "./obstruction-shielding";
import { pcAttackInjection } from "./pc-attack-injection";
import { pcDefenseFirstRunner } from "./pc-defense-first-runner";
import { sixteenYardHitOutlet } from "./sixteen-yard-hit-outlet";
import { twoVOneOverlap } from "./two-v-one-overlap";

/** Display order. Slugs are permanent once released (see ADR 0005). */
export const scenarios: readonly Scenario[] = [
  goalSideMarking,
  freeHitFiveYards,
  pcAttackInjection,
  obstructionShielding,
  sixteenYardHitOutlet,
  channelTheAttacker,
  pcDefenseFirstRunner,
  twoVOneOverlap,
];

export const scenarioSlugs = scenarios.map((s) => s.slug);

export const categoryLabels: Record<Category, string> = {
  "set-piece": "Set pieces",
  defense: "Defense",
  attack: "Attack",
  rules: "Rules",
};

export function getScenario(slug: string): Scenario | undefined {
  return scenarios.find((s) => s.slug === slug);
}

export function getNextScenario(slug: string): Scenario | undefined {
  const index = scenarios.findIndex((s) => s.slug === slug);
  return index >= 0 ? scenarios[index + 1] : undefined;
}
