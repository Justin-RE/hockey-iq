"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { AttemptRecord } from "@/game/engine";
import { GUEST_ATTEMPTS_KEY, loadGuestAttempts } from "./guest-progress";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** Guest attempts from localStorage; null during server rendering and hydration. */
export function useGuestAttempts(): AttemptRecord[] | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(GUEST_ATTEMPTS_KEY) ?? "",
    () => null,
  );
  // `raw` is the cache key: re-parse only when the stored string changes.
  return useMemo(() => (raw === null ? null : loadGuestAttempts()), [raw]);
}
