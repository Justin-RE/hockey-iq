# 2. Phaser 4 for the pitch, HTML for questions

Date: 2026-10-09. Status: accepted.

## Context

The game needs a top-down pitch with moving avatars and a ball. Options considered:

- SVG + CSS/Framer Motion: accessible and simple, but awkward for timed multi-object animation and future features (trails, camera pans, touch dragging).
- Phaser: mature 2D game framework with tweens, input, and scaling. Phaser 4.2 is the current stable major and keeps the Phaser 3 scene, shape, and tween APIs we need.

## Decision

Use Phaser 4 for the canvas only. Keep prompts, choices, feedback, and explanations as regular HTML so they work with screen readers and keyboard navigation. Phaser is loaded with a dynamic import on the client.

Keep game logic in a framework-free engine module (`src/game/engine`). Phaser only renders what the engine says.

## Consequences

- The engine is unit testable without a browser.
- The canvas is decorative for assistive tech; every scenario must have a text description.
- Phaser adds roughly 1 MB to the play page bundle; it is not loaded on other pages.
