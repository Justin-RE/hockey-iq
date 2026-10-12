"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import type { Scenario } from "@/game/engine";
import { PORTRAIT_QUERY, type Orientation } from "@/game/phaser/layout";
import { createPitch, type PitchController } from "@/game/phaser/pitch";

type Props = {
  scenario: Scenario;
  controllerRef: RefObject<PitchController | null>;
  onReady: () => void;
};

export function PitchCanvas({ scenario, controllerRef, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orientation = usePitchOrientation();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !orientation) return;
    let cancelled = false;
    let controller: PitchController | null = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    createPitch(container, scenario, { orientation, reducedMotion })
      .then((created) => {
        if (cancelled) return created.destroy();
        controller = created;
        controllerRef.current = created;
      })
      // Without a canvas the scenario is still playable as text.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) onReady();
      });

    return () => {
      cancelled = true;
      controller?.destroy();
      controllerRef.current = null;
    };
  }, [scenario, orientation, controllerRef, onReady]);

  // Aspect ratios are canvasSize("portrait") and canvasSize("landscape"), switching at the same
  // width as PORTRAIT_QUERY so the box is the right shape before the canvas loads. On short
  // phones the portrait pitch narrows so the question stays close by.
  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={scenario.description}
      data-testid="pitch"
      data-orientation={orientation ?? undefined}
      className="bg-turf mx-auto aspect-[660/1060] w-full max-w-[calc(65svh*660/1060)] overflow-hidden rounded-lg shadow-inner sm:aspect-[1060/660] sm:max-w-none"
    />
  );
}

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PORTRAIT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePitchOrientation(): Orientation | null {
  return useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(PORTRAIT_QUERY).matches ? "portrait" : "landscape"),
    () => null,
  );
}
