# 7. Error tracking with Sentry, without personal data

Date: 2026-10-10. Status: accepted. Includes the privacy review required by `.cursor/rules/security.mdc`.

## Context

CloudWatch Logs and alarms tell us that something failed, but they don't group errors or show browser-side failures. Sentry does both, and its free tier fits this project. It is a third-party processor, and children use the app (COPPA), so it may only receive technical data.

Sentry SDK v11 collects broadly by default. User info, cookies, HTTP headers, request and response bodies, URL query strings, database query parameters, and stack-frame local variables are all collected unless turned off.

## Decision

- Use `@sentry/nextjs`, wired through Next.js's own hooks: `src/instrumentation.ts` (server, plus `onRequestError`) and `src/instrumentation-client.ts` (browser). No `withSentryConfig` build wrapper, so no source-map upload token is needed yet.
- `src/lib/observability/sentry-options.ts` turns off every `dataCollection` category, and a `beforeSend` scrubber removes `user`, cookies, headers, bodies, query strings, and frame variables as a second layer. Unit tests assert that nicknames, IPs, cookies, and passwords don't survive.
- No Session Replay, no user feedback widget, no `Sentry.setUser`.
- Sentry project settings (set by hand): **Prevent Storing of IP Addresses** on, **Data Scrubber** and **Use Default Scrubbers** on, and Data Forwarding off.
- The DSN is public by design (it ships in browser JavaScript). It is a GitHub repository variable baked into the image at build time. The SDK stays off when no DSN is set (local dev, CI).

## Privacy review

| Data                       | Sent? | Why                                                                 |
| -------------------------- | ----- | ------------------------------------------------------------------- |
| Error message, stack trace | yes   | Needed to fix bugs. Our errors don't include nicknames or input.    |
| Page URL (path only)       | yes   | Paths are scenario slugs (`/play/goal-side-marking`), not personal. |
| Browser and OS version     | yes   | From the user agent, for reproducing browser bugs.                  |
| IP address                 | no    | `userInfo: false`, scrubbed, and blocked by the project setting.    |
| Nickname or user id        | no    | Never set on the scope. `user` is deleted in `beforeSend`.          |
| Cookies and session        | no    | `cookies: false`, scrubbed.                                         |
| Form input and passwords   | no    | `httpBodies: []`, frame variables off, no Session Replay.           |

Revisit this review before enabling tracing integrations that capture payloads, Session Replay, or any new SDK option.

## Consequences

- Errors are grouped and alertable, browser errors included, with no personal data leaving our AWS account.
- Browser stack traces are minified until source maps are uploaded (a later change, with a Sentry auth token in GitHub secrets).
- One image serves every environment, so browser events use `environment: "browser"` and are told apart by URL host. Server events carry the real `APP_ENV`.
