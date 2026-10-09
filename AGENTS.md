# HockeyIQ agent guide

A 2D girls' field hockey scenario trainer. Read `docs/PRD.md` and `docs/architecture.md` first; decisions are in `docs/adr/`.

## Layout

- `src/game/engine/` - pure TypeScript game logic and the scenario schema (no React/Next/Phaser imports)
- `src/game/phaser/` - Phaser 4 renderer, client-only
- `src/scenarios/` - scenario content, one file per scenario
- `src/app/` - Next.js routes; `src/components/` - UI components
- `src/lib/` - server utilities (db, auth, logger, progress)
- `prisma/` - schema and migrations; `e2e/` - Playwright tests; `infra/` - AWS CDK app
- `.cursor/rules/` - always-on and file-scoped rules; `.cursor/skills/` - `add-scenario`, `release`

## Commands

```bash
docker compose up -d db   # local Postgres
pnpm dev                  # app on :3000
pnpm lint && pnpm typecheck && pnpm test   # run before finishing any change
pnpm e2e                  # Playwright (builds and starts the app on :3100)
pnpm db:migrate           # create/apply a migration after editing prisma/schema.prisma
```

## Guardrails

- Agent hooks block reading `.env` files and private keys. Ask the user for non-secret values instead.
- Work on a branch and open a PR; `main` is protected and deploys to staging on merge.
- Children may use this app: follow `.cursor/rules/security.mdc` before adding any data collection.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
