import type { Scenario } from "@/game/engine";

export const twoVOneOverlap: Scenario = {
  slug: "two-v-one-overlap",
  title: "2v1 attack: draw, then pass",
  category: "attack",
  difficulty: 3,
  summary: "You and a teammate have a 2-on-1 against the last defender. Make it count.",
  description:
    "You are dribbling toward the opponent's goal on the right. A teammate is running alongside you on the lower side of the field. One defender stands between you and the goalkeeper.",
  prompt: "It's 2-on-1 against the last defender. What do you do?",
  avatars: [
    {
      id: "you",
      team: "home",
      number: 11,
      role: "Forward",
      position: { x: 70, y: 25 },
      isYou: true,
    },
    { id: "mate", team: "home", number: 9, role: "Forward", position: { x: 68, y: 39 } },
    { id: "def", team: "away", number: 3, role: "Back", position: { x: 79, y: 31 } },
    { id: "gk", team: "away", number: 1, role: "GK", position: { x: 99, y: 30 } },
  ],
  ball: { x: 71, y: 25.5 },
  choices: [
    {
      id: "draw-pass",
      label: "Dribble at the defender to make her commit to you, then pass to your teammate",
      correct: true,
      feedback:
        "That's it. Once the defender steps to you, your teammate is free to receive and shoot.",
      moves: [
        { target: "you", to: { x: 77, y: 27 }, step: 0 },
        { target: "ball", to: { x: 78, y: 27.5 }, step: 0 },
        { target: "mate", to: { x: 80, y: 38 }, step: 0 },
        { target: "def", to: { x: 79.5, y: 28 }, step: 0 },
        { target: "ball", to: { x: 82, y: 38 }, step: 1 },
        { target: "mate", to: { x: 86, y: 36 }, step: 1 },
        { target: "ball", to: { x: 100, y: 31.5 }, step: 2 },
      ],
    },
    {
      id: "pass-early",
      label: "Pass to your teammate right away",
      correct: false,
      feedback:
        "The defender hasn't committed, so she just shifts across and marks your teammate. The 2-on-1 is gone.",
      moves: [
        { target: "ball", to: { x: 74, y: 38.5 }, step: 0 },
        { target: "mate", to: { x: 74, y: 38 }, step: 0 },
        { target: "def", to: { x: 78, y: 37 }, step: 0 },
      ],
    },
    {
      id: "go-alone",
      label: "Try to beat the defender yourself and keep the ball",
      correct: false,
      feedback:
        "She only has to worry about you, so she makes the tackle. Your free teammate never touches the ball.",
      moves: [
        { target: "you", to: { x: 77, y: 28 }, step: 0 },
        { target: "ball", to: { x: 78, y: 28.5 }, step: 0 },
        { target: "def", to: { x: 78.5, y: 29 }, step: 0 },
        { target: "ball", to: { x: 72, y: 34 }, step: 1 },
      ],
    },
  ],
  explanation:
    "In a 2-on-1, the ball carrier attacks the defender to force a decision. If the defender steps to the ball, pass to the free teammate; if she stays with the teammate, keep going to goal. Pass too early and the defender can cover both of you.",
};
