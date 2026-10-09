import type { Scenario } from "@/game/engine";

export const sixteenYardHitOutlet: Scenario = {
  slug: "sixteen-yard-hit-outlet",
  title: "16-yard hit: the safe outlet",
  category: "defense",
  difficulty: 2,
  summary:
    "You're restarting play near your own goal while opponents press. Where does the ball go?",
  description:
    "An opponent hit the ball over your backline, so your team restarts with a free hit about 16 yards out from your goal on the left. You have the ball near the top sideline. A teammate is open along the sideline. Your center midfielder is in the middle but closely marked, and two opponents are pressing in front of you.",
  prompt: "You're taking the 16-yard hit. Where is the safest place to send the ball?",
  avatars: [
    { id: "you", team: "home", number: 2, role: "Back", position: { x: 15, y: 14 }, isYou: true },
    { id: "wing", team: "home", number: 7, role: "Mid", position: { x: 26, y: 4 } },
    { id: "cm", team: "home", number: 8, role: "Mid", position: { x: 30, y: 30 } },
    { id: "gk", team: "home", number: 1, role: "GK", position: { x: 1, y: 30 } },
    { id: "f1", team: "away", number: 9, role: "Forward", position: { x: 21, y: 18 } },
    { id: "f2", team: "away", number: 10, role: "Forward", position: { x: 25, y: 26 } },
    { id: "m1", team: "away", number: 6, role: "Mid", position: { x: 31, y: 32 } },
  ],
  ball: { x: 15, y: 14.5 },
  choices: [
    {
      id: "wide-outlet",
      label: "Pass up the sideline to your open teammate",
      correct: true,
      feedback:
        "Yes. The ball moves away from your goal and away from the pressure. If it goes wrong near the sideline, there's no shot on your goal.",
      moves: [
        { target: "ball", to: { x: 29, y: 4.5 }, step: 0 },
        { target: "wing", to: { x: 29, y: 4 }, step: 0 },
        { target: "f1", to: { x: 22, y: 12 }, step: 0 },
        { target: "wing", to: { x: 40, y: 5 }, step: 1 },
        { target: "ball", to: { x: 40.5, y: 5.5 }, step: 1 },
      ],
    },
    {
      id: "cross-field",
      label: "Hit it hard across the middle to your center midfielder",
      correct: false,
      feedback:
        "The pass crosses the front of your own goal, and the marker steps in to intercept. Now an opponent has the ball 20 yards from your goal.",
      moves: [
        { target: "ball", to: { x: 27, y: 27 }, step: 0 },
        { target: "f2", to: { x: 27, y: 27 }, step: 0 },
        { target: "f2", to: { x: 14, y: 29 }, step: 1 },
        { target: "ball", to: { x: 13.5, y: 29 }, step: 1 },
      ],
    },
    {
      id: "dribble-middle",
      label: "Dribble straight up the middle yourself",
      correct: false,
      feedback:
        "Two opponents are waiting there. You get tackled close to your own circle, the most dangerous place to lose the ball.",
      moves: [
        { target: "you", to: { x: 20, y: 20 }, step: 0 },
        { target: "ball", to: { x: 20.5, y: 20 }, step: 0 },
        { target: "f1", to: { x: 21, y: 20 }, step: 0 },
        { target: "ball", to: { x: 17, y: 24 }, step: 1 },
        { target: "f1", to: { x: 16.5, y: 24 }, step: 1 },
      ],
    },
  ],
  explanation:
    "When the attacking team puts the ball over your backline, you restart with a free hit up to 16 yards (15 m) from the backline, in line with where it went out. Opponents must be 5 yards away. Passes across the front of your own goal are the riskiest in the game. Playing wide keeps any mistake far from your goal.",
};
