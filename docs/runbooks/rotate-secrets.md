# Runbook: rotate secrets

What exists, where it lives, and how to rotate it. ECS tasks read secrets **only when they start**, so every rotation ends with a forced redeploy.

| Secret                   | Where                                           | Rotate                                 |
| ------------------------ | ----------------------------------------------- | -------------------------------------- |
| Database master password | Secrets Manager `hockey-iq/<env>/db`            | quarterly, and on suspected compromise |
| Session cookie password  | Secrets Manager `hockey-iq/<env>/session`       | quarterly, and on suspected compromise |
| Sentry DSN               | GitHub variable `SENTRY_DSN` (public by design) | only if abused (spam events)           |
| AWS access for CI        | none: GitHub OIDC, 1-hour sessions              | nothing to rotate                      |
| Your AWS access          | IAM Identity Center SSO sessions                | MFA on; sessions expire on their own   |

```bash
export AWS_PROFILE=hockey-iq ENV=staging   # or production
```

## Database password

There is a short window where running tasks can't open new connections. Do it in a quiet period.

```bash
SECRET=hockey-iq/$ENV/db
NEW=$(aws secretsmanager get-random-password --exclude-punctuation --password-length 32 --query RandomPassword --output text)

aws rds modify-db-instance --db-instance-identifier hockey-iq-$ENV --master-user-password "$NEW" --apply-immediately
aws secretsmanager put-secret-value --secret-id "$SECRET" \
  --secret-string "$(aws secretsmanager get-secret-value --secret-id "$SECRET" --query SecretString --output text | jq --arg p "$NEW" '.password = $p')"
unset NEW

aws ecs update-service --cluster hockey-iq-$ENV --service hockey-iq-$ENV-app --force-new-deployment
aws ecs wait services-stable --cluster hockey-iq-$ENV --services hockey-iq-$ENV-app
curl -fsS "https://<cloudfront-domain>/api/health?deep=1"
```

The migration task reads the secret on its next run, so it needs nothing extra.

Later improvement: Secrets Manager managed rotation (`database.addRotationSingleUser()`) once the VPC has a Secrets Manager endpoint or NAT.

## Session password

Rotating it **signs everyone out** (existing cookies can no longer be decrypted). Players just sign in again.

```bash
aws secretsmanager put-secret-value --secret-id hockey-iq/$ENV/session \
  --secret-string "$(aws secretsmanager get-random-password --exclude-punctuation --password-length 64 --query RandomPassword --output text)"
aws ecs update-service --cluster hockey-iq-$ENV --service hockey-iq-$ENV-app --force-new-deployment
```

Later improvement: iron-session accepts a map of passwords (`{ 2: new, 1: old }`), which would allow rotation without signing anyone out.

## Sentry DSN

In Sentry, go to **Settings → Client Keys**, create a new key, and disable the old one. Then:

```bash
gh variable set SENTRY_DSN --body "<new dsn>"
gh workflow run deploy.yml -f environment=staging
```

## After a suspected compromise

1. Rotate the database and session passwords (above), in both environments if unsure.
2. CloudTrail → Event history: look for unexpected `GetSecretValue`, `AssumeRoleWithWebIdentity`, or IAM changes.
3. GitHub → Settings → Security log and Actions runs: look for unexpected workflow runs or environment approvals.
4. Follow `docs/runbooks/incident-response.md` (SEV1 if personal data may be involved).
