"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SubscriptionDialog } from "./subscription-dialog";
import { SuccessOverlay, type SuccessAction } from "./success-overlay";

export function AddSubscription() {
  const [open, setOpen] = useState(false);
  const [successAction, setSuccessAction] = useState<SuccessAction | null>(
    null,
  );

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          "gap-1 rounded-full border-transparent bg-[var(--accent-pink)] px-4 text-black hover:bg-[var(--accent-pink)]/85 sm:px-3",
        )}
      >
        <PlusIcon />
        <span className="hidden sm:inline">Add</span>
        <span className="sr-only sm:hidden">Add subscription</span>
      </Button>
      <SubscriptionDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={setSuccessAction}
      />
      {successAction ? (
        <SuccessOverlay
          action={successAction}
          onDone={() => setSuccessAction(null)}
        />
      ) : null}
    </>
  );
}
