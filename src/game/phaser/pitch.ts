import type * as PhaserTypes from "phaser";
import {
  BALL_ID,
  PITCH,
  distance,
  initialPositions,
  type Move,
  type Point,
  type Scenario,
} from "@/game/engine";

const SCALE = 10;
const MARGIN = 30;
export const CANVAS_WIDTH = PITCH.length * SCALE + MARGIN * 2;
export const CANVAS_HEIGHT = PITCH.width * SCALE + MARGIN * 2;

// Okabe-Ito palette: distinguishable with common color-vision deficiencies.
const COLORS = {
  turf: 0x2e7d4f,
  lines: 0xffffff,
  home: 0x0072b2,
  away: 0xe69f00,
  keeper: 0xcc79a7,
  you: 0xf0e442,
  ball: 0xffffff,
};

export type PitchController = {
  play(timeline: Move[][]): Promise<void>;
  reset(): void;
  destroy(): void;
};

const toPx = (p: Point) => ({ x: MARGIN + p.x * SCALE, y: MARGIN + p.y * SCALE });

export async function createPitch(
  parent: HTMLElement,
  scenario: Scenario,
  { reducedMotion = false }: { reducedMotion?: boolean } = {},
): Promise<PitchController> {
  const Phaser = (await import("phaser")).default;
  const start = initialPositions(scenario);
  let markReady: () => void = () => {};
  const ready = new Promise<void>((resolve) => (markReady = resolve));

  class PitchScene extends Phaser.Scene {
    objects = new Map<string, PhaserTypes.GameObjects.Container | PhaserTypes.GameObjects.Arc>();
    positions = { ...start };

    constructor() {
      super("pitch");
    }

    create() {
      this.drawPitch();
      for (const avatar of scenario.avatars) {
        const { x, y } = toPx(avatar.position);
        const fill =
          avatar.role === "GK" ? COLORS.keeper : avatar.team === "home" ? COLORS.home : COLORS.away;
        const body = this.add.circle(0, 0, 13, fill).setStrokeStyle(2, 0x000000, 0.6);
        const label = this.add
          .text(0, 0, String(avatar.number), {
            fontFamily: "Arial, sans-serif",
            fontSize: "13px",
            fontStyle: "bold",
            color: avatar.team === "home" && avatar.role !== "GK" ? "#ffffff" : "#000000",
          })
          .setOrigin(0.5);
        const parts: PhaserTypes.GameObjects.GameObject[] = [body, label];
        if (avatar.isYou) {
          const ring = this.add.circle(0, 0, 18).setStrokeStyle(4, COLORS.you);
          const tag = this.add
            .text(0, -30, "YOU", {
              fontFamily: "Arial, sans-serif",
              fontSize: "12px",
              fontStyle: "bold",
              color: "#000000",
              backgroundColor: "#f0e442",
              padding: { x: 4, y: 1 },
            })
            .setOrigin(0.5);
          parts.unshift(ring);
          parts.push(tag);
        }
        this.objects.set(avatar.id, this.add.container(x, y, parts).setDepth(avatar.isYou ? 3 : 2));
      }
      const ball = toPx(scenario.ball);
      this.objects.set(
        BALL_ID,
        this.add.circle(ball.x, ball.y, 5, COLORS.ball).setStrokeStyle(2, 0x000000).setDepth(4),
      );
      markReady();
    }

    drawPitch() {
      const g = this.add.graphics();
      g.fillStyle(COLORS.turf).fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      g.lineStyle(3, COLORS.lines, 0.9);
      g.strokeRect(MARGIN, MARGIN, PITCH.length * SCALE, PITCH.width * SCALE);

      const vLine = (xYards: number) => {
        const x = MARGIN + xYards * SCALE;
        g.lineBetween(x, MARGIN, x, MARGIN + PITCH.width * SCALE);
      };
      vLine(PITCH.length / 2);
      vLine(PITCH.quarterLine);
      vLine(PITCH.length - PITCH.quarterLine);

      const postTop = PITCH.goalY - PITCH.goalWidth / 2;
      const postBottom = PITCH.goalY + PITCH.goalWidth / 2;
      const r = PITCH.circleRadius * SCALE;
      for (const side of [0, 1] as const) {
        const backX = side === 0 ? MARGIN : MARGIN + PITCH.length * SCALE;
        const dir = side === 0 ? 1 : -1;
        const top = MARGIN + postTop * SCALE;
        const bottom = MARGIN + postBottom * SCALE;
        g.beginPath();
        if (side === 0) {
          g.arc(backX, top, r, -Math.PI / 2, 0, false);
          g.lineTo(backX + r, bottom);
          g.arc(backX, bottom, r, 0, Math.PI / 2, false);
        } else {
          g.arc(backX, top, r, -Math.PI / 2, -Math.PI, true);
          g.lineTo(backX - r, bottom);
          g.arc(backX, bottom, r, Math.PI, Math.PI / 2, true);
        }
        g.strokePath();
        g.fillStyle(0xffffff, 0.85);
        g.fillRect(side === 0 ? backX - 12 : backX, top, 12, bottom - top);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(backX + dir * 7 * SCALE, MARGIN + PITCH.goalY * SCALE, 3);
      }
    }

    tweenTo(id: string, to: Point): Promise<void> {
      const target = this.objects.get(id);
      if (!target) return Promise.resolve();
      const from = this.positions[id] ?? to;
      this.positions[id] = to;
      const px = toPx(to);
      const perYard = id === BALL_ID ? 18 : 45;
      const duration = reducedMotion ? 0 : Math.max(250, distance(from, to) * perYard);
      return new Promise((resolve) =>
        this.tweens.add({
          targets: target,
          x: px.x,
          y: px.y,
          duration,
          ease: "Sine.easeInOut",
          onComplete: () => resolve(),
        }),
      );
    }

    reset() {
      this.tweens.killAll();
      this.positions = { ...start };
      for (const [id, obj] of this.objects) {
        const px = toPx(start[id]);
        obj.setPosition(px.x, px.y);
      }
    }
  }

  const scene = new PitchScene();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: "#2e7d4f",
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
    scene,
  });

  await ready;

  return {
    async play(timeline) {
      for (const step of timeline) {
        await Promise.all(step.map((move) => scene.tweenTo(move.target, move.to)));
        if (!reducedMotion) await new Promise((r) => setTimeout(r, 150));
      }
    },
    reset: () => scene.reset(),
    destroy: () => game.destroy(true),
  };
}
