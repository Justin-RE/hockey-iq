import type { Scenario } from "@/game/engine";

export const pcAttackInjection: Scenario = {
  slug: "pc-attack-injection",
  title: "Penalty corner attack: before the shot",
  category: "rules",
  difficulty: 1,
  summary: "Your team has a penalty corner. What has to happen before anyone shoots?",
  description:
    "Your team is attacking a penalty corner at the opponent's goal on the right. A teammate is about to push the ball out from the backline. You wait at the top of the circle. Four defenders and their goalkeeper are behind the goal line.",
  prompt:
    "The ball is coming to you at the top of the circle. Before anyone may shoot, what must happen?",
  avatars: [
    {
      id: "you",
      team: "home",
      number: 9,
      role: "Stopper",
      position: { x: 85, y: 30 },
      isYou: true,
    },
    { id: "injector", team: "home", number: 6, role: "Injector", position: { x: 100, y: 41 } },
    { id: "h2", team: "home", number: 12, role: "Attacker", position: { x: 86, y: 22 } },
    { id: "gk", team: "away", number: 1, role: "GK", position: { x: 99.5, y: 30 } },
    { id: "d1", team: "away", number: 4, role: "Runner", position: { x: 100, y: 25.5 } },
    { id: "d2", team: "away", number: 5, role: "Post", position: { x: 100, y: 34 } },
    { id: "d3", team: "away", number: 2, role: "Runner", position: { x: 100, y: 37 } },
  ],
  ball: { x: 100, y: 41 },
  choices: [
    {
      id: "outside-circle",
      label: "The ball must travel outside the circle first",
      correct: true,
      feedback:
        "Correct. You stop the ball just outside the circle, then bring it back in to shoot. A shot before that is a foul.",
      moves: [
        { target: "ball", to: { x: 82.5, y: 30 }, step: 0 },
        { target: "you", to: { x: 83, y: 30 }, step: 0 },
        { target: "d1", to: { x: 92, y: 28 }, step: 1 },
        { target: "you", to: { x: 86, y: 30 }, step: 1 },
        { target: "ball", to: { x: 86.5, y: 30 }, step: 1 },
        { target: "ball", to: { x: 100, y: 31.2 }, step: 2 },
      ],
    },
    {
      id: "shoot-immediately",
      label: "Nothing: shoot the moment the ball reaches you inside the circle",
      correct: false,
      feedback:
        "That's a foul. The ball never left the circle, so the goal doesn't count and the defense gets a free hit.",
      moves: [
        { target: "ball", to: { x: 86, y: 30 }, step: 0 },
        { target: "ball", to: { x: 100, y: 31 }, step: 1 },
      ],
    },
    {
      id: "touch-defender",
      label: "A defender has to touch the ball first",
      correct: false,
      feedback:
        "No. Defenders don't need to touch it. What matters is that the ball travels outside the circle before a shot.",
      moves: [
        { target: "ball", to: { x: 86, y: 30 }, step: 0 },
        { target: "d1", to: { x: 88, y: 29 }, step: 1 },
        { target: "ball", to: { x: 90, y: 38 }, step: 2 },
      ],
    },
  ],
  explanation:
    "On a penalty corner the ball is pushed or hit out from the backline and must travel outside the circle before any attacker shoots. Attackers start outside the circle too. If the first shot is a hit (not a push or flick), it must cross the goal line no higher than the backboard (18 inches / 460 mm). These rules are shared by FIH and NFHS play.",
};
