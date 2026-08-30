"use client";

import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="dark flex min-h-svh flex-col bg-background py-8 text-foreground">
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col px-6 sm:px-8">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
            <TriangleAlert className="size-5" />
          </div>
          <p className="text-lg font-bold">Couldn&apos;t load your subscriptions</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Something went wrong on our end. Your data is safe — try again in
            a moment.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-2 rounded-lg border-white/15 bg-transparent text-foreground hover:bg-white/5"
            onClick={() => reset()}
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
