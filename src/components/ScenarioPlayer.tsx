"use client";

import Link from "next/link";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { recordAttempt } from "@/app/actions/progress";
import { evaluateChoice, type Outcome, type Scenario } from "@/game/engine";
import type { PitchController } from "@/game/phaser/pitch";
import { addGuestAttempt } from "@/lib/guest-progress";
import { PitchCanvas } from "./PitchCanvas";

type Phase = "loading" | "choosing" | "animating" | "answered";
type SavedTo = "account" | "device";

type Props = { scenario: Scenario; next?: { slug: string; title: string } };

export function ScenarioPlayer({ scenario, next }: Props) {
  const controllerRef = useRef<PitchController | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [savedTo, setSavedTo] = useState<SavedTo | null>(null);

  const onReady = useCallback(() => setPhase((p) => (p === "loading" ? "choosing" : p)), []);

  const choose = useCallback(
    async (choiceId: string) => {
      if (phase !== "choosing") return;
      const result = evaluateChoice(scenario, choiceId);
      setOutcome(result);
      setPhase("animating");

      const attempt = {
        scenarioSlug: scenario.slug,
        choiceId,
        correct: result.correct,
        at: new Date().toISOString(),
      };
      const saving = recordAttempt(scenario.slug, choiceId)
        .then(({ saved }): SavedTo => (saved ? "account" : "device"))
        .catch((): SavedTo => "device")
        .then((to) => {
          if (to === "device") addGuestAttempt(attempt);
          return to;
        });

      await controllerRef.current?.play(result.timeline);
      setSavedTo(await saving);
      setPhase("answered");
    },
    [phase, scenario],
  );

  const retry = useCallback(() => {
    controllerRef.current?.reset();
    setOutcome(null);
    setSavedTo(null);
    setPhase("choosing");
  }, []);

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.metaKey || event.ctrlKey) return;
    const index = Number(event.key) - 1;
    if (phase === "choosing" && index >= 0 && index < scenario.choices.length) {
      void choose(scenario.choices[index].id);
    } else if (phase === "answered" && event.key.toLowerCase() === "r") {
      retry();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <PitchCanvas scenario={scenario} controllerRef={controllerRef} onReady={onReady} />
        <p className="text-sm text-slate-600">
          <span className="font-semibold">Scene: </span>
          {scenario.description}
        </p>
        <Legend />
      </div>

      <section aria-labelledby="prompt" className="space-y-4">
        <h2 id="prompt" className="text-xl font-semibold">
          {scenario.prompt}
        </h2>
        <ol className="space-y-2">
          {scenario.choices.map((choice, i) => {
            const picked = outcome?.choice.id === choice.id;
            const reveal = phase === "answered";
            return (
              <li key={choice.id}>
                <button
                  type="button"
                  onClick={() => void choose(choice.id)}
                  disabled={phase !== "choosing"}
                  aria-pressed={picked}
                  className={[
                    "w-full rounded-lg border-2 px-4 py-3 text-left transition",
                    "enabled:hover:border-home enabled:hover:bg-sky-50 disabled:cursor-default",
                    reveal && choice.correct
                      ? "border-emerald-600 bg-emerald-50"
                      : reveal && picked
                        ? "border-rose-600 bg-rose-50"
                        : "border-slate-300 bg-white",
                  ].join(" ")}
                >
                  <span className="mr-2 font-mono text-slate-500">{i + 1}.</span>
                  {choice.label}
                  {reveal && choice.correct && (
                    <span className="ml-2 font-semibold text-emerald-700">(best choice)</span>
                  )}
                  {reveal && picked && !choice.correct && (
                    <span className="ml-2 font-semibold text-rose-700">(your choice)</span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        {phase === "loading" && <p className="text-sm text-slate-500">Setting up the pitch…</p>}
        {phase === "choosing" && (
          <p className="text-sm text-slate-500">
            Tip: press 1-{scenario.choices.length} to answer.
          </p>
        )}

        <div aria-live="polite">
          {phase === "answered" && outcome && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
              <h3
                className={`text-lg font-bold ${outcome.correct ? "text-emerald-700" : "text-rose-700"}`}
              >
                {outcome.correct ? "Correct!" : "Not quite"}
              </h3>
              <p>{outcome.choice.feedback}</p>
              <div>
                <h4 className="font-semibold">Why</h4>
                <p className="text-slate-700">{scenario.explanation}</p>
              </div>
              <p className="text-xs text-slate-500">
                {savedTo === "account"
                  ? "Saved to your account."
                  : "Saved on this device. Sign in to keep progress across devices."}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100"
                >
                  Try again
                </button>
                {next ? (
                  <Link
                    href={`/play/${next.slug}`}
                    className="bg-home rounded-lg px-4 py-2 text-white hover:opacity-90"
                  >
                    Next: {next.title}
                  </Link>
                ) : (
                  <Link
                    href="/progress"
                    className="bg-home rounded-lg px-4 py-2 text-white hover:opacity-90"
                  >
                    See my progress
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Legend() {
  const item = (color: string, label: string, ring = false) => (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className={`inline-block size-4 rounded-full ${color} ${ring ? "ring-you ring-4" : ""}`}
      />
      {label}
    </li>
  );
  return (
    <ul aria-label="Legend" className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
      {item("bg-home", "You", true)}
      {item("bg-home", "Your team")}
      {item("bg-away", "Opponents")}
      {item("bg-[#cc79a7]", "Goalkeeper")}
      {item("bg-white border border-black", "Ball")}
    </ul>
  );
}
