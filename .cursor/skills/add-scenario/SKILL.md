---
name: add-scenario
description: Author a new HockeyIQ field hockey scenario (positions, prompt, choices, outcome moves) with its test and registration. Use when the user asks to add, create, or draft a game scenario or situation.
disable-model-invocation: true
---

# Add a scenario

## Checklist

```
- [ ] 1. Confirm the situation, the correct decision, and the rule or principle behind it
- [ ] 2. Pick a permanent kebab-case slug not already in src/scenarios/index.ts
- [ ] 3. Create src/scenarios/<slug>.ts
- [ ] 4. Register it in src/scenarios/index.ts
- [ ] 5. Run pnpm test (schema + invariants run for every scenario)
- [ ] 6. Run pnpm dev and play it at /play/<slug>
```

## Step 3: file template

Follow the coordinate system in `.cursor/rules/game-scenarios.mdc`. Copy an existing file such as `src/scenarios/goal-side-marking.ts` and change:

- `slug`, `title`, `category` (`set-piece` | `defense` | `attack` | `rules`), `difficulty` (1-3)
- `description`: what the picture shows, in plain words
- `prompt`: a question addressed to "you"
- `avatars`: 3-10 players; exactly one with `isYou: true` on the `home` team; `away` goalkeeper near `x: 99, y: 30` if relevant
- `ball`: starting position
- `choices`: 2-4, exactly one `correct: true`; each with `feedback` and `moves`
- `explanation`: the rule or principle, 2-4 sentences, noting FIH vs. NFHS differences if any

Moves animate in order; moves with the same `step` play together:

```ts
moves: [
  { target: "you", to: { x: 22, y: 34 }, step: 0 },
  { target: "ball", to: { x: 40, y: 50 }, step: 1 },
],
```

## Step 5: validation

`src/scenarios/scenarios.test.ts` validates every registered scenario against `ScenarioSchema` and checks invariants (one "you", one correct answer, coordinates on the pitch, move targets exist). Fix any failure before finishing; do not loosen the test.
