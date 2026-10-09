# 5. Scenarios are typed data in the repo

Date: 2026-10-09. Status: accepted.

## Context

Scenarios could live in the database (editable at runtime) or in the repository (reviewed via PRs).

## Decision

Store scenarios as TypeScript data files in `src/scenarios/`, validated by a Zod schema in a unit test. The database stores only users and attempts, referencing scenarios by slug.

## Consequences

- Every content change is reviewed, tested, and versioned like code. Good for accuracy of rules content.
- Publishing a scenario requires a deploy. Acceptable at MVP scale.
- Slugs are permanent once released; removing a scenario must keep its slug reserved so old attempts stay meaningful.
