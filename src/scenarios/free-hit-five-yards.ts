import type { Scenario } from "@/game/engine";

export const freeHitFiveYards: Scenario = {
  slug: "free-hit-five-yards",
  title: "Opponent's free hit: give 5 yards",
  category: "rules",
  difficulty: 1,
  summary: "The other team has a free hit and you're right next to the ball. What should you do?",
  description:
    "In your half of the field, the umpire has awarded the other team a free hit. Their player is standing over the ball. You are less than two yards away from it, between the ball and your goal on the left.",
  prompt:
    "The opponent is about to take a free hit and you're right next to the ball. What do you do?",
  avatars: [
    { id: "you", team: "home", number: 4, role: "Back", position: { x: 39, y: 21 }, isYou: true },
    { id: "h2", team: "home", number: 3, role: "Back", position: { x: 30, y: 35 } },
    { id: "taker", team: "away", number: 14, role: "Mid", position: { x: 42, y: 19.5 } },
    { id: "a2", team: "away", number: 9, role: "Forward", position: { x: 30, y: 12 } },
    { id: "a3", team: "away", number: 11, role: "Forward", position: { x: 32, y: 32 } },
  ],
  ball: { x: 41, y: 20 },
  choices: [
    {
      id: "back-off",
      label: "Retreat to at least 5 yards from the ball before it's taken",
      correct: true,
      feedback:
        "Correct. You give the required distance and can still mark the most dangerous pass once the ball is played.",
      moves: [
        { target: "you", to: { x: 35, y: 22 }, step: 0 },
        { target: "ball", to: { x: 31, y: 13 }, step: 1 },
        { target: "you", to: { x: 32, y: 15 }, step: 1 },
      ],
    },
    {
      id: "stand-ground",
      label: "Stand right next to the ball so she can't play it forward",
      correct: false,
      feedback:
        "That's a foul. The umpire can move the free hit closer to your goal or show you a card for not giving 5 yards.",
      moves: [{ target: "you", to: { x: 40, y: 20.5 }, step: 0 }],
    },
    {
      id: "swing-when-hit",
      label: "Stay close and swing at the ball the instant it's hit",
      correct: false,
      feedback:
        "Playing the ball from inside 5 yards is still a foul, and swinging near a hard hit is dangerous for both of you.",
      moves: [
        { target: "ball", to: { x: 39.5, y: 20.5 }, step: 0 },
        { target: "you", to: { x: 39.5, y: 21 }, step: 0 },
      ],
    },
  ],
  explanation:
    "Opponents must be at least 5 yards (5 m) from the ball when a free hit is taken. Standing closer to slow the restart is a foul, and repeated offenses can earn a card. Under FIH rules, inside the attacking 25 every player except the taker must be 5 yards away, and the ball must travel 5 yards or be touched by a defender before it enters the circle.",
};
