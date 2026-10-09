import type { Scenario } from "@/game/engine";

export const goalSideMarking: Scenario = {
  slug: "goal-side-marking",
  title: "Marking: goal-side and ball-side",
  category: "defense",
  difficulty: 1,
  summary: "The player you're marking is about to receive a pass near your 25. Where do you stand?",
  description:
    "An opponent in midfield has the ball and is looking to pass. The attacker you are marking is near your 25-yard line on the lower side of the field. Right now you are standing behind her, farther from your goal than she is.",
  prompt:
    "The attacker you're marking is about to receive a pass near your 25. Where should you be?",
  avatars: [
    { id: "you", team: "home", number: 3, role: "Back", position: { x: 33, y: 43 }, isYou: true },
    { id: "h2", team: "home", number: 5, role: "Back", position: { x: 24, y: 22 } },
    { id: "gk", team: "home", number: 1, role: "GK", position: { x: 1, y: 30 } },
    { id: "mark", team: "away", number: 11, role: "Forward", position: { x: 28, y: 41 } },
    { id: "passer", team: "away", number: 8, role: "Mid", position: { x: 45, y: 26 } },
    { id: "a3", team: "away", number: 9, role: "Forward", position: { x: 27, y: 20 } },
  ],
  ball: { x: 44.5, y: 26.5 },
  choices: [
    {
      id: "goal-side",
      label: "Between her and your goal, shaded slightly toward the ball",
      correct: true,
      feedback:
        "Yes. From there you can see the ball and your player, and you're first to the pass. You step in and intercept.",
      moves: [
        { target: "you", to: { x: 26, y: 38 }, step: 0 },
        { target: "ball", to: { x: 27, y: 37.5 }, step: 1 },
        { target: "you", to: { x: 26.5, y: 37.5 }, step: 1 },
        { target: "ball", to: { x: 24, y: 23 }, step: 2 },
      ],
    },
    {
      id: "behind-her",
      label: "Stay where you are, behind her and away from your goal",
      correct: false,
      feedback:
        "She receives the ball facing your goal with nobody between her and the circle. You're chasing from behind.",
      moves: [
        { target: "ball", to: { x: 28.5, y: 40.5 }, step: 0 },
        { target: "mark", to: { x: 18, y: 36 }, step: 1 },
        { target: "ball", to: { x: 17.5, y: 36 }, step: 1 },
        { target: "you", to: { x: 24, y: 40 }, step: 1 },
      ],
    },
    {
      id: "chase-ball",
      label: "Leave her and run at the player with the ball",
      correct: false,
      feedback:
        "The passer simply plays the ball to the player you left. Now she's free near your circle.",
      moves: [
        { target: "you", to: { x: 41, y: 29 }, step: 0 },
        { target: "ball", to: { x: 28.5, y: 40.5 }, step: 1 },
        { target: "mark", to: { x: 17, y: 36 }, step: 2 },
        { target: "ball", to: { x: 16.5, y: 36 }, step: 2 },
      ],
    },
  ],
  explanation:
    "Goal-side means your body is between your player and your goal. Ball-side means you lean slightly toward the ball so you can intercept passes. Mark close when she is near your goal, and give a little more space farther away, but never let her get between you and the goal.",
};
