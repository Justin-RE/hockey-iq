import { describe, expect, it } from "vitest";
import { CredentialsSchema, NicknameSchema } from "./credentials";
import { hashPassword, verifyPassword } from "./password";
import { createRateLimiter } from "./rate-limit";

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
