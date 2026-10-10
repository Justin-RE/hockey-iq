import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl } from "./database-url";

describe("resolveDatabaseUrl", () => {
  it("prefers DATABASE_URL", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: "postgresql://a@b/c", DB_HOST: "x" })).toBe(
      "postgresql://a@b/c",
    );
  });

  it("assembles a URL from DB_* parts with SSL by default", () => {
    expect(
      resolveDatabaseUrl({
        DB_HOST: "db.internal",
        DB_USER: "app",
        DB_PASSWORD: "p@ss/word",
        DB_NAME: "hockey_iq",
      }),
    ).toBe("postgresql://app:p%40ss%2Fword@db.internal:5432/hockey_iq?sslmode=verify-full");
  });

  it("lets DB_SSLMODE override the SSL mode (for the Prisma migration engine)", () => {
    expect(
      resolveDatabaseUrl({
        DB_HOST: "db.internal",
        DB_USER: "app",
        DB_PASSWORD: "pw",
        DB_NAME: "hockey_iq",
        DB_SSLMODE: "require",
      }),
    ).toBe("postgresql://app:pw@db.internal:5432/hockey_iq?sslmode=require");
  });

  it("returns undefined when parts are missing", () => {
    expect(resolveDatabaseUrl({ DB_HOST: "db.internal" })).toBeUndefined();
  });
});
