import { z } from "zod";

/** Pitch dimensions in yards. x: own backline (0) to opponent backline (100). y: top (0) to bottom (60) sideline. */
export const PITCH = {
  length: 100,
  width: 60,
  goalY: 30,
  goalWidth: 4,
  circleRadius: 16,
  quarterLine: 25,
} as const;

export const YOU_ID = "you";
export const BALL_ID = "ball";

export const PointSchema = z.object({
  x: z.number().min(0).max(PITCH.length),
  y: z.number().min(0).max(PITCH.width),
});

export const AvatarSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  team: z.enum(["home", "away"]),
  number: z.number().int().min(1).max(99),
  role: z.string().min(1).max(20),
  position: PointSchema,
  isYou: z.boolean().optional(),
});

export const MoveSchema = z.object({
  target: z.string().min(1),
  to: PointSchema,
  step: z.number().int().min(0).max(10),
});

export const ChoiceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(3).max(140),
  correct: z.boolean(),
  feedback: z.string().min(10).max(400),
  moves: z.array(MoveSchema).max(20),
});

export const CATEGORIES = ["set-piece", "defense", "attack", "rules"] as const;

export const ScenarioSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    title: z.string().min(3).max(80),
    category: z.enum(CATEGORIES),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    summary: z.string().min(10).max(160),
    description: z.string().min(20).max(600),
    prompt: z.string().min(10).max(240),
    avatars: z.array(AvatarSchema).min(2).max(22),
    ball: PointSchema,
    choices: z.array(ChoiceSchema).min(2).max(4),
    explanation: z.string().min(20).max(900),
  })
  .superRefine((s, ctx) => {
    const you = s.avatars.filter((a) => a.isYou);
    if (you.length !== 1 || you[0].id !== YOU_ID || you[0].team !== "home") {
      ctx.addIssue({
        code: "custom",
        path: ["avatars"],
        message: `exactly one avatar must be { id: "${YOU_ID}", team: "home", isYou: true }`,
      });
    }

    const ids = s.avatars.map((a) => a.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", path: ["avatars"], message: "avatar ids must be unique" });
    }

    const correct = s.choices.filter((c) => c.correct);
    if (correct.length !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "exactly one choice must be correct",
      });
    }

    const choiceIds = s.choices.map((c) => c.id);
    if (new Set(choiceIds).size !== choiceIds.length) {
      ctx.addIssue({ code: "custom", path: ["choices"], message: "choice ids must be unique" });
    }

    const targets = new Set([...ids, BALL_ID]);
    s.choices.forEach((c, ci) =>
      c.moves.forEach((m, mi) => {
        if (!targets.has(m.target)) {
          ctx.addIssue({
            code: "custom",
            path: ["choices", ci, "moves", mi, "target"],
            message: `unknown move target "${m.target}"`,
          });
        }
      }),
    );
  });

export type Point = z.infer<typeof PointSchema>;
export type Avatar = z.infer<typeof AvatarSchema>;
export type Move = z.infer<typeof MoveSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type Category = (typeof CATEGORIES)[number];
export type Scenario = z.infer<typeof ScenarioSchema>;
