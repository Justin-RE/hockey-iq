import { PITCH, type Point } from "@/game/engine";

export type Orientation = "landscape" | "portrait";

/** Matches Tailwind's `sm` breakpoint; PitchCanvas's aspect-ratio classes switch at the same width. */
export const PORTRAIT_QUERY = "(width < 40rem)";

export const SCALE = 10;
export const MARGIN = 30;
const LONG_SIDE = PITCH.length * SCALE + MARGIN * 2;
const SHORT_SIDE = PITCH.width * SCALE + MARGIN * 2;

/** Players are drawn larger in portrait so they stay readable on a phone-width pitch. */
export const AVATAR_SCALE: Record<Orientation, number> = { landscape: 1, portrait: 1.3 };

export function canvasSize(orientation: Orientation) {
  return orientation === "landscape"
    ? { width: LONG_SIDE, height: SHORT_SIDE }
    : { width: SHORT_SIDE, height: LONG_SIDE };
}

/** Pixel position of a point on the landscape pitch drawing (you attack to the right). */
export function toLandscape(p: Point): Point {
  return { x: MARGIN + p.x * SCALE, y: MARGIN + p.y * SCALE };
}

/**
 * Canvas pixel position of a pitch point. Portrait is the landscape drawing turned a quarter
 * turn counterclockwise: you attack toward the top, and the top sideline (y = 0) is on the left.
 */
export function toCanvas(p: Point, orientation: Orientation): Point {
  const { x, y } = toLandscape(p);
  return orientation === "landscape" ? { x, y } : { x: y, y: LONG_SIDE - x };
}

/** Rotation and offset that place the landscape pitch drawing on the canvas. */
export function drawingTransform(orientation: Orientation) {
  return orientation === "landscape"
    ? { rotation: 0, x: 0, y: 0 }
    : { rotation: -Math.PI / 2, x: 0, y: LONG_SIDE };
}
