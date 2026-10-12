import { describe, expect, it } from "vitest";
import { ScenarioSchema, applyTimeline, buildTimeline, initialPositions } from "@/game/engine";
import { scenarios } from "./index";

describe("scenario content", () => {
  it("has unique slugs", () => {
    const slugs = scenarios.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(scenarios.map((s) => [s.slug, s] as const))("%s matches the schema", (_slug, s) => {
    const result = ScenarioSchema.safeParse(s);
    expect(result.success, JSON.stringify(result.error?.issues, null, 2)).toBe(true);
  });

  // The pitch is drawn landscape on wide screens and portrait on phones, so screen directions
  // ("on the left", "top sideline") would be wrong in one of them. "Top of the circle" is a
  // field hockey term, not a screen direction.
  it.each(scenarios.map((s) => [s.slug, s] as const))(
    "%s: description uses player directions, not screen directions",
    (_slug, s) => {
      const text = s.description.toLowerCase().replaceAll("top of the circle", "");
      expect(text).not.toMatch(/\b(top|bottom|upper|lower|above|below)\b/);
      expect(text).not.toMatch(/\b(on|to) the (left|right)\b/);
    },
  );

  it.each(scenarios.map((s) => [s.slug, s] as const))(
    "%s: every choice changes the picture",
    (_slug, s) => {
      const start = initialPositions(s);
      for (const choice of s.choices) {
        expect(choice.moves.length, `${choice.id} has no moves`).toBeGreaterThan(0);
        const end = applyTimeline(start, buildTimeline(choice.moves));
        expect(end).not.toEqual(start);
      }
    },
  );
});
