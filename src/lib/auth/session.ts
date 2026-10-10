import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = { userId?: string; nickname?: string };
export type CurrentUser = { id: string; nickname: string };

function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_PASSWORD;
  if (!password || password.length < 32) {
    throw new Error("SESSION_PASSWORD must be set to at least 32 characters");
  }
  return {
    password,
    cookieName: "hockeyiq_session",
    ttl: 60 * 60 * 24 * 30,
    cookieOptions: {
      httpOnly: true,
      // Off only for HTTP-only environments (local e2e, the local container).
      secure: process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

async function readUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  return session.userId && session.nickname
    ? { id: session.userId, nickname: session.nickname }
    : null;
}

/**
 * For rendering. `use cache: private` lets Next.js prefetch per-session UI; unsealing the
 * cookie checks expiry against the clock, which is otherwise not allowed while prerendering.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  "use cache: private";
  return readUser();
}

/** For Server Actions: always re-reads the cookie, never cached. */
export async function getSessionUser(): Promise<CurrentUser | null> {
  return readUser();
}
