import { describe, expect, it } from "vitest";
import { PITCH } from "@/game/engine";
import { canvasSize, drawingTransform, toCanvas, toLandscape } from "./layout";

/** Applies a Phaser-style transform (rotation, then translation) to a point. */
function transform(
  p: { x: number; y: number },
  { rotation, x, y }: ReturnType<typeof drawingTransform>,
) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return { x: p.x * cos - p.y * sin + x, y: p.x * sin + p.y * cos + y };
}

describe("pitch layout", () => {
  it("swaps canvas width and height in portrait", () => {
    const landscape = canvasSize("landscape");
    expect(landscape.width).toBeGreaterThan(landscape.height);
    expect(canvasSize("portrait")).toEqual({ width: landscape.height, height: landscape.width });
  });

  it("attacks up the screen in portrait, with the top sideline on the left", () => {
    const { width, height } = canvasSize("portrait");
    const ownGoal = toCanvas({ x: 0, y: PITCH.goalY }, "portrait");
    const theirGoal = toCanvas({ x: PITCH.length, y: PITCH.goalY }, "portrait");
    expect(theirGoal.y).toBeLessThan(ownGoal.y);
    expect(ownGoal.x).toBeCloseTo(width / 2);

    const topSideline = toCanvas({ x: 50, y: 0 }, "portrait");
    const bottomSideline = toCanvas({ x: 50, y: PITCH.width }, "portrait");
    expect(topSideline.x).toBeLessThan(bottomSideline.x);

    for (const p of [ownGoal, theirGoal, topSideline, bottomSideline]) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(width);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(height);
    }
  });

  it.each(["landscape", "portrait"] as const)(
    "puts players exactly on the %s pitch drawing",
    (orientation) => {
      const t = drawingTransform(orientation);
      for (const p of [
        { x: 0, y: 0 },
        { x: 25, y: 10 },
        { x: PITCH.length, y: PITCH.width },
      ]) {
        const drawn = transform(toLandscape(p), t);
        const placed = toCanvas(p, orientation);
        expect(drawn.x).toBeCloseTo(placed.x);
        expect(drawn.y).toBeCloseTo(placed.y);
      }
    },
  );
});
