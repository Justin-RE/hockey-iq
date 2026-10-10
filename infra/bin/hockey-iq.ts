import { App, Tags } from "aws-cdk-lib";
import { AppStack } from "../lib/app-stack";
import { APP_NAME, ENVIRONMENTS, REGION, stackName, type EnvName } from "../lib/config";
import { MigrateStack } from "../lib/migrate-stack";
import { PlatformStack } from "../lib/platform-stack";
import { SharedStack } from "../lib/shared-stack";

const app = new App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: REGION };

new SharedStack(app, stackName("shared", "Core"), {
  env,
  monthlyBudgetUsd: 100,
  budgetEmailParameter: `/${APP_NAME}/budget-email`,
});

// Environment stacks need a release image, so they only exist when one is given:
//   cdk deploy HockeyIq-Staging-App -c imageTag=<git sha>
const imageTag: unknown = app.node.tryGetContext("imageTag");
if (typeof imageTag === "string" && imageTag.length > 0) {
  for (const envName of Object.keys(ENVIRONMENTS) as EnvName[]) {
    const config = ENVIRONMENTS[envName];
    const platform = new PlatformStack(app, stackName(envName, "Platform"), { env, config });
    const migrate = new MigrateStack(app, stackName(envName, "Migrate"), {
      env,
      platform,
      imageTag,
    });
    const web = new AppStack(app, stackName(envName, "App"), { env, platform, imageTag });
    for (const stack of [platform, migrate, web]) Tags.of(stack).add("env", envName);
  }
}

Tags.of(app).add("app", APP_NAME);
Tags.of(app).add("managed-by", "cdk");
