import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";
import type { PlatformStack } from "./platform-stack";
import { databaseEnvironment, logGroupName, releaseImage } from "./task-config";

export interface MigrateStackProps extends StackProps {
  platform: PlatformStack;
  imageTag: string;
}

export const MIGRATE_CONTAINER = "migrate";

/**
 * One-off ECS task that runs `prisma migrate deploy` with the release image.
 * The deploy workflow runs it after this stack updates and before the App stack.
 */
export class MigrateStack extends Stack {
  constructor(scope: Construct, id: string, props: MigrateStackProps) {
    super(scope, id, props);
    const { platform, imageTag } = props;
    const { prefix } = platform.config;

    // Named roles so the CI role's iam:PassRole can be scoped to `${prefix}-migrate-*`.
    const executionRole = new iam.Role(this, "ExecutionRole", {
      roleName: `${prefix}-migrate-exec`,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    const taskRole = new iam.Role(this, "TaskRole", {
      roleName: `${prefix}-migrate-task`,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDefinition", {
      family: `${prefix}-migrate`,
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole,
      taskRole,
    });

    const { environment, secrets } = databaseEnvironment(platform, imageTag);
    const logGroup = new logs.LogGroup(this, "Logs", {
      logGroupName: logGroupName(platform, "migrate"),
      retention: platform.config.logRetention,
    });
    taskDefinition.addContainer(MIGRATE_CONTAINER, {
      image: releaseImage(this, imageTag),
      command: ["sh", "-c", "cd /app/migrate && node_modules/.bin/prisma migrate deploy"],
      environment: { ...environment, DB_SSLMODE: "require" },
      secrets,
      logging: ecs.LogDrivers.awsLogs({ logGroup, streamPrefix: "migrate" }),
    });

    const securityGroup = new ec2.SecurityGroup(this, "Sg", {
      vpc: platform.vpc,
      securityGroupName: `${prefix}-migrate`,
      description: "Migration task (egress only)",
    });

    const subnetIds = platform.vpc.selectSubnets(platform.taskSubnets).subnetIds;
    const outputs: Record<string, string> = {
      ClusterArn: platform.cluster.clusterArn,
      TaskDefinitionArn: taskDefinition.taskDefinitionArn,
      ContainerName: MIGRATE_CONTAINER,
      Subnets: subnetIds.join(","),
      SecurityGroups: [
        securityGroup.securityGroupId,
        platform.databaseClientSecurityGroup.securityGroupId,
      ].join(","),
      AssignPublicIp: platform.assignPublicIp ? "ENABLED" : "DISABLED",
      LogGroupName: logGroup.logGroupName,
    };
    for (const [key, value] of Object.entries(outputs)) new CfnOutput(this, key, { value });
  }
}
