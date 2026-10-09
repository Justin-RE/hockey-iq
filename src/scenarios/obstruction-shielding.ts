import type { Scenario } from "@/game/engine";

export const obstructionShielding: Scenario = {
  slug: "obstruction-shielding",
  title: "Under pressure: shielding vs. moving the ball",
  category: "rules",
  difficulty: 2,
  summary:
    "A defender closes in while you have the ball near the sideline. What's legal and smart?",
  description:
    "You have the ball in the opponent's half near the top sideline. A defender is running at you from the front. A teammate is open in the middle of the field.",
  prompt: "A defender is closing in on you. What's the legal and smart play?",
  avatars: [
    { id: "you", team: "home", number: 10, role: "Mid", position: { x: 60, y: 9 }, isYou: true },
    { id: "h2", team: "home", number: 8, role: "Mid", position: { x: 63, y: 26 } },
    { id: "def", team: "away", number: 5, role: "Back", position: { x: 66, y: 11 } },
    { id: "a2", team: "away", number: 6, role: "Mid", position: { x: 70, y: 30 } },
  ],
  ball: { x: 60.5, y: 9.5 },
  choices: [
    {
      id: "move-ball",
      label: "Pass to your open teammate before the defender arrives",
      correct: true,
      feedback:
        "Right. You keep possession by moving the ball, not your body. Your teammate receives in space.",
      moves: [
        { target: "def", to: { x: 62, y: 10 }, step: 0 },
        { target: "ball", to: { x: 63, y: 25.5 }, step: 0 },
        { target: "h2", to: { x: 70, y: 24 }, step: 1 },
        { target: "ball", to: { x: 70.5, y: 24 }, step: 1 },
      ],
    },
    {
      id: "shield",
      label: "Turn your back and shield the ball with your body",
      correct: false,
      feedback:
        "That's obstruction. The umpire blows the whistle and gives the other team a free hit.",
      moves: [
        { target: "you", to: { x: 61, y: 8 }, step: 0 },
        { target: "def", to: { x: 62, y: 9 }, step: 0 },
      ],
    },
    {
      id: "lift-at-her",
      label: "Lift the ball hard over her stick toward her body",
      correct: false,
      feedback:
        "Raising the ball dangerously at an opponent is a foul and can earn a card. It's also unsafe.",
      moves: [
        { target: "def", to: { x: 63, y: 10.5 }, step: 0 },
        { target: "ball", to: { x: 63, y: 10.5 }, step: 1 },
      ],
    },
  ],
  explanation:
    "You may not use your body or stick to block an opponent from playing the ball. That's called obstruction. Unlike in soccer or basketball, turning your back to shield the ball is a foul when an opponent is trying to play it. Keep the ball moving with passes and dribbles, and keep your head up to spot open teammates.",
};
