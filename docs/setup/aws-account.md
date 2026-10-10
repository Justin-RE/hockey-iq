# AWS account setup (one time)

Do these steps by hand, in order. After step 6, every merge to `main` deploys staging automatically.

## 1. Create the account and secure the root user

1. Sign up at <https://aws.amazon.com/> (needs an email address, a payment card, and phone verification).
2. Sign in as root, then **IAM → Security credentials**: turn on MFA for root (passkey or authenticator app).
3. Don't create access keys for root. After step 2 you won't use root day to day.

## 2. Turn on IAM Identity Center (single sign-on)

1. Console → **IAM Identity Center** → Enable (region: **us-east-1**).
2. **Users** → Add user for yourself, then set up MFA when you accept the invite.
3. **Permission sets** → Create → Predefined → `AdministratorAccess`. Set session duration to 4 hours.
4. **AWS accounts** → select your account → Assign users → you → `AdministratorAccess`.
5. Copy the **AWS access portal URL** from the Identity Center dashboard.

## 3. Configure the CLI profile

```bash
aws configure sso --profile hockey-iq
#   SSO session name: hockey-iq
#   SSO start URL:   <access portal URL from step 2>
#   SSO region:      us-east-1
#   Scopes:          (press Enter)
#   Then choose the account and AdministratorAccess role; default region us-east-1, output json.
aws sts get-caller-identity --profile hockey-iq
```

Sessions expire; run `aws sso login --profile hockey-iq` to refresh.

## 4. Bootstrap CDK and deploy the shared stack

```bash
export AWS_PROFILE=hockey-iq
# Budget alerts go to this address. Stored in SSM so it stays out of the public repo.
aws ssm put-parameter --name /hockey-iq/budget-email --type String --value "<your email>"

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

## Costs to expect (staging)

Roughly $45-60/month. The ALB (~$17) and RDS `db.t4g.micro` (~$13 + storage) dominate; then Fargate (~$9 for 0.25 vCPU/0.5 GB), public IPv4 addresses (~$4 each), CloudWatch, and Secrets Manager ($0.40/secret). To pause staging, scale the service to 0 and stop the RDS instance (it restarts automatically after 7 days).
