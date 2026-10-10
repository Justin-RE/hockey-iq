# Maintenance schedule

Small, regular upkeep keeps upgrades boring. Each item links to the doc that explains how.

## Weekly (Monday, ~30 minutes)

- [ ] Merge Dependabot PRs once CI is green (grouped minor/patch npm, Actions, Docker). Majors of Next.js, Prisma, Phaser, and the Node base image are ignored on purpose; plan them quarterly.
- [ ] Sentry: triage new issues (fix, ignore with a reason, or open a GitHub issue).
- [ ] GitHub → Security: Dependabot alerts, code scanning, and secret scanning are all empty or triaged.
- [ ] Check any alarm emails from the week. A noisy alarm gets tuned, not ignored.

## Monthly (first Monday)

- [ ] Restore test on staging: `docs/runbooks/database-restore.md`. Log it below.
- [ ] AWS Cost Explorer: spend is in line with the budget. Look for leftovers (restored instances, old snapshots).
- [ ] `pnpm outdated` to see which majors are coming. Note any with security fixes.
- [ ] IAM Access Analyzer: no unused or public access findings.
- [ ] Cut a release if `main` has unreleased changes (the `release` skill in `.cursor/skills/release/`).

## Quarterly

- [ ] Rotate the database and session passwords: `docs/runbooks/rotate-secrets.md`.
- [ ] Plan one major upgrade (Node LTS, Next.js, Prisma, Phaser, CDK) on its own branch.
- [ ] Reread the ADRs and runbooks. Update anything that's no longer true.
- [ ] Game day: run one incident scenario on staging (kill the task, break a deploy and roll back) using `docs/runbooks/incident-response.md`.

## Yearly

- [ ] Review the privacy posture (COPPA): data collected, Sentry settings (ADR 0007), the privacy page.
- [ ] Review the AWS account: root MFA, SSO users, budget threshold.

## Releases

Semantic versioning, with a `CHANGELOG.md` entry per release and a GitHub Release that triggers the production deploy (with approval). Follow the `release` skill: in Cursor's agent chat, type `/release`.

## Log

| Date | Task | Result / notes |
| ---- | ---- | -------------- |
|      |      |                |
