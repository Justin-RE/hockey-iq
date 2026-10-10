import { CfnOutput, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";
import { DB_NAME, REGION, type EnvConfig } from "./config";

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

    new CfnOutput(this, "DatabaseEndpoint", { value: this.database.dbInstanceEndpointAddress });
  }
}
