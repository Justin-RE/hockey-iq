import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import { addAlarm } from "./alarms";
import { ALERT_EMAIL_PARAMETER, DB_NAME, REGION, type EnvConfig } from "./config";

export interface PlatformStackProps extends StackProps {
  config: EnvConfig;
}

/**
 * Long-lived, stateful resources for one environment. Deploys rarely;
 * application releases only touch the Migrate and App stacks.
 */
export class PlatformStack extends Stack {
  readonly config: EnvConfig;
  readonly vpc: ec2.Vpc;
  readonly cluster: ecs.Cluster;
  readonly database: rds.DatabaseInstance;
  readonly databaseSecret: secretsmanager.ISecret;
  readonly sessionSecret: secretsmanager.Secret;
  /** Attach to any task that needs Postgres; the database only admits this group. */
  readonly databaseClientSecurityGroup: ec2.SecurityGroup;
  /** Subnets for Fargate tasks: public (with public IPs) when there is no NAT gateway. */
  readonly taskSubnets: ec2.SubnetSelection;
  readonly assignPublicIp: boolean;
  /** Email notifications for this environment's alarms. */
  readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: PlatformStackProps) {
    super(scope, id, props);
    const { config } = props;
    this.config = config;

    const subnetConfiguration: ec2.SubnetConfiguration[] = [
      { name: "public", subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
      { name: "isolated", subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
    ];
    if (config.natGateways > 0) {
      subnetConfiguration.push({
        name: "private",
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 24,
      });
    }

    this.vpc = new ec2.Vpc(this, "Vpc", {
      vpcName: config.prefix,
      ipAddresses: ec2.IpAddresses.cidr("10.40.0.0/16"),
      // Explicit AZs keep synth deterministic and avoid an account lookup.
      availabilityZones: [`${REGION}a`, `${REGION}b`],
      natGateways: config.natGateways,
      subnetConfiguration,
    });

    this.assignPublicIp = config.natGateways === 0;
    this.taskSubnets = {
      subnetType: this.assignPublicIp ? ec2.SubnetType.PUBLIC : ec2.SubnetType.PRIVATE_WITH_EGRESS,
    };

    this.databaseClientSecurityGroup = new ec2.SecurityGroup(this, "DatabaseClientSg", {
      vpc: this.vpc,
      securityGroupName: `${config.prefix}-db-client`,
      description: "Tasks allowed to connect to Postgres",
    });
    const databaseSg = new ec2.SecurityGroup(this, "DatabaseSg", {
      vpc: this.vpc,
      securityGroupName: `${config.prefix}-db`,
      description: "Postgres",
      allowAllOutbound: false,
    });
    databaseSg.addIngressRule(
      this.databaseClientSecurityGroup,
      ec2.Port.tcp(5432),
      "Postgres from app and migration tasks",
    );

    const engine = rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.VER_17_9,
    });
    this.database = new rds.DatabaseInstance(this, "Database", {
      engine,
      instanceIdentifier: config.prefix,
      instanceType: config.db.instanceType,
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [databaseSg],
      credentials: rds.Credentials.fromGeneratedSecret("hockey", {
        secretName: `${config.prefix}/db`,
      }),
      databaseName: DB_NAME,
      parameterGroup: new rds.ParameterGroup(this, "DatabaseParams", {
        engine,
        description: `${config.prefix} Postgres parameters`,
        parameters: { "rds.force_ssl": "1" },
      }),
      caCertificate: rds.CaCertificate.RDS_CA_RSA2048_G1,
      multiAz: config.db.multiAz,
      storageType: rds.StorageType.GP3,
      allocatedStorage: config.db.allocatedStorageGiB,
      maxAllocatedStorage: config.db.maxAllocatedStorageGiB,
      storageEncrypted: true,
      backupRetention: config.db.backupRetention,
      preferredBackupWindow: "06:00-07:00",
      preferredMaintenanceWindow: "Sun:07:30-Sun:08:30",
      deleteAutomatedBackups: false,
      deletionProtection: config.db.deletionProtection,
      removalPolicy: RemovalPolicy.SNAPSHOT,
      autoMinorVersionUpgrade: true,
      cloudwatchLogsExports: ["postgresql"],
      cloudwatchLogsRetention: config.logRetention,
    });
    if (!this.database.secret) throw new Error("expected a generated database secret");
    this.databaseSecret = this.database.secret;

    this.sessionSecret = new secretsmanager.Secret(this, "SessionSecret", {
      secretName: `${config.prefix}/session`,
      description: "iron-session cookie encryption password",
      generateSecretString: { passwordLength: 64, excludePunctuation: true },
    });

    this.cluster = new ecs.Cluster(this, "Cluster", {
      clusterName: config.prefix,
      vpc: this.vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    this.alarmTopic = new sns.Topic(this, "Alarms", {
      topicName: `${config.prefix}-alarms`,
      displayName: `HockeyIQ ${config.envName} alarms`,
      enforceSSL: true,
    });
    this.alarmTopic.addSubscription(
      new subscriptions.EmailSubscription(
        ssm.StringParameter.valueForStringParameter(this, ALERT_EMAIL_PARAMETER),
      ),
    );

    addAlarm(this, "db-cpu", config.prefix, this.alarmTopic, {
      description: "Database CPU at or above 80% for 15 minutes.",
      metric: this.database.metricCPUUtilization({ period: Duration.minutes(5) }),
      threshold: 80,
      evaluationPeriods: 3,
    });
    addAlarm(this, "db-free-storage", config.prefix, this.alarmTopic, {
      description: "Database free storage below 2 GiB (autoscaling may be at its maximum).",
      metric: this.database.metricFreeStorageSpace({ period: Duration.minutes(5) }),
      threshold: 2 * 1024 ** 3,
      comparison: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    new CfnOutput(this, "DatabaseEndpoint", { value: this.database.dbInstanceEndpointAddress });
  }
}
