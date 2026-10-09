"use client";

import Link from "next/link";
import { summarizeProgress } from "@/game/engine";
import { useGuestAttempts } from "@/lib/use-guest-attempts";
import { scenarioSlugs } from "@/scenarios";
import { ProgressList } from "./ProgressList";

export function GuestProgress() {
  const attempts = useGuestAttempts();
  if (attempts === null) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-sky-50 p-3 text-sky-900">
        You&apos;re playing as a guest, so progress is saved on this device only.{" "}
        <Link href="/signup" className="font-semibold underline">
          Create an account
        </Link>{" "}
        to keep it.
      </p>
      <ProgressList summary={summarizeProgress(attempts, scenarioSlugs)} />
    </div>
  );
}
