# Runbook: database restore

Targets from the PRD: restore within **4 hours** (RTO), lose at most **24 hours** of data (RPO). RDS point-in-time recovery (PITR) does much better than that: any second within the backup retention window (7 days in staging, 14 in production), usually up to about 5 minutes ago.

Restores always create a **new** instance. The live, CDK-managed instance is never overwritten. Then you either copy data back (partial loss) or switch the app to a snapshot-based instance (total loss).

Set these first:

```bash
export AWS_PROFILE=hockey-iq ENV=staging STACK=HockeyIq-Staging   # or production / HockeyIq-Production
export SRC=hockey-iq-$ENV
export RESTORED=$SRC-restore-$(date -u +%Y%m%d%H%M)
```

## 1. Restore to a point in time

Pick a time just before the bad change (UTC, from logs or the incident timeline).

```bash
read -r SUBNET_GROUP SG PARAMS <<<"$(aws rds describe-db-instances --db-instance-identifier "$SRC" \
  --query 'DBInstances[0].[DBSubnetGroup.DBSubnetGroupName, VpcSecurityGroups[0].VpcSecurityGroupId, DBParameterGroups[0].DBParameterGroupName]' --output text)"

aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier "$SRC" \
  --target-db-instance-identifier "$RESTORED" \
  --restore-time 2026-10-20T14:05:00Z \
  --db-subnet-group-name "$SUBNET_GROUP" \
  --vpc-security-group-ids "$SG" \
  --db-parameter-group-name "$PARAMS" \
  --no-publicly-accessible --no-multi-az

aws rds wait db-instance-available --db-instance-identifier "$RESTORED"   # 10-20 minutes
```

The restored instance uses the same security group, so only tasks with the `hockey-iq-<env>-db-client` group can reach it, and the same master password (from the `hockey-iq/<env>/db` secret).

## 2. Inspect it

The database sits in isolated subnets with no bastion host, so run `psql` as a one-off Fargate task. The task uses the migration task's network settings and the `postgres:17-alpine` image. The password comes from the existing database secret through an inline task definition.

```bash
OUT=$(aws cloudformation describe-stacks --stack-name "$STACK-Migrate" --query 'Stacks[0].Outputs')
get() { jq -r --arg k "$1" '.[] | select(.OutputKey==$k) | .OutputValue' <<<"$OUT"; }
HOST=$(aws rds describe-db-instances --db-instance-identifier "$RESTORED" --query 'DBInstances[0].Endpoint.Address' --output text)
echo "cluster=$(get ClusterArn) subnets=$(get Subnets) sgs=$(get SecurityGroups) host=$HOST"
```

Register a throwaway task definition `hockey-iq-$ENV-psql`:

- image `postgres:17-alpine`
- command `psql "host=$HOST dbname=hockey_iq user=hockey sslmode=require" -c 'select count(*) from "User"; select max("createdAt") from "Attempt";'`
- secret `PGPASSWORD` from the `hockey-iq/<env>/db` secret, `password` key
- execution role `hockey-iq-<env>-migrate-exec`

Run it with the network values above, then read the output in CloudWatch Logs. Delete the task definition afterwards.

## 3a. Partial loss: copy rows back

If only some rows were deleted or corrupted, dump them from the restored instance and load them into the live one. Use the same one-off task pattern with `pg_dump --data-only --table=...` piped to `psql` on the live host. Do it inside a transaction, and stop the app first (`desiredCount` 0) if writes could conflict.

## 3b. Total loss: switch to a restored instance

1. Take a final snapshot of the restored instance: `aws rds create-db-snapshot --db-instance-identifier "$RESTORED" --db-snapshot-identifier "$RESTORED-final"`.
2. In `infra/lib/platform-stack.ts`, change the database to `rds.DatabaseInstanceFromSnapshot` with `snapshotIdentifier: "<snapshot>"` and the same props. Open a PR, merge it, and let the pipeline replace the instance. The app reconnects to the new endpoint on its next deploy.
3. Confirm with `/api/health?deep=1` and the Step 2 queries.

## 4. Clean up

```bash
aws rds delete-db-instance --db-instance-identifier "$RESTORED" --skip-final-snapshot
```

Restored instances cost the same as the source while they run. Don't leave them up.

## Monthly restore test

Restore staging to "one hour ago" (step 1), run the step 2 count query, compare it with the live database, and clean up (step 4). Record the date, the time taken, and anything that didn't work in `docs/maintenance.md`'s log. A backup you've never restored is not a backup.
