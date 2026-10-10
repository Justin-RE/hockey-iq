---
name: release
description: Cut a HockeyIQ release - choose the semver bump, update CHANGELOG.md and package.json, tag, and publish a GitHub Release that triggers the production deploy approval. Use when the user asks to release, ship, tag a version, or promote to production.
disable-model-invocation: true
---

# Release

## Checklist

```
- [ ] 1. Confirm main is green: gh run list --branch main --limit 3
- [ ] 2. Confirm staging is healthy: curl -fsS https://<staging-host>/api/health
- [ ] 3. Choose the bump from commits since the last tag
- [ ] 4. Update CHANGELOG.md and package.json version on a release branch, open a PR, merge it
- [ ] 5. Tag and publish the GitHub Release from main
- [ ] 6. Approve the "production" environment in the Deploy workflow and watch it finish
- [ ] 7. Verify prod /api/health and the Sentry release has no new errors
```

## Step 3: choosing the bump

List commits: `git log $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..origin/main --oneline`

- Any `feat!:` or `BREAKING CHANGE` (including a destructive migration): **major**
- Any `feat:` (new scenario, new page): **minor**
- Only `fix:`, `chore:`, `docs:`, `deps:`: **patch**

## Step 4: changelog entry format

Add at the top of `CHANGELOG.md` under `## [Unreleased]`, then rename it:

```markdown
## [0.3.0] - 2026-10-20

### Added

- Scenario: Long corner positioning (`long-corner-setup`)

### Fixed

- Feedback panel no longer overlaps the pitch on small screens
```

Branch `release/vX.Y.Z`, commit `chore(release): vX.Y.Z`, then `pnpm version X.Y.Z --no-git-tag-version`.

## Step 5: tag and publish

```bash
git checkout main && git pull
gh release create vX.Y.Z --title "vX.Y.Z" --notes-file <(sed -n '/## \[X.Y.Z\]/,/## \[/p' CHANGELOG.md | sed '$d')
```

## Rollback

If prod is unhealthy after deploy, follow `docs/runbooks/deploy-and-rollback.md`. Do not hotfix directly on main.

## Notes

- Production deploys only run when the repo variable `PRODUCTION_ENABLED` is `true`. If it isn't set yet, the release is still tagged and published, and production is deployed later with `gh workflow run deploy.yml -f environment=production -f image_tag=<release commit SHA>`.
- The release commit's image must already exist in ECR (built when it merged to `main`). The deploy fails fast with "Check the image exists" otherwise.
