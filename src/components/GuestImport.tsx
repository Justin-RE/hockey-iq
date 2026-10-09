"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { importGuestAttempts } from "@/app/actions/progress";
import { clearGuestAttempts } from "@/lib/guest-progress";
import { useGuestAttempts } from "@/lib/use-guest-attempts";

export function GuestImport() {
  const attempts = useGuestAttempts();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (!attempts?.length) return null;

  function save() {
    startTransition(async () => {
      await importGuestAttempts(attempts);
      clearGuestAttempts();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-sky-50 p-3 text-sky-900">
      <span>
        You have {attempts.length} {attempts.length === 1 ? "answer" : "answers"} saved on this
        device from before you signed in.
      </span>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="bg-home rounded px-3 py-1.5 text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add them to my account"}
      </button>
    </div>
  );
}
