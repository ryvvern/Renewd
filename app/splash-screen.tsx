"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "renewd-splash-shown";
const HOLD_MS = 1650;
const EXIT_MS = 350;

export function SplashScreen() {
  // null until we know (post-mount) whether this session has already seen
  // the splash -- avoids a hydration mismatch, since sessionStorage isn't
  // available during server rendering.
  const [phase, setPhase] = useState<"hidden" | "visible" | "exiting">(
    "hidden",
  );

  useEffect(() => {
    let isCancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Defer the sessionStorage check + resulting state update off the
    // synchronous effect body (avoids the "setState as first effect
    // statement" cascading-render pattern) while still running before the
    // browser paints, so there's no visible flash of the wrong state.
    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      let alreadyShown = false;
      try {
        alreadyShown = sessionStorage.getItem(SESSION_KEY) === "1";
      } catch {
        // sessionStorage unavailable (e.g. private mode edge cases) --
        // treat as not-yet-shown so the splash still plays once.
      }

      if (alreadyShown) {
        return;
      }

      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // Ignore write failures; the splash will just play again next load.
      }

      setPhase("visible");

      timers.push(
        setTimeout(() => {
          if (!isCancelled) setPhase("exiting");
        }, HOLD_MS),
      );
      timers.push(
        setTimeout(() => {
          if (!isCancelled) setPhase("hidden");
        }, HOLD_MS + EXIT_MS),
      );
    });

    return () => {
      isCancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-slot="splash-screen"
      className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0a0a0a] transition-[opacity,transform] ease-out"
      style={{
        transitionDuration: `${EXIT_MS}ms`,
        opacity: phase === "exiting" ? 0 : 1,
        transform: phase === "exiting" ? "scale(0.94)" : "scale(1)",
      }}
    >
      <p className="font-sans text-4xl font-bold tracking-tight text-white sm:text-6xl">
        RENEWD
        <span
          data-slot="splash-cursor"
          className="ml-0.5 inline-block animate-splash-cursor-blink text-[var(--accent-pink)]"
        >
          .
        </span>
      </p>
    </div>
  );
}
