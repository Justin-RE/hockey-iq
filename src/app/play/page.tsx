import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/game/engine";
import { categoryLabels, scenarios } from "@/scenarios";

export const metadata: Metadata = { title: "Scenarios" };

const difficultyLabel = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" } as const;

export default function PlayPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Scenarios</h1>
        <p className="mt-1 text-slate-700">Pick a situation. Each one takes about a minute.</p>
      </div>
      {CATEGORIES.map((category) => {
        const list = scenarios.filter((s) => s.category === category);
        if (list.length === 0) return null;
        return (
          <section key={category} aria-labelledby={`cat-${category}`} className="space-y-3">
            <h2 id={`cat-${category}`} className="text-xl font-semibold">
              {categoryLabels[category]}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/play/${s.slug}`}
                    className="hover:border-home block h-full rounded-lg border border-slate-200 bg-white p-4 transition"
                  >
                    <span className="block font-semibold">{s.title}</span>
                    <span className="mt-1 block text-sm text-slate-700">{s.summary}</span>
                    <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {difficultyLabel[s.difficulty]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
