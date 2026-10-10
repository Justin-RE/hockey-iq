import { CfnOutput, Duration, Stack, type StackProps } from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";
import { CONTAINER_PORT } from "./config";
import type { PlatformStack } from "./platform-stack";
import { databaseEnvironment, logGroupName, releaseImage } from "./task-config";

export interface AppStackProps extends StackProps {
  platform: PlatformStack;
  imageTag: string;
}

/**
 * The web tier: Fargate service behind an internal ALB, published through
 * CloudFront. The ALB has no public address; CloudFront reaches it as a VPC
 * origin, and CloudFront's default certificate provides HTTPS (ADR 0006).
 */
export class AppStack extends Stack {
  readonly url: string;

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);
    const { platform, imageTag } = props;
    const { config, vpc } = platform;

    const albSg = new ec2.SecurityGroup(this, "AlbSg", {
      vpc,
      securityGroupName: `${config.prefix}-alb`,
      description: "Internal ALB, reachable only from CloudFront",
      allowAllOutbound: false,
    });
    const cloudFrontOriginFacing = ec2.PrefixList.fromLookup(this, "CloudFrontPrefixList", {
      prefixListName: "com.amazonaws.global.cloudfront.origin-facing",
    });
    albSg.addIngressRule(
      ec2.Peer.prefixList(cloudFrontOriginFacing.prefixListId),
      ec2.Port.tcp(80),
      "CloudFront VPC origin",
    );

    const serviceSg = new ec2.SecurityGroup(this, "ServiceSg", {
      vpc,
      securityGroupName: `${config.prefix}-app`,
      description: "Web tasks",
    });
    serviceSg.addIngressRule(albSg, ec2.Port.tcp(CONTAINER_PORT), "From the ALB");
    albSg.addEgressRule(serviceSg, ec2.Port.tcp(CONTAINER_PORT), "To web tasks");

    const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDefinition", {
      family: `${config.prefix}-app`,
      cpu: config.task.cpu,
      memoryLimitMiB: config.task.memoryMiB,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });
    const { environment, secrets } = databaseEnvironment(platform, imageTag);
    taskDefinition.addContainer("app", {
      image: releaseImage(this, imageTag),
      environment,
      secrets: {
        ...secrets,
        SESSION_PASSWORD: ecs.Secret.fromSecretsManager(platform.sessionSecret),
      },
      portMappings: [{ containerPort: CONTAINER_PORT }],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "app",
        logGroup: new logs.LogGroup(this, "Logs", {
          logGroupName: logGroupName(platform, "app"),
          retention: config.logRetention,
        }),
      }),
    });

    // Immutable import: the ALB target wiring must not add rules to a Platform-stack group.
    const databaseClientSg = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      "DatabaseClientSg",
      platform.databaseClientSecurityGroup.securityGroupId,
      { mutable: false },
    );
    const service = new ecs.FargateService(this, "Service", {
      serviceName: `${config.prefix}-app`,
      cluster: platform.cluster,
      taskDefinition,
      desiredCount: config.task.desiredCount,
      vpcSubnets: platform.taskSubnets,
      assignPublicIp: platform.assignPublicIp,
      securityGroups: [serviceSg, databaseClientSg],
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      circuitBreaker: { enable: true, rollback: true },
      healthCheckGracePeriod: Duration.seconds(60),
      propagateTags: ecs.PropagatedTagSource.SERVICE,
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, "Alb", {
      loadBalancerName: `${config.prefix}-alb`,
      vpc,
      internetFacing: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroup: albSg,
      dropInvalidHeaderFields: true,
    });
    const listener = alb.addListener("Http", {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      open: false,
    });
    listener.addTargets("App", {
      port: CONTAINER_PORT,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      deregistrationDelay: Duration.seconds(15),
      healthCheck: {
        path: "/api/health",
        interval: Duration.seconds(15),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    const origin = origins.VpcOrigin.withApplicationLoadBalancer(alb, {
      vpcOriginName: config.prefix,
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      httpPort: 80,
    });
    const distribution = new cloudfront.Distribution(this, "Cdn", {
      comment: `${config.prefix} web`,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      defaultBehavior: {
        origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        // Forwards Host (Server Actions compare it with Origin) and CloudFront-Viewer-Address
        // (used for rate limiting).
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_AND_CLOUDFRONT_2022,
      },
      additionalBehaviors: {
        "/_next/static/*": {
          origin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
      },
    });

    this.url = `https://${distribution.distributionDomainName}`;
    new CfnOutput(this, "Url", { value: this.url });
    new CfnOutput(this, "ServiceName", { value: service.serviceName });
  }
}
