#!/usr/bin/env bash
# Runs the one-off Prisma migration task and fails if it does not exit 0.
# Usage: run-migration.sh <cdk outputs json> <migrate stack name>
set -euo pipefail

outputs_file="$1"
stack="$2"
get() { jq -er --arg s "$stack" --arg k "$1" '.[$s][$k]' "$outputs_file"; }

cluster=$(get ClusterArn)
task_definition=$(get TaskDefinitionArn)
container=$(get ContainerName)
subnets=$(get Subnets)
security_groups=$(get SecurityGroups)
assign_public_ip=$(get AssignPublicIp)
log_group=$(get LogGroupName)

echo "Starting migration task ${task_definition##*/}"
task_arn=$(aws ecs run-task \
  --cluster "$cluster" \
  --task-definition "$task_definition" \
  --launch-type FARGATE \
  --started-by github-deploy \
  --network-configuration "awsvpcConfiguration={subnets=[$subnets],securityGroups=[$security_groups],assignPublicIp=$assign_public_ip}" \
  --query 'tasks[0].taskArn' --output text)

if [[ -z "$task_arn" || "$task_arn" == "None" ]]; then
  echo "::error::ECS did not start the migration task"
  exit 1
fi

aws ecs wait tasks-stopped --cluster "$cluster" --tasks "$task_arn"

exit_code=$(aws ecs describe-tasks --cluster "$cluster" --tasks "$task_arn" \
  --query "tasks[0].containers[?name=='$container'].exitCode | [0]" --output text)
stopped_reason=$(aws ecs describe-tasks --cluster "$cluster" --tasks "$task_arn" \
  --query 'tasks[0].stoppedReason' --output text)

echo "::group::Migration logs"
aws logs get-log-events \
  --log-group-name "$log_group" \
  --log-stream-name "migrate/$container/${task_arn##*/}" \
  --start-from-head --query 'events[].message' --output text || true
echo "::endgroup::"

if [[ "$exit_code" != "0" ]]; then
  echo "::error::Migration failed (exit code: $exit_code, reason: $stopped_reason)"
  exit 1
fi
echo "Migration finished"
