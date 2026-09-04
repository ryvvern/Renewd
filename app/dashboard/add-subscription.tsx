"use client";

import { useState } from "react";

import { SubscriptionDialog } from "./subscription-dialog";
import { SuccessOverlay, type SuccessAction } from "./success-overlay";

export function AddSubscription() {
  const [open, setOpen] = useState(false);
  const [successAction, setSuccessAction] = useState<SuccessAction | null>(
    null,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-base font-semibold text-[var(--accent-pink)] transition-opacity hover:opacity-80"
      >
        + Add
      </button>
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
