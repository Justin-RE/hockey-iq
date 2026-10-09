import type { Scenario } from "@/game/engine";

export const pcDefenseFirstRunner: Scenario = {
  slug: "pc-defense-first-runner",
  title: "Penalty corner defense: first runner",
  category: "set-piece",
  difficulty: 2,
  summary: "The other team has a penalty corner. You're the first runner. Where do you go?",
  description:
    "Your team is defending a penalty corner at your own goal on the left. Four defenders and your goalkeeper stand behind the backline. An opponent is ready to push the ball out from the backline to a teammate waiting at the top of the circle, with two more attackers beside her.",
  prompt: "You're the first runner. When the ball is pushed out, where do you sprint?",
  avatars: [
    { id: "you", team: "home", number: 5, role: "Runner", position: { x: 0, y: 25 }, isYou: true },
    { id: "gk", team: "home", number: 1, role: "GK", position: { x: 0.5, y: 30 } },
    { id: "d2", team: "home", number: 3, role: "Post", position: { x: 0, y: 34 } },
    { id: "d3", team: "home", number: 4, role: "Runner", position: { x: 0, y: 37.5 } },
    { id: "injector", team: "away", number: 7, role: "Injector", position: { x: 0, y: 19 } },
    { id: "stopper", team: "away", number: 10, role: "Shooter", position: { x: 17, y: 30 } },
    { id: "a2", team: "away", number: 8, role: "Attacker", position: { x: 15, y: 23 } },
    { id: "a3", team: "away", number: 11, role: "Attacker", position: { x: 15, y: 37 } },
  ],
  ball: { x: 0, y: 19 },
  choices: [
    {
      id: "pressure-shooter",
      label: "Sprint straight at the shooter at the top of the circle, stick down",
      correct: true,
      feedback:
        "Right. Fast pressure on the shooter rushes her shot or forces a pass, and your stick blocks the shooting lane.",
      moves: [
        { target: "ball", to: { x: 17, y: 30 }, step: 0 },
        { target: "you", to: { x: 13, y: 29.5 }, step: 0 },
        { target: "d3", to: { x: 9, y: 35 }, step: 0 },
        { target: "ball", to: { x: 14, y: 29.6 }, step: 1 },
        { target: "ball", to: { x: 22, y: 42 }, step: 2 },
      ],
    },
    {
      id: "chase-injector",
      label: "Run at the player pushing the ball out to stop the pass",
      correct: false,
      feedback:
        "The ball is already gone by the time you get there, and the shooter at the top of the circle is left completely free.",
      moves: [
        { target: "ball", to: { x: 17, y: 30 }, step: 0 },
        { target: "you", to: { x: 3, y: 20 }, step: 0 },
        { target: "ball", to: { x: 0, y: 31 }, step: 1 },
      ],
    },
    {
      id: "stay-on-line",
      label: "Stay on the goal line next to the goalkeeper",
      correct: false,
      feedback:
        "Staying home gives the shooter all the time she wants to pick her spot. Defenders on the line can't stop a well-placed shot.",
      moves: [
        { target: "ball", to: { x: 17, y: 30 }, step: 0 },
        { target: "you", to: { x: 0.5, y: 28 }, step: 0 },
        { target: "ball", to: { x: 0, y: 28.8 }, step: 1 },
      ],
    },
  ],
  explanation:
    "On a penalty corner, no more than five defenders, including the goalkeeper, may start behind the backline; everyone else waits beyond the center line until the ball is played. The first runner's job is to pressure the top of the circle immediately and take away a clean shot. Other runners cover passes to the side.",
};
