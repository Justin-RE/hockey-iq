# 3. ECS Fargate with AWS CDK

Date: 2026-10-09. Status: accepted.

## Context

Options for running Next.js on AWS:

- Amplify Hosting: fastest setup, but less control over networking, IAM, and logging, and Next.js feature support can lag new releases.
- Lambda via OpenNext/SST: low idle cost, but more moving parts and cold starts.
- ECS Fargate container behind an ALB: standard, well-understood, and the pattern regulated workloads usually use (VPC isolation, security groups, private database).

## Decision

Package the app as a Docker image using Next.js `output: "standalone"` and run it on ECS Fargate behind an Application Load Balancer, with RDS Postgres and Secrets Manager. Define everything with AWS CDK in TypeScript (`infra/`). Deploy from GitHub Actions using an OIDC role, with no long-lived AWS keys.

## Consequences

- Fixed monthly cost even when idle (ALB, RDS, Fargate task, and a NAT gateway in prod). Staging skips the NAT gateway to save money.
- The same skills and stack carry over to the later, compliance-heavy projects.
