# Changelog

All notable changes to HockeyIQ are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/). Releases are cut with the `release` skill (`.cursor/skills/release/`).

## [Unreleased]

### Added

- Eight field hockey scenarios: goal-side marking, free hit 5-yard rule, penalty corner injection, obstruction, 16-yard hit outlet, channeling the attacker, penalty corner first runner, 2v1 overlap
- Phaser pitch with animated outcomes, keyboard controls (1-4 to answer, R to retry), and a color-blind-safe palette
- Guest play with progress saved on the device, plus optional nickname accounts that keep progress across devices
- Health endpoint (`/api/health`, `?deep=1` checks the database)
- AWS infrastructure (ECS Fargate, RDS Postgres, CloudFront) and a GitHub Actions pipeline that deploys staging on merge and production on release
- Error tracking with Sentry that sends no personal data, CloudWatch alarms, and an uptime check

### Security

- Accounts collect only a nickname and a password (scrypt-hashed). No email or other personal data.
- Sign-up and sign-in are rate limited using CloudFront's viewer address.
- Database connections verify the RDS certificate.
