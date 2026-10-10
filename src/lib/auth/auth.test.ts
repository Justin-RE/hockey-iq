import { describe, expect, it } from "vitest";
import { CredentialsSchema, NicknameSchema } from "./credentials";
import { hashPassword, verifyPassword } from "./password";
import { clientIpFromHeaders, createRateLimiter } from "./rate-limit";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
    expect(await verifyPassword("wrong password", stored)).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});

describe("nickname rules", () => {
  it.each(["Ava", "striker_9", "Mia2026"])("accepts %s", (nick) => {
    expect(NicknameSchema.safeParse(nick).success).toBe(true);
  });

  it.each(["ab", "9lives", "has space", "way_too_long_nickname_123", "TheAdmin"])(
    "rejects %s",
    (nick) => {
      expect(NicknameSchema.safeParse(nick).success).toBe(false);
    },
  );

  it("requires passwords of at least 8 characters", () => {
    expect(CredentialsSchema.safeParse({ nickname: "Ava", password: "short" }).success).toBe(false);
  });
});

describe("rate limiter", () => {
  it("blocks after the limit and resets after the window", () => {
    const check = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(check("k", 0).allowed).toBe(true);
    expect(check("k", 10).allowed).toBe(true);
    expect(check("k", 20)).toEqual({ allowed: false, retryAfterMs: 980 });
    expect(check("other", 20).allowed).toBe(true);
    expect(check("k", 1001).allowed).toBe(true);
  });
});

describe("clientIpFromHeaders", () => {
  it("prefers CloudFront-Viewer-Address over a spoofable X-Forwarded-For", () => {
    const headers = new Headers({
      "cloudfront-viewer-address": "203.0.113.7:51234",
      "x-forwarded-for": "1.1.1.1, 203.0.113.7",
    });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.7");
  });

  it("handles IPv6 viewer addresses", () => {
    const headers = new Headers({ "cloudfront-viewer-address": "2001:db8::1:443" });
    expect(clientIpFromHeaders(headers)).toBe("2001:db8::1");
  });

  it("falls back to the first X-Forwarded-For entry, then 'unknown'", () => {
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "10.0.0.1, 10.0.0.2" }))).toBe(
      "10.0.0.1",
    );
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
