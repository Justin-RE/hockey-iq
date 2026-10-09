import Link from "next/link";
import type { ProgressSummary } from "@/game/engine";
import { scenarios } from "@/scenarios";

export function ProgressList({ summary }: { summary: ProgressSummary }) {
  return (
    <div className="space-y-4">
      <p className="text-lg">
        <strong>{summary.attempted}</strong> of {summary.total} scenarios played ·{" "}
        <strong>{summary.firstTryCorrect}</strong> correct on the first try
      </p>
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {scenarios.map((s) => {
          const p = summary.byScenario[s.slug];
          const status = !p
            ? "Not played yet"
            : p.firstTryCorrect
              ? "Correct on first try"
              : p.everCorrect
                ? `Got it after ${p.attempts} tries`
                : `${p.attempts} ${p.attempts === 1 ? "try" : "tries"}, not solved yet`;
          return (
            <li
              key={s.slug}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <Link href={`/play/${s.slug}`} className="font-medium hover:underline">
                {s.title}
              </Link>
              <span className={p?.everCorrect ? "text-emerald-700" : "text-slate-600"}>
                {status}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
