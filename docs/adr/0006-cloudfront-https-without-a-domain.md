# 6. HTTPS through CloudFront with a private load balancer

Date: 2026-10-10. Status: accepted.

## Context

Login cookies are `Secure` in production, so the app must be served over HTTPS. HTTPS on an Application Load Balancer needs an ACM certificate, and that needs a domain we control. We don't have one yet, and we want staging live now.

Options:

- Buy a domain now and put the ACM certificate on a public ALB. Costs money and setup time before anything works.
- Serve staging over plain HTTP with `COOKIE_SECURE=false`. Teaches the wrong habit and would leak session cookies on untrusted networks.
- Put CloudFront in front. Its default `*.cloudfront.net` certificate gives HTTPS immediately. A CloudFront **VPC origin** reaches an internal ALB, so the ALB has no public address at all.

## Decision

- An internal ALB in isolated subnets. Its security group allows only CloudFront's origin-facing managed prefix list, on port 80.
- A CloudFront distribution with the ALB as a VPC origin. Viewers are redirected to HTTPS. Pages are not cached. `/_next/static/*` uses the optimized cache policy.
- The `AllViewerAndCloudFrontHeaders-2022-06` origin request policy forwards `Host` (Server Actions compare it with `Origin`) and `CloudFront-Viewer-Address`. The app uses the latter for rate limiting, because the first `X-Forwarded-For` entry is client-controlled.

## Consequences

- HTTPS and the CDN from day one, with no domain. Adding a custom domain later is an ACM certificate in us-east-1 and an alias on the distribution. No change to the ALB.
- The CloudFront-to-ALB hop is HTTP inside AWS's network and our VPC. Moving it to HTTPS needs a certificate on the ALB (so a domain). That is on the compliance roadmap.
- The `*.cloudfront.net` certificate only allows the default TLS policy (TLS 1.0+ offered to old clients). A custom domain lets us require TLS 1.2+.
- CloudFront's default origin timeout is 30 seconds, plenty for this app.
