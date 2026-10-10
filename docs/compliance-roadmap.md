# Compliance roadmap

HockeyIQ was built as a production-shaped learning project. This document records what it already does that auditors care about, what's missing for a SOC 2 baseline, the COPPA lessons, and what changes for a HIPAA or PCI DSS app. Use it as the starting checklist for the next, more regulated project.

> This is an engineering plan, not legal advice. Confirm current requirements with counsel and your auditor; COPPA, HIPAA, and PCI DSS all changed in 2024-2025.

## 1. What's already in place

| Area                     | HockeyIQ today                                                                                                                                    | SOC 2 criteria it supports |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Change management        | Every change is a PR into a protected `main`. CI has 5 required checks. Squash merges keep a linear history. Deploys come from the pipeline only. | CC8.1                      |
| Secure development       | CodeQL (security-extended), Dependabot, `pnpm audit`, secret scanning with push protection, Bugbot rules, SHA-pinned Actions                      | CC7.1, CC8.1               |
| Access to cloud          | No long-lived keys: GitHub OIDC roles scoped per environment. People use SSO with MFA. Least-privilege IAM is asserted in tests.                  | CC6.1, CC6.2, CC6.3        |
| Network isolation        | Database in isolated subnets. Internal ALB reachable only from CloudFront. No inbound rules open to the internet.                                 | CC6.6                      |
| Encryption               | HTTPS at the edge. RDS storage encrypted. TLS required to the database (`rds.force_ssl`, `verify-full`). Secrets in Secrets Manager.              | CC6.1, CC6.7               |
| Availability and backups | ECS circuit-breaker rollback, PITR backups (7/14 days), Multi-AZ in prod, restore runbook with a monthly test                                     | A1.2, A1.3                 |
| Monitoring and response  | Structured logs, alarms, uptime check, Sentry, incident runbook and template                                                                      | CC7.2, CC7.3, CC7.4        |
| Privacy by design        | Nickname-only accounts, no personal data in Sentry (ADR 0007), privacy review step in the rules                                                   | P-series (if in scope)     |
| Documentation            | ADRs, runbooks, maintenance schedule, changelog                                                                                                   | CC2.1, CC5.3               |

## 2. Gaps to a SOC 2 (Security) baseline

Ordered roughly by value for effort. Most are CDK changes plus a written policy.

### Technical controls

- [ ] **Audit logging**: an organization CloudTrail trail to a dedicated log-archive account, an S3 bucket with Object Lock, and log file validation. Today we rely on the default 90-day event history.
- [ ] **Threat detection and posture**: GuardDuty, Security Hub (AWS Foundational Security Best Practices + CIS), AWS Config with conformance packs, IAM Access Analyzer.
- [ ] **Network logs**: VPC Flow Logs, ALB and CloudFront access logs, kept per the retention policy.
- [ ] **Edge protection**: AWS WAF on CloudFront (managed common rules, rate-based rule). Today rate limiting is in-process only.
- [ ] **Custom domain with TLS 1.2+ everywhere**: an ACM certificate on CloudFront (enables the TLS 1.2 minimum) and on the ALB (encrypts the CloudFront-to-ALB hop). See ADR 0006.
- [ ] **Least-privilege deploys**: re-bootstrap CDK with a scoped `--cloudformation-execution-policies` instead of the default `AdministratorAccess`.
- [ ] **Account structure**: AWS Organizations with separate prod, staging, log-archive, and security accounts; SCPs that deny leaving the org, disabling CloudTrail, or using unapproved regions.
- [ ] **Two-person rule**: require 1+ approving review on `main` and enforce it for admins (today: 0 reviews, admins can bypass). Require a different reviewer for production approvals (`prevent_self_review`).
- [ ] **Supply chain**: SBOMs and signed provenance for images (`docker/build-push-action` attestations), commit signing, and Inspector for ECR and Lambda.
- [ ] **Secrets**: managed rotation for the database credentials (needs a Secrets Manager VPC endpoint), and session password rotation without signing users out.
- [ ] **Keys**: customer-managed KMS keys for RDS, logs, and secrets when the framework or a customer requires key control.
- [ ] **Backups**: cross-region (or cross-account) snapshot copies with AWS Backup, plus a documented RTO/RPO test.
- [ ] **Vulnerability management**: written SLAs (for example: critical in 7 days, high in 30) and evidence that they're met.

### Policies and evidence (the part engineers forget)

- [ ] Information security policy, acceptable use, access control, change management, incident response, business continuity, vendor management, data retention and deletion, risk assessment.
- [ ] Quarterly access reviews (AWS SSO, GitHub, Sentry), recorded.
- [ ] Vendor inventory with DPAs and SOC 2 reports: AWS, GitHub, Sentry, Cursor.
- [ ] Onboarding and offboarding checklists, plus security awareness training.
- [ ] Evidence collection. A compliance automation platform (Vanta, Drata, Secureframe) pulls most of it from AWS and GitHub; budget for one before a Type I.
- [ ] Path: readiness assessment, then **Type I** (design at a point in time), then **Type II** (operating effectiveness over 3-12 months).

## 3. COPPA lessons from HockeyIQ

What worked:

- **Collect less and the problem shrinks.** Nickname plus password, no email, no birthday, no free text, no third-party trackers. That avoided the need for verifiable parental consent for most features.
- **Make the privacy check part of the workflow.** `.cursor/rules/security.mdc` makes agents stop and ask for an ADR and privacy review before adding data collection. ADR 0007 shows the review in practice.
- **Third-party SDKs are where leaks hide.** Sentry v11 collects cookies, headers, bodies, and user info by default. Every SDK needs its defaults read, turned off explicitly, and tested.

Gaps if HockeyIQ were a real product:

- [ ] **Parent rights**: parents must be able to review and delete their child's information. Add account deletion (cascade already exists in the schema) and a data export.
- [ ] **Retention**: define and enforce how long attempts and inactive accounts are kept (for example, delete accounts after 12 months of inactivity).
- [ ] **2025 COPPA Rule amendments**: a written information security program, a written data retention policy, and separate parental consent before disclosing children's data to third parties. Compliance deadline was April 22, 2026.
- [ ] **Nicknames**: guide kids away from real names in nicknames, and moderate or blocklist further.
- [ ] **Privacy policy**: a complete COPPA notice (operator contact, what's collected, parent rights), reviewed by counsel.

## 4. If the next app is HIPAA (health data)

What changes from this template:

- **BAAs first**: sign the AWS BAA (AWS Artifact) and use only [HIPAA-eligible services](https://aws.amazon.com/compliance/hipaa-eligible-services-reference/) for PHI. ECS Fargate, RDS, CloudFront, Secrets Manager, CloudWatch, and S3 all qualify. Every vendor that touches PHI needs a BAA, including error tracking (Sentry offers a BAA on its higher-tier plans; otherwise self-host or make sure no PHI can reach it).
- **Risk analysis**: a documented Security Rule risk analysis before go-live, updated yearly.
- **Access**: unique user IDs, MFA, role-based access to PHI, automatic logoff, and an audit log of every PHI read and write (application-level, not just CloudTrail).
- **Data handling**: minimum necessary use, KMS customer-managed keys, no PHI in logs, URLs, or analytics, and de-identified data in non-prod.
- **Retention and breach**: keep compliance documentation 6 years. Have a breach notification procedure (individuals within 60 days; HHS; media for 500+).
- **Cursor**: Privacy Mode on. Never paste PHI into prompts. Use synthetic fixtures only. Rules that block PHI-like fields without review.

## 5. If the next app is PCI DSS (card payments)

- **Stay out of scope**: use a hosted payment page or embedded fields (Stripe Checkout or Elements, Adyen) so card data never touches our servers. Target **SAQ A**.
- **PCI DSS v4.0.1** (future-dated requirements mandatory since March 31, 2025): inventory and authorize scripts on payment pages and detect tampering (6.4.3, 11.6.1). SAQ A merchants must confirm their site isn't susceptible to script attacks. A strict CSP and SRI help.
- **Still required**: quarterly external ASV scans if any in-scope system faces the internet, MFA for admin access, strong change control (already here), and log review.
- **Never**: log full card numbers, store CVV, or build your own card form posting to your API.

## 6. Recommended path for the next project

1. Pick the regulated domain (HIPAA, PCI, or SOC 2 for a B2B SaaS) and write its PRD with a **data classification** table first.
2. Copy this repo's skeleton: rules, hooks, skills, CI, CDK layout, and runbooks.
3. Before writing features, add the Section 2 technical controls to the CDK app: Organizations, CloudTrail, GuardDuty, Security Hub, WAF, a custom domain, and a scoped bootstrap.
4. Add a domain-specific rule (for example `hipaa.mdc`), Bugbot checks, and a hook that blocks committing fixtures that look like real identifiers.
5. Run the `security-review` subagent on every PR that touches auth, data access, or infrastructure.
6. Start evidence collection on day one; it's much cheaper than reconstructing it for an audit.
