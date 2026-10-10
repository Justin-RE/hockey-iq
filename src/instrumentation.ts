import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { logger } = await import("@/lib/logger");
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) {
    const Sentry = await import("@sentry/nextjs");
    const { sentryOptions } = await import("@/lib/observability/sentry-options");
    Sentry.init(
      sentryOptions({
        dsn,
        environment: process.env.APP_ENV ?? "development",
        release: process.env.APP_VERSION,
      }),
    );
  }
  logger.info(
    { sentry: Boolean(dsn), version: process.env.APP_VERSION ?? "dev" },
    "server started",
  );
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { logger } = await import("@/lib/logger");
  logger.error(
    {
      err: error,
      method: request.method,
      path: request.path.split("?")[0],
      routePath: context.routePath,
      routeType: context.routeType,
    },
    "request error",
  );
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(error, request, context);
};
