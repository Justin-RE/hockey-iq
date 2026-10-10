import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import type { Construct } from "constructs";
import { APP_NAME, DB_NAME, ECR_REPOSITORY_NAME } from "./config";
import type { PlatformStack } from "./platform-stack";

/** The release image; every environment runs the same tag that CI pushed. */
export function releaseImage(scope: Construct, imageTag: string): ecs.ContainerImage {
  const repository = ecr.Repository.fromRepositoryName(scope, "Repository", ECR_REPOSITORY_NAME);
  return ecs.ContainerImage.fromEcrRepository(repository, imageTag);
}

/** Variables shared by the web and migration containers (see src/lib/database-url.ts). */
export function databaseEnvironment(platform: PlatformStack, imageTag: string) {
  const environment: Record<string, string> = {
    APP_ENV: platform.config.envName,
    APP_VERSION: imageTag,
    LOG_LEVEL: "info",
    DB_HOST: platform.database.dbInstanceEndpointAddress,
    DB_PORT: platform.database.dbInstanceEndpointPort,
    DB_NAME,
  };
  const secrets: Record<string, ecs.Secret> = {
    DB_USER: ecs.Secret.fromSecretsManager(platform.databaseSecret, "username"),
    DB_PASSWORD: ecs.Secret.fromSecretsManager(platform.databaseSecret, "password"),
  };
  return { environment, secrets };
}

export function logGroupName(platform: PlatformStack, component: "app" | "migrate"): string {
  return `/${APP_NAME}/${platform.config.envName}/${component}`;
}
