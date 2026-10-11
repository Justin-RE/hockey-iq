# AWS account setup (one time)

Do these steps by hand, in order. After step 6, every merge to `main` deploys staging automatically.

These steps assume an account created with **Sign up for AWS (new)**: you sign in with an AWS Builder ID, and the console shows projects, a team, and a spend limit. That experience doesn't support IAM Identity Center, Organizations, or deploying regional services to us-east-1. Activating advanced features turns it into a standard AWS Organization that you control. (If you signed up with **Sign up for AWS (advanced)** instead, secure the root user with MFA, sign in to the CLI with `aws login`, and skip to step 4.)

## 1. Activate advanced features

Activation can't be undone.

1. Turn on MFA for your Builder ID: <https://profile.aws.amazon.com/> → **Security** → register a passkey or authenticator app.
2. At <https://settings.aws.com> → **Project** → **Overview** → **Additional Info**, note the project's **AWS account ID** and **Region**. HockeyIQ deploys into this project account, never into the management account.
3. **Projects** → **Actions** → **Explore advanced features**. Enter a team name, choose and verify a management account email, then **Review and complete activation** → **Activate**.
4. Set the management account's root password. You aren't prompted for it: at <https://console.aws.amazon.com/> choose **Sign in using root user email**, enter the management account email, choose **Forgot your password?**, and follow the email from `@verify.signin.aws`. Then sign in as root and turn on MFA (account menu → **Security credentials**). Root is for emergencies only; don't create access keys for it.
5. Keep **AWS Builder ID** as the identity source. Switching to another identity source can't be undone.

Activation removes the spend limit. The $100/month budget from step 4 emails you instead.

## 2. Allow regional services in us-east-1

The organization still has an AWS-written service control policy (SCP) that only allows global services (IAM, CloudFront, Route 53, and similar) in us-east-1. ECS, RDS, and CloudFormation are blocked there until you edit it.

1. <https://settings.aws.com> → **Projects** → **Manage this organization** (in the activation banner, or the management account card) → **Manage policies**. This opens AWS Organizations in the management account.
2. **Policies** → **Service control policies** → `AdvancedModeRegionRestrictionSecurityControlPolicy` (its statements include `UsEast1Partitional` and `RegionFloor`) → **Edit policy**.
3. Delete the `UsEast1Partitional` statement, and `DenyUsEast1WafResourceAssociation` if it's there. **Keep `RegionFloor`**: it still blocks every Region except us-east-1, us-west-2, and your home Region.
4. **Save changes**.
5. **AWS accounts** → your project account → **Policies**: confirm none of the `BudgetsSpendLimit…` policies is attached. `BudgetsSpendLimitDenyNewWorkloads` blocks CloudFormation, ECS, and RDS creation.

## 3. Sign in from the CLI

`aws login` needs AWS CLI 2.32 or later (`aws --version`).

```bash
aws login --profile hockey-iq
#   A browser opens. Sign in with your Builder ID and choose the project account from step 1, not the management account.
#   If it asks for a Region, enter us-east-1.
aws configure set region us-east-1 --profile hockey-iq
aws sts get-caller-identity --profile hockey-iq   # Account must match the project account ID
```

The CDK CLI uses these credentials directly. When the session expires, run `aws login --profile hockey-iq` again.

## 4. Bootstrap CDK and deploy the shared stack

```bash
export AWS_PROFILE=hockey-iq
# Budget and alarm emails go to this address. Stored in SSM so it stays out of the public repo.
aws ssm put-parameter --name /hockey-iq/alert-email --type String --value "<your email>"

cd infra
pnpm exec cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/us-east-1
pnpm exec cdk deploy HockeyIq-Shared-Core
```

This creates the ECR repository, the GitHub OIDC provider, the `hockey-iq-github-staging` and `hockey-iq-github-production` roles, and the $100/month budget. AWS sends an email to confirm the budget subscription. Accept it.

## 5. Tell GitHub which account to use

```bash
gh variable set AWS_ACCOUNT_ID --body "$(aws sts get-caller-identity --query Account --output text)"
```

The account ID is not a secret, but it is kept out of the code. `PRODUCTION_ENABLED` stays unset until production is approved.

## 6. First staging deploy

```bash
gh workflow run deploy.yml -f environment=staging
gh run watch
```

The first run takes 20-30 minutes (RDS and CloudFront creation). Later deploys take 5-10 minutes. The URL is on the run summary and in the `HockeyIq-Staging-App` stack outputs.

AWS sends a "Subscription Confirmation" email for the `hockey-iq-staging-alarms` topic. Confirm it, or alarms won't reach you.

## 7. Sentry (error tracking)

1. Create a free account at <https://sentry.io/> and a **Next.js** project named `hockey-iq`.
2. Project **Settings → Security & Privacy**: turn on **Prevent Storing of IP Addresses**, **Data Scrubber**, and **Use Default Scrubbers** (ADR 0007).
3. Copy the DSN (**Settings → Client Keys**). It's public by design, so a repository variable is fine:

   ```bash
   gh variable set SENTRY_DSN --body "<dsn>"
   ```

4. The next deploy bakes it into the image. Locally, put it in `.env.local` as `NEXT_PUBLIC_SENTRY_DSN` if you want to test.

## Costs to expect (staging)

Roughly $45-60/month. The ALB (~$17) and RDS `db.t4g.micro` (~$13 + storage) dominate; then Fargate (~$9 for 0.25 vCPU/0.5 GB), public IPv4 addresses (~$4 each), CloudWatch, and Secrets Manager ($0.40/secret). To pause staging, scale the service to 0 and stop the RDS instance (it restarts automatically after 7 days).
