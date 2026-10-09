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
docker compose up -d db       # local Postgres on :5434
pnpm db:migrate               # apply migrations
pnpm dev                      # http://localhost:3000
```

## Scripts

| Command                                        | What it does                                       |
| ---------------------------------------------- | -------------------------------------------------- |
| `pnpm dev`                                     | Next.js dev server                                 |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | Static checks                                      |
| `pnpm test`                                    | Vitest unit tests                                  |
| `pnpm e2e`                                     | Playwright end-to-end tests (needs the DB running) |
| `pnpm db:migrate`                              | Create/apply Prisma migrations in dev              |
| `pnpm --filter infra synth`                    | Synthesize the AWS CDK stacks                      |

## CI and the container image

Every PR runs `.github/workflows/ci.yml`: **verify** (format, lint, typecheck, unit tests, `pnpm audit`), **e2e** (Playwright against a Postgres service), and **docker** (build the image and hit `/api/health`). CodeQL runs on PRs and weekly; Dependabot opens grouped update PRs every Monday. Bugbot follows `.cursor/BUGBOT.md`.

Build and run the production image locally:

```bash
docker build -t hockey-iq:local .
# Migrations run as a one-off command in the same image
docker run --rm -e DATABASE_URL=postgresql://hockey:hockey@host.docker.internal:5434/hockey_iq \
  hockey-iq:local sh -c "cd /app/migrate && node_modules/.bin/prisma migrate deploy"
docker run --rm -p 3000:3000 -e DATABASE_URL=postgresql://hockey:hockey@host.docker.internal:5434/hockey_iq \
  -e SESSION_PASSWORD=local-only-session-password-change-me -e COOKIE_SECURE=false hockey-iq:local
```

`/api/health` is the load balancer check; `/api/health?deep=1` also checks the database.

## Working in Cursor

Project rules live in `.cursor/rules/`, skills in `.cursor/skills/`, hooks in `.cursor/hooks.json`, and the project MCP config (read-only local Postgres) in `.cursor/mcp.json`. Start with `AGENTS.md`.
