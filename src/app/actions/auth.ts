"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { CredentialsSchema } from "@/lib/auth/credentials";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/auth/rate-limit";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export type AuthFormState =
  { error?: string; fieldErrors?: { nickname?: string[]; password?: string[] } } | undefined;

const signupLimiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });
const loginLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

// Used when the nickname doesn't exist so failed logins take the same time either way.
const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");

async function clientIp(): Promise<string> {
  return clientIpFromHeaders(await headers());
}

function parse(formData: FormData) {
  return CredentialsSchema.safeParse({
    nickname: formData.get("nickname"),
    password: formData.get("password"),
  });
}

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  if (!signupLimiter(await clientIp()).allowed) {
    return { error: "Too many new accounts from this network. Try again later." };
  }

  const { nickname, password } = parsed.data;
  try {
    const user = await getDb().user.create({
      data: {
        nickname,
        nicknameKey: nickname.toLowerCase(),
        passwordHash: await hashPassword(password),
      },
    });
    const session = await getSession();
    session.userId = user.id;
    session.nickname = user.nickname;
    await session.save();
    logger.info({ userId: user.id }, "user signed up");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { nickname: ["That nickname is taken"] } };
    }
    throw error;
  }
  redirect("/progress");
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: "Nickname or password is incorrect" };

  const { nickname, password } = parsed.data;
  const key = nickname.toLowerCase();
  if (!loginLimiter(`${await clientIp()}:${key}`).allowed) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }

  const user = await getDb().user.findUnique({ where: { nicknameKey: key } });
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    logger.warn({ nicknameKey: key }, "failed login");
    return { error: "Nickname or password is incorrect" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.nickname = user.nickname;
  await session.save();
  redirect("/progress");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
