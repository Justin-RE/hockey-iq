# Bugbot review rules for HockeyIQ

Flag these as bugs (high priority):

- Any new field, form input, log line, or third-party script that collects or transmits personal data (email, real name, birthday, location, IP addresses in error reports). Children use this app (COPPA).
- Server Actions or Route Handlers that trust a user id, score, or `correct` flag sent by the client instead of re-reading the session and recomputing on the server.
- `cookies()`, `headers()`, or session reads outside a `<Suspense>` boundary, or inside a plain `'use cache'` function.
- Secrets, session passwords, or connection strings in code, tests, or workflow files (other than the documented local/CI-only placeholders).
- Prisma migrations that would break the currently deployed code (dropping or renaming columns in one step, adding NOT NULL without a backfill).
- Imports of React, Next.js, or Phaser inside `src/game/engine/`.
- Scenario data where rules content is wrong for FIH/NFHS girls' field hockey, or where the `correct` choice contradicts the `explanation`.
- IAM policies in `infra/` with `*` actions on `*` resources.

Don't comment on formatting (Prettier enforces it) or on Tailwind class order.
