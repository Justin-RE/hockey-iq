# Runbook: deploy and roll back

## How a release flows

1. A PR merges to `main` (CI must pass).
2. `.github/workflows/deploy.yml` builds the image once, tags it with the commit SHA, and pushes it to ECR (tags are immutable).
3. **Staging** (`deploy-environment.yml`):
   1. `cdk deploy HockeyIq-Staging-Platform HockeyIq-Staging-Migrate`. The Platform stack is usually a no-op; Migrate registers a task definition for the new image.
   2. `infra/scripts/run-migration.sh` runs `prisma migrate deploy` as a one-off Fargate task and fails the deploy if it exits non-zero.
   3. `cdk deploy HockeyIq-Staging-App` rolls the web service. The ECS circuit breaker rolls back automatically if new tasks fail health checks.
   4. Smoke test: `GET <url>/api/health?deep=1` must report the new `version` and `database: ok`.
4. **Production** runs the same steps with the same image, only when the repo variable `PRODUCTION_ENABLED` is `true`, and only after a required reviewer approves the `production` environment in GitHub.

Watch it: GitHub → Actions → Deploy. The deployed URL is linked on the run summary.

## Migrations must be backward compatible

The migration runs before the new code is live, and a rollback leaves the schema in place. So every migration must work with both the old and new code (expand, then contract):

- Add columns as nullable or with a default. Backfill in the same migration if it is small.
- Rename = add new column, ship code that writes both, backfill, ship code that reads new, drop old later.
- Never drop or rename a column that the currently deployed code reads.

## Roll back the app

1. Find the last good image tag: the SHA of the previous successful Deploy run, or `aws ecr describe-images --repository-name hockey-iq --query 'sort_by(imageDetails,&imagePushedAt)[-5:].imageTags'`.
2. GitHub → Actions → Deploy → **Run workflow**: environment = `staging` or `production`, image_tag = that SHA.
3. The workflow skips the build, reruns the (no-op) migration, redeploys the old image, and smoke-tests it.

CLI equivalent:

```bash
gh workflow run deploy.yml -f environment=staging -f image_tag=<sha>
gh run watch
```

If a broken deploy is still rolling, ECS's circuit breaker usually rolls back on its own. Check the service events: `aws ecs describe-services --cluster hockey-iq-staging --services hockey-iq-staging-app --query 'services[0].events[:10]'`.

## Roll back a migration

Prisma migrations are forward-only. Write a new migration that reverses the change, merge it, and let it deploy. For data loss, follow the database restore runbook (point-in-time restore from RDS automated backups).

## First-time setup

See `docs/setup/aws-account.md`.
