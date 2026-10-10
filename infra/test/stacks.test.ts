import { App, type Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { beforeAll, describe, expect, it } from "vitest";
import { AppStack } from "../lib/app-stack";
import { ENVIRONMENTS, GITHUB_REPO, REGION, type EnvName } from "../lib/config";
import { MigrateStack } from "../lib/migrate-stack";
import { PlatformStack } from "../lib/platform-stack";
import { SharedStack } from "../lib/shared-stack";

const env = { account: "123456789012", region: REGION };

function build() {
  const app = new App();
  const shared = new SharedStack(app, "Shared", {
    env,
    monthlyBudgetUsd: 100,
    budgetEmailParameter: "/hockey-iq/budget-email",
  });
  const stacks = { shared } as Record<string, Stack> & { shared: SharedStack };
  for (const envName of ["staging", "production"] as EnvName[]) {
    const platform = new PlatformStack(app, `${envName}-platform`, {
      env,
      config: ENVIRONMENTS[envName],
    });
    stacks[`${envName}-platform`] = platform;
    stacks[`${envName}-migrate`] = new MigrateStack(app, `${envName}-migrate`, {
      env,
      platform,
      imageTag: "abc123",
    });
    stacks[`${envName}-app`] = new AppStack(app, `${envName}-app`, {
      env,
      platform,
      imageTag: "abc123",
    });
  }
  return stacks;
}

let stacks: ReturnType<typeof build>;
const template = (name: string) => Template.fromStack(stacks[name]);

beforeAll(() => {
  stacks = build();
});

describe("least privilege", () => {
  it("has no IAM statement allowing every action on every resource", () => {
    for (const [name, stack] of Object.entries(stacks)) {
      const policies = Template.fromStack(stack).findResources("AWS::IAM::Policy");
      for (const policy of Object.values(policies)) {
        for (const statement of policy.Properties.PolicyDocument.Statement) {
          const actions = [statement.Action].flat();
          const resources = [statement.Resource].flat();
          expect(
            actions.includes("*") && resources.includes("*"),
            `${name}: ${JSON.stringify(statement)}`,
          ).toBe(false);
        }
      }
    }
  });
});

describe("shared stack", () => {
  it.each(["staging", "production"])("trusts only this repo's %s GitHub environment", (envName) => {
    template("shared").hasResourceProperties("AWS::IAM::Role", {
      RoleName: `hockey-iq-github-${envName}`,
      AssumeRolePolicyDocument: {
        Statement: [
          Match.objectLike({
            Action: "sts:AssumeRoleWithWebIdentity",
            Condition: {
              StringEquals: {
                "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
                "token.actions.githubusercontent.com:sub": `repo:${GITHUB_REPO}:environment:${envName}`,
              },
            },
          }),
        ],
      },
    });
  });

  it("only lets the staging role push images", () => {
    const pushPolicies = template("shared").findResources("AWS::IAM::Policy", {
      Properties: {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({ Action: Match.arrayWith(["ecr:PutImage"]) }),
          ]),
        },
      },
    });
    const roles = Object.values(pushPolicies).flatMap((p) => p.Properties.Roles);
    expect(roles).toHaveLength(1);
    expect(JSON.stringify(roles)).toContain("staging");
  });

  it("keeps images immutable and scanned", () => {
    template("shared").hasResourceProperties("AWS::ECR::Repository", {
      ImageTagMutability: "IMMUTABLE",
      ImageScanningConfiguration: { ScanOnPush: true },
    });
  });

  it("alerts on a $100 monthly budget without the email in the template", () => {
    const t = template("shared");
    t.hasResourceProperties("AWS::Budgets::Budget", {
      Budget: { BudgetLimit: { Amount: 100, Unit: "USD" }, TimeUnit: "MONTHLY" },
    });
    expect(JSON.stringify(t.toJSON())).not.toMatch(/@[a-z0-9-]+\.[a-z]+/i);
    t.hasParameter("*", {
      Type: "AWS::SSM::Parameter::Value<String>",
      Default: "/hockey-iq/budget-email",
    });
  });
});

describe("platform stacks", () => {
  it("staging skips the NAT gateway; production has one", () => {
    template("staging-platform").resourceCountIs("AWS::EC2::NatGateway", 0);
    template("production-platform").resourceCountIs("AWS::EC2::NatGateway", 1);
  });

  it.each(["staging", "production"])(
    "%s database is private, encrypted, and TLS-only",
    (envName) => {
      const t = template(`${envName}-platform`);
      t.hasResourceProperties("AWS::RDS::DBInstance", {
        PubliclyAccessible: false,
        StorageEncrypted: true,
        Engine: "postgres",
      });
      t.hasResourceProperties("AWS::RDS::DBParameterGroup", {
        Parameters: { "rds.force_ssl": "1" },
      });
      t.hasResource("AWS::RDS::DBInstance", { DeletionPolicy: "Snapshot" });
    },
  );

  it("production keeps longer backups, Multi-AZ, and deletion protection", () => {
    template("production-platform").hasResourceProperties("AWS::RDS::DBInstance", {
      BackupRetentionPeriod: 14,
      MultiAZ: true,
      DeletionProtection: true,
    });
    template("staging-platform").hasResourceProperties("AWS::RDS::DBInstance", {
      BackupRetentionPeriod: 7,
      MultiAZ: false,
    });
  });
});

describe("app stacks", () => {
  it("serves over HTTPS through CloudFront with an internal ALB", () => {
    const t = template("staging-app");
    t.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
      Scheme: "internal",
    });
    t.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        DefaultCacheBehavior: Match.objectLike({ ViewerProtocolPolicy: "redirect-to-https" }),
      }),
    });
    t.resourceCountIs("AWS::CloudFront::VpcOrigin", 1);
  });

  it("only admits CloudFront to the ALB", () => {
    const t = template("staging-app");
    const [albSgId] = Object.keys(
      t.findResources("AWS::EC2::SecurityGroup", {
        Properties: { GroupName: "hockey-iq-staging-alb" },
      }),
    );
    expect(t.findResources("AWS::EC2::SecurityGroup")[albSgId].Properties).not.toHaveProperty(
      "SecurityGroupIngress",
    );
    const albIngress = Object.values(t.findResources("AWS::EC2::SecurityGroupIngress")).filter(
      (r) => r.Properties.GroupId["Fn::GetAtt"]?.[0] === albSgId,
    );
    expect(albIngress).toHaveLength(1);
    expect(albIngress[0].Properties).toMatchObject({ FromPort: 80, ToPort: 80 });
    expect(albIngress[0].Properties.SourcePrefixListId).toBeDefined();
    const openIngress = Object.values(t.findResources("AWS::EC2::SecurityGroupIngress")).filter(
      (r) => r.Properties.CidrIp === "0.0.0.0/0" || r.Properties.CidrIpv6 === "::/0",
    );
    expect(openIngress).toEqual([]);
  });

  it("rolls back failed deployments automatically", () => {
    template("production-app").hasResourceProperties("AWS::ECS::Service", {
      DesiredCount: 2,
      DeploymentConfiguration: Match.objectLike({
        DeploymentCircuitBreaker: { Enable: true, Rollback: true },
        MinimumHealthyPercent: 100,
      }),
    });
  });

  it("injects secrets from Secrets Manager rather than plain environment variables", () => {
    const t = template("staging-app");
    const [taskDef] = Object.values(t.findResources("AWS::ECS::TaskDefinition"));
    const [container] = taskDef.Properties.ContainerDefinitions;
    const envNames = container.Environment.map((e: { Name: string }) => e.Name);
    const secretNames = container.Secrets.map((s: { Name: string }) => s.Name);
    expect(secretNames).toEqual(
      expect.arrayContaining(["DB_USER", "DB_PASSWORD", "SESSION_PASSWORD"]),
    );
    expect(envNames).not.toEqual(expect.arrayContaining(["DB_PASSWORD"]));
    expect(envNames).not.toContain("SESSION_PASSWORD");
  });
});

describe("migrate stacks", () => {
  it("runs prisma migrate deploy with a TLS mode Prisma understands", () => {
    template("staging-migrate").hasResourceProperties("AWS::ECS::TaskDefinition", {
      Family: "hockey-iq-staging-migrate",
      ContainerDefinitions: [
        Match.objectLike({
          Command: Match.arrayWith([Match.stringLikeRegexp("prisma migrate deploy")]),
          Environment: Match.arrayWith([{ Name: "DB_SSLMODE", Value: "require" }]),
        }),
      ],
    });
  });

  it("names its roles so the CI PassRole scope matches", () => {
    const t = template("staging-migrate");
    t.hasResourceProperties("AWS::IAM::Role", { RoleName: "hockey-iq-staging-migrate-exec" });
    t.hasResourceProperties("AWS::IAM::Role", { RoleName: "hockey-iq-staging-migrate-task" });
  });

  it("exposes what the deploy workflow needs to run the task", () => {
    const outputs = template("staging-migrate").findOutputs("*");
    expect(Object.keys(outputs)).toEqual(
      expect.arrayContaining([
        "ClusterArn",
        "TaskDefinitionArn",
        "ContainerName",
        "Subnets",
        "SecurityGroups",
        "AssignPublicIp",
        "LogGroupName",
      ]),
    );
  });
});
