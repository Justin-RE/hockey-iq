# 4. Nickname accounts with iron-session instead of Auth.js

Date: 2026-10-09. Status: accepted. Supersedes the "Auth.js" line in the original plan.

## Context

Players may be under 13 (see PRD, COPPA). Auth.js would push us toward email magic links or OAuth providers, both of which collect personal information and require third-party accounts children may not have. Auth.js v5 is also still in beta, and this app uses Next.js 16 Cache Components, where the Next.js docs show iron-session as the reference pattern.

## Decision

- Accounts are optional and consist of a nickname and password only.
- Passwords are hashed with Node's built-in `scrypt` (random salt, constant-time comparison). No native dependencies.
- Sessions are iron-session encrypted, `httpOnly`, `secure`, `sameSite=lax` cookies holding only the user id.
- Session reads happen behind `<Suspense>` boundaries per the Cache Components guidance.

## Consequences

- No password reset by email. Users who forget their password create a new account (acceptable: progress is low-value data). Revisit if coach accounts are added.
- Rate limiting on login is required (implemented in-process for MVP; move to a shared store if we run more than a few tasks).
