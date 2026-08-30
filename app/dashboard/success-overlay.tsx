"use client";

import { useEffect, useRef, useState } from "react";

export type SuccessAction = "added" | "updated" | "deleted";

const messages: Record<SuccessAction, string> = {
  added: "Subscription added",
  updated: "Subscription updated",
  deleted: "Subscription deleted",
};

const HOLD_MS = 1700;
const FADE_MS = 300;

export function SuccessOverlay({
  action,
  onDone,
}: {
  action: SuccessAction;
  onDone: () => void;
}) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Keep the latest onDone in a ref instead of the effect's dependency array
  // so a fresh inline callback from a parent re-render (e.g. triggered by
  // router.refresh() while this overlay is still visible) doesn't tear down
  // and re-run the effect, which would restart the hold/fade timers and the
  // checkmark-draw animation partway through -- i.e. the reported "fires
  // twice" bug. The timer schedule should run exactly once per mount.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFadingOut(true), HOLD_MS);
    const doneTimer = setTimeout(() => onDoneRef.current(), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-100 flex items-center justify-center transition-opacity ease-out"
      style={{
        opacity: isFadingOut ? 0 : 1,
        transitionDuration: `${FADE_MS}ms`,
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative flex flex-col items-center gap-4">
        <svg
          viewBox="0 0 100 100"
          className="size-24"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--accent-pink)"
            strokeWidth="4"
          />
          <path
            data-slot="success-overlay-checkmark"
            d="M28 52 L43 66 L74 34"
            fill="none"
            stroke="var(--accent-pink)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            className="animate-success-checkmark-draw"
          />
        </svg>
        <p className="text-lg font-medium text-foreground">
          {messages[action]}
        </p>
      </div>
    </div>
  );
}
