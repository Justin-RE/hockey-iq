import type { BrowserOptions, ErrorEvent } from "@sentry/nextjs";

type DataCollection = NonNullable<BrowserOptions["dataCollection"]>;

/**
 * Children use this app (COPPA), so Sentry must never receive personal data.
 * SDK v11 collects everything by default; every category is switched off here.
 * Also enable "Prevent Storing of IP Addresses" in the Sentry project settings.
 */
export const PRIVACY_DATA_COLLECTION: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  // Local variables can hold passwords or session data.
  stackFrameVariables: false,
};

/** Second line of defense in `beforeSend`, in case an integration attaches data anyway. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.url) event.request.url = event.request.url.split("?")[0];
  }
  for (const exception of event.exception?.values ?? []) {
    for (const frame of exception.stacktrace?.frames ?? []) delete frame.vars;
  }
  return event;
}

export function sentryOptions({
  dsn,
  environment,
  release,
}: {
  dsn: string;
  environment: string;
  release?: string;
}) {
  return {
    dsn,
    environment,
    release,
    tracesSampleRate: 0.1,
    dataCollection: PRIVACY_DATA_COLLECTION,
    beforeSend: scrubEvent,
  };
}
