import type { Metadata } from "next";
import { Suspense } from "react";
import { GuestImport } from "@/components/GuestImport";
import { GuestProgress } from "@/components/GuestProgress";
import { ProgressList } from "@/components/ProgressList";
import { summarizeProgress } from "@/game/engine";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserAttempts } from "@/lib/progress";
import { scenarioSlugs } from "@/scenarios";

export const metadata: Metadata = { title: "My progress" };

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My progress</h1>
      <Suspense fallback={<p className="text-slate-500">Loading your progress…</p>}>
        <Progress />
      </Suspense>
    </div>
  );
}

async function Progress() {
  const user = await getCurrentUser();
  if (!user) return <GuestProgress />;

  const attempts = await getUserAttempts(user.id);
  return (
    <div className="space-y-4">
      <GuestImport />
      <ProgressList summary={summarizeProgress(attempts, scenarioSlugs)} />
    </div>
  );
}
