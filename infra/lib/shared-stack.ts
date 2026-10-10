import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as budgets from "aws-cdk-lib/aws-budgets";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import {
  ALERT_EMAIL_PARAMETER,
  APP_NAME,
  ECR_REPOSITORY_NAME,
  ENVIRONMENTS,
  GITHUB_REPO,
  stackName,
  type EnvName,
} from "./config";

export interface SharedStackProps extends StackProps {
  /** Monthly cost alert threshold in USD. */
  monthlyBudgetUsd: number;
}

/**
 * Account-wide resources, deployed by hand with admin SSO credentials:
 * the image repository, GitHub OIDC deploy roles, and the cost budget.
 */
export class SharedStack extends Stack {
  readonly repository: ecr.Repository;
  readonly deployRoles: Record<EnvName, iam.Role>;

  constructor(scope: Construct, id: string, props: SharedStackProps) {
    super(scope, id, props);

    this.repository = new ecr.Repository(this, "Repository", {
      repositoryName: ECR_REPOSITORY_NAME,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      imageScanOnPush: true,
      encryption: ecr.RepositoryEncryption.AES_256,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [{ description: "Keep the last 50 images", maxImageCount: 50 }],
    });

    const github = new iam.OidcProviderNative(this, "GitHubOidc", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
    });

    this.deployRoles = {
      staging: this.deployRole(github, "staging", { canPushImages: true }),
      production: this.deployRole(github, "production", { canPushImages: false }),
    };

    const email = ssm.StringParameter.valueForStringParameter(this, ALERT_EMAIL_PARAMETER);
    const subscribers = [{ subscriptionType: "EMAIL", address: email }];
    new budgets.CfnBudget(this, "MonthlyBudget", {
      budget: {
        budgetName: `${APP_NAME}-monthly`,
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: { amount: props.monthlyBudgetUsd, unit: "USD" },
      },
      notificationsWithSubscribers: [
        { threshold: 80, notificationType: "ACTUAL" },
        { threshold: 100, notificationType: "ACTUAL" },
        { threshold: 100, notificationType: "FORECASTED" },
      ].map(({ threshold, notificationType }) => ({
        notification: {
          comparisonOperator: "GREATER_THAN",
          notificationType,
          threshold,
          thresholdType: "PERCENTAGE",
        },
        subscribers,
      })),
    });
  }

  /**
   * Role assumed by GitHub Actions in one GitHub environment. It can only:
   * hand off to the CDK bootstrap roles, push/read images, and run that
   * environment's migration task.
   */
  private deployRole(
    provider: iam.OidcProviderNative,
    envName: EnvName,
    { canPushImages }: { canPushImages: boolean },
  ): iam.Role {
    const { prefix } = ENVIRONMENTS[envName];
    const { account, region } = this;

    const role = new iam.Role(this, `GitHubDeploy-${envName}`, {
      roleName: `${APP_NAME}-github-${envName}`,
      description: `GitHub Actions deploys for the ${envName} environment`,
      maxSessionDuration: Duration.hours(1),
      assumedBy: new iam.WebIdentityPrincipal(provider.oidcProviderArn, {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": `repo:${GITHUB_REPO}:environment:${envName}`,
        },
      }),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "UseCdkBootstrapRoles",
        actions: ["sts:AssumeRole", "sts:TagSession"],
        resources: [`arn:aws:iam::${account}:role/cdk-hnb659fds-*-${account}-${region}`],
      }),
    );

    this.repository.grantPull(role);
    this.repository.grant(role, "ecr:DescribeImages");
    if (canPushImages) this.repository.grantPush(role);

    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "RunMigrationTask",
        actions: ["ecs:RunTask"],
        resources: [`arn:aws:ecs:${region}:${account}:task-definition/${prefix}-migrate:*`],
        conditions: {
          ArnEquals: { "ecs:cluster": `arn:aws:ecs:${region}:${account}:cluster/${prefix}` },
        },
      }),
    );
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "WatchMigrationTask",
        actions: ["ecs:DescribeTasks"],
        resources: [`arn:aws:ecs:${region}:${account}:task/${prefix}/*`],
      }),
    );
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "PassMigrationRoles",
        actions: ["iam:PassRole"],
        resources: [`arn:aws:iam::${account}:role/${prefix}-migrate-*`],
        conditions: { StringEquals: { "iam:PassedToService": "ecs-tasks.amazonaws.com" } },
      }),
    );
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "ReadMigrationLogs",
        actions: ["logs:GetLogEvents"],
        resources: [
          `arn:aws:logs:${region}:${account}:log-group:/${APP_NAME}/${envName}/migrate:log-stream:*`,
        ],
      }),
    );
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "ReadStackOutputs",
        actions: ["cloudformation:DescribeStacks"],
        resources: [
          `arn:aws:cloudformation:${region}:${account}:stack/${stackName(envName, "*")}/*`,
        ],
      }),
    );

    return role;
  }
}
