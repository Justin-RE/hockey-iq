import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScenarioPlayer } from "@/components/ScenarioPlayer";
import { categoryLabels, getNextScenario, getScenario, scenarios } from "@/scenarios";

export function generateStaticParams() {
  return scenarios.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/play/[slug]">): Promise<Metadata> {
  const scenario = getScenario((await params).slug);
  return scenario ? { title: scenario.title, description: scenario.summary } : {};
}

export default async function ScenarioPage({ params }: PageProps<"/play/[slug]">) {
  const { slug } = await params;
  const scenario = getScenario(slug);
  if (!scenario) notFound();
  const next = getNextScenario(slug);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/play" className="text-sm text-slate-600 hover:underline">
          ← All scenarios
        </Link>
        <p className="mt-2 text-sm font-medium tracking-wide text-slate-500 uppercase">
          {categoryLabels[scenario.category]}
        </p>
        <h1 className="text-3xl font-bold">{scenario.title}</h1>
      </div>
      <ScenarioPlayer
        key={scenario.slug}
        scenario={scenario}
        next={next && { slug: next.slug, title: next.title }}
      />
    </div>
  );
}
