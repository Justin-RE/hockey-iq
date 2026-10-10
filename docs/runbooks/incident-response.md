# Runbook: incident response

An incident is anything that stops players from using HockeyIQ or puts data at risk: an alarm email, a Sentry spike, a report from a coach or parent, or a suspected security problem.

## 1. Acknowledge (first 5 minutes)

- Open a GitHub issue from the **Incident** template (`.github/ISSUE_TEMPLATE/incident.md`) and note the time you started.
- Severity:
  - **SEV1**: site down, data loss, or personal data exposed. Work it now.
  - **SEV2**: a core feature (playing scenarios, saving progress, sign-in) is broken for many players.
  - **SEV3**: degraded or cosmetic. Fix in normal work.

## 2. Look (find what changed)

| Signal                  | Where                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Is it up?               | `curl -s https://<cloudfront-domain>/api/health?deep=1`                                                                |
| Recent deploys          | GitHub → Actions → Deploy (a deploy in the last hour is the first suspect)                                             |
| Alarms                  | CloudWatch → Alarms, filter `hockey-iq-<env>-`                                                                         |
| App errors              | Sentry → Issues, sorted by "Last seen"                                                                                 |
| App logs                | CloudWatch Logs `/hockey-iq/<env>/app`. Logs Insights: `filter level = "error"`                                        |
| Service and task events | `aws ecs describe-services --cluster hockey-iq-<env> --services hockey-iq-<env>-app --query 'services[0].events[:10]'` |
| Database                | RDS → `hockey-iq-<env>` → Monitoring (CPU, connections, free storage)                                                  |

## 3. Mitigate (stop the bleeding before finding root cause)

| Symptom                                        | First move                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Started right after a deploy                   | Roll back: `docs/runbooks/deploy-and-rollback.md`                                                                  |
| `unhealthy-tasks`, tasks restarting            | Read the stopped task's reason in ECS. Usually a bad env var, secret, or DB reachability.                          |
| `db-free-storage`                              | Raise `maxAllocatedStorageGiB` in `infra/lib/config.ts` and deploy                                                 |
| `task-cpu` / `task-memory` sustained           | Raise `task.cpu` / `task.memoryMiB` or `desiredCount` in config and deploy                                         |
| `uptime` but tasks are healthy                 | Check CloudFront (distribution status, recent changes) and the ALB                                                 |
| Suspected personal data exposure or compromise | Treat as SEV1. Rotate secrets (`docs/runbooks/rotate-secrets.md`), preserve logs, then assess notification duties. |

## 4. Recover and close

- Confirm `/api/health?deep=1` is OK and alarms are back to OK (you get an OK email).
- Write the timeline, root cause, and follow-ups in the issue. Blameless: describe what the system allowed, not who slipped.
- Turn each follow-up into an issue. Add a test or alarm so the same failure is caught earlier next time.
