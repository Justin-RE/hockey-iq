import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import { PRIVACY_DATA_COLLECTION, scrubEvent, sentryOptions } from "./sentry-options";

describe("Sentry privacy settings", () => {
  it("turns off every personal-data category", () => {
    expect(PRIVACY_DATA_COLLECTION).toMatchObject({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
      databaseQueryData: false,
    });
  });

  it("wires the privacy settings and scrubber into the init options", () => {
    const options = sentryOptions({ dsn: "https://k@o0.ingest.sentry.io/1", environment: "test" });
    expect(options.dataCollection).toBe(PRIVACY_DATA_COLLECTION);
    expect(options.beforeSend).toBe(scrubEvent);
  });

  it("strips user, cookies, headers, bodies, query strings, and frame variables", () => {
    const event = {
      type: undefined,
      user: { id: "u1", ip_address: "203.0.113.7", username: "kid_player" },
      request: {
        url: "https://example.cloudfront.net/login?nickname=kid_player",
        cookies: { hockeyiq_session: "secret" },
        headers: { "cloudfront-viewer-address": "203.0.113.7:443" },
        data: "nickname=kid_player&password=hunter22",
        query_string: "nickname=kid_player",
      },
      exception: {
        values: [
          { stacktrace: { frames: [{ function: "login", vars: { password: "hunter22" } }] } },
        ],
      },
    } as ErrorEvent;

    const scrubbed = scrubEvent(event);
    const serialized = JSON.stringify(scrubbed);
    for (const leaked of ["kid_player", "203.0.113.7", "secret", "hunter22"]) {
      expect(serialized).not.toContain(leaked);
    }
    expect(scrubbed.request?.url).toBe("https://example.cloudfront.net/login");
  });
});
