import { Duration } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";

export const APP_NAME = "hockey-iq";
export const REGION = "us-east-1";
export const GITHUB_REPO = "Justin-RE/hockey-iq";
export const ECR_REPOSITORY_NAME = APP_NAME;
export const DB_NAME = "hockey_iq";
export const CONTAINER_PORT = 3000;
/** SSM String parameter with the operator's email for budget and alarm notifications. */
export const ALERT_EMAIL_PARAMETER = `/${APP_NAME}/alert-email`;

export type EnvName = "staging" | "production";

export interface EnvConfig {
  envName: EnvName;
  /** Prefix for physical names, e.g. `hockey-iq-staging`. CI IAM policies are scoped to it. */
  prefix: string;
  /** NAT gateways cost ~$33/month each; staging runs tasks in public subnets instead. */
  natGateways: number;
  task: { cpu: number; memoryMiB: number; desiredCount: number };
  db: {
    instanceType: ec2.InstanceType;
    multiAz: boolean;
    allocatedStorageGiB: number;
    maxAllocatedStorageGiB: number;
    backupRetention: Duration;
    deletionProtection: boolean;
  };
  logRetention: logs.RetentionDays;
}

export const ENVIRONMENTS: Record<EnvName, EnvConfig> = {
  staging: {
    envName: "staging",
    prefix: `${APP_NAME}-staging`,
    natGateways: 0,
    task: { cpu: 256, memoryMiB: 512, desiredCount: 1 },
    db: {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      multiAz: false,
      allocatedStorageGiB: 20,
      maxAllocatedStorageGiB: 50,
      backupRetention: Duration.days(7),
      deletionProtection: false,
    },
    logRetention: logs.RetentionDays.ONE_MONTH,
  },
  production: {
    envName: "production",
    prefix: `${APP_NAME}-production`,
    natGateways: 1,
    task: { cpu: 512, memoryMiB: 1024, desiredCount: 2 },
    db: {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL),
      multiAz: true,
      allocatedStorageGiB: 20,
      maxAllocatedStorageGiB: 100,
      backupRetention: Duration.days(14),
      deletionProtection: true,
    },
    logRetention: logs.RetentionDays.THREE_MONTHS,
  },
};

/** Stack names are referenced by the deploy workflow; keep them stable. */
export function stackName(env: EnvName | "shared", part: string): string {
  const envPart = env === "shared" ? "Shared" : env === "staging" ? "Staging" : "Production";
  return `HockeyIq-${envPart}-${part}`;
}
