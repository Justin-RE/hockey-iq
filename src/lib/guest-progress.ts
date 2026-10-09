import { z } from "zod";
import { AttemptRecordSchema, type AttemptRecord } from "@/game/engine";

export const GUEST_ATTEMPTS_KEY = "hockeyiq.attempts.v1";
const KEY = GUEST_ATTEMPTS_KEY;
const MAX = 500;

/** Browser-only storage for players who haven't created an account. */
export function loadGuestAttempts(): AttemptRecord[] {
  try {
    const parsed = z
      .array(AttemptRecordSchema)
      .safeParse(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function addGuestAttempt(attempt: AttemptRecord): void {
  const next = [...loadGuestAttempts(), attempt].slice(-MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  notify();
}

export function clearGuestAttempts(): void {
  localStorage.removeItem(KEY);
  notify();
}

// The "storage" event only fires in other tabs; dispatch it so this tab's subscribers update too.
function notify() {
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}
