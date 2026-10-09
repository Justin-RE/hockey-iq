import type { Scenario } from "@/game/engine";

export const channelTheAttacker: Scenario = {
  slug: "channel-the-attacker",
  title: "1v1 defending: channel, don't dive",
  category: "defense",
  difficulty: 2,
  summary: "An attacker is dribbling straight at you in midfield. How do you defend?",
  description:
    "An opponent is dribbling toward your goal on the left through the middle of the field. You are the only defender in front of her, a few yards away. The bottom sideline is open space with no other players.",
  prompt: "An attacker is running at you 1-on-1. What's the best way to defend?",
  avatars: [
    { id: "you", team: "home", number: 6, role: "Mid", position: { x: 33, y: 29 }, isYou: true },
    { id: "gk", team: "home", number: 1, role: "GK", position: { x: 1, y: 30 } },
    { id: "h2", team: "home", number: 2, role: "Back", position: { x: 18, y: 18 } },
    { id: "att", team: "away", number: 7, role: "Forward", position: { x: 42, y: 30 } },
  ],
  ball: { x: 41, y: 30 },
  choices: [
    {
      id: "channel",
      label:
        "Stay low and on your feet, steer her toward the sideline, and jab when the ball leaves her stick",
      correct: true,
      feedback:
        "Nice. You take away the middle, slow her down, and win the ball with a jab when she pushes it too far.",
      moves: [
        { target: "you", to: { x: 32, y: 32 }, step: 0 },
        { target: "att", to: { x: 36, y: 38 }, step: 0 },
        { target: "ball", to: { x: 35, y: 38.5 }, step: 0 },
        { target: "you", to: { x: 33, y: 40 }, step: 1 },
        { target: "ball", to: { x: 32, y: 41 }, step: 1 },
        { target: "att", to: { x: 34, y: 40 }, step: 1 },
      ],
    },
    {
      id: "dive-in",
      label: "Dive in with a big tackle right away",
      correct: false,
      feedback:
        "You commit too early. She shifts the ball past you and runs into the space behind you toward the circle.",
      moves: [
        { target: "you", to: { x: 39, y: 30 }, step: 0 },
        { target: "ball", to: { x: 37, y: 25 }, step: 0 },
        { target: "att", to: { x: 37, y: 26 }, step: 0 },
        { target: "att", to: { x: 22, y: 27 }, step: 1 },
        { target: "ball", to: { x: 21, y: 27 }, step: 1 },
      ],
    },
    {
      id: "backpedal",
      label: "Backpedal toward your circle without trying to win the ball",
      correct: false,
      feedback:
        "Giving ground forever lets her carry the ball right to your circle with time to choose a shot or pass.",
      moves: [
        { target: "you", to: { x: 18, y: 29 }, step: 0 },
        { target: "att", to: { x: 22, y: 30 }, step: 0 },
        { target: "ball", to: { x: 21, y: 30 }, step: 0 },
      ],
    },
  ],
  explanation:
    "In a 1-on-1, stay balanced and low, keep your stick on the ground, and angle your body so the attacker can only go toward the sideline (often onto her weaker reverse side). That takes the direct route to goal away. Tackle when she's under control of you, not the other way around: jab at the ball when it's off her stick instead of lunging.",
};
