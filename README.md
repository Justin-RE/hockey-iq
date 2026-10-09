# HockeyIQ

A 2D field hockey scenario trainer. Simple avatars act out common girls' field hockey situations; you pick what to do and learn why.

- Product: [docs/PRD.md](docs/PRD.md)
- Architecture: [docs/architecture.md](docs/architecture.md) and [docs/adr/](docs/adr/)
- Operations: [docs/runbooks/](docs/runbooks/)

## Local development

Requirements: Node 22+, pnpm 10, Docker.

```bash
pnpm install
cp .env.example .env          # then fill in SESSION_PASSWORD
docker compose up -d db       # local Postgres on :5432
pnpm db:migrate               # apply migrations
pnpm dev                      # http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | Static checks |
| `pnpm test` | Vitest unit tests |
| `pnpm e2e` | Playwright end-to-end tests (needs the DB running) |
| `pnpm db:migrate` | Create/apply Prisma migrations in dev |
| `pnpm --filter infra synth` | Synthesize the AWS CDK stacks |

## Working in Cursor

Project rules live in `.cursor/rules/`, skills in `.cursor/skills/`, hooks in `.cursor/hooks.json`, and the project MCP config (read-only local Postgres) in `.cursor/mcp.json`. Start with `AGENTS.md`.
