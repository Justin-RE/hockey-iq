"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Scenario } from "@/game/engine";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  createPitch,
  type PitchController,
} from "@/game/phaser/pitch";

type Props = {
  scenario: Scenario;
  controllerRef: RefObject<PitchController | null>;
  onReady: () => void;
};

export function PitchCanvas({ scenario, controllerRef, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let controller: PitchController | null = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    createPitch(container, scenario, { reducedMotion })
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
  }, [scenario, controllerRef, onReady]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={scenario.description}
      data-testid="pitch"
      className="bg-turf w-full overflow-hidden rounded-lg shadow-inner"
      style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
    />
  );
}
