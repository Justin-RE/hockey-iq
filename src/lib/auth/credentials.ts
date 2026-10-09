import { z } from "zod";

const BLOCKED_FRAGMENTS = [
  "admin",
  "moderator",
  "official",
  "umpire",
  "fuck",
  "shit",
  "bitch",
  "sex",
];

export const NicknameSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z][A-Za-z0-9_]{2,19}$/,
    "3-20 letters, numbers, or underscores, starting with a letter",
  )
  .refine(
    (value) => !BLOCKED_FRAGMENTS.some((word) => value.toLowerCase().includes(word)),
    "Please choose a different nickname",
  );

export const PasswordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(128, "At most 128 characters");

export const CredentialsSchema = z.object({
  nickname: NicknameSchema,
  password: PasswordSchema,
});

export type Credentials = z.infer<typeof CredentialsSchema>;
