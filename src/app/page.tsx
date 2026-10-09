import Link from "next/link";
import { scenarios } from "@/scenarios";

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="space-y-5 py-6">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Think faster on the field.
        </h1>
        <p className="max-w-2xl text-lg text-slate-700">
          HockeyIQ freezes real field hockey moments, like penalty corners, 16-yard hits, and 1v1s,
          and asks what you&apos;d do. Pick an answer, watch it play out, and learn why.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/play"
            className="bg-home rounded-lg px-5 py-3 font-semibold text-white hover:opacity-90"
          >
            Start playing
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold hover:bg-slate-100"
          >
            Create a free account
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          No email needed. You can play all {scenarios.length} scenarios as a guest.
        </p>
      </section>

      <section aria-labelledby="how" className="grid gap-4 sm:grid-cols-3">
        <h2 id="how" className="sr-only">
          How it works
        </h2>
        {[
          ["1. Read the moment", "See where everyone is standing and what just happened."],
          ["2. Make your call", "Choose what you'd do next, just like in a game."],
          ["3. Learn why", "Watch it play out and read the rule or tactic behind it."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-slate-700">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
