import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/observability/sentry-options";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  // One image serves every environment, so the browser can't know APP_ENV at build time.
  // The event URL's host tells staging and production apart.
  const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  Sentry.init(
    sentryOptions({
      dsn,
      environment: local ? "development" : "browser",
      release: process.env.NEXT_PUBLIC_APP_VERSION,
    }),
  );
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
