"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SuccessAction } from "./success-overlay";

type BillingCycle = "monthly" | "yearly";

const PAST_DATE_WARNING_THRESHOLD_DAYS = 3;

function isMeaningfullyInThePast(isoDate: string, today: Date = new Date()) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const dateTimestamp = Date.UTC(year, month - 1, day);
  const todayTimestamp = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const daysInPast = Math.round(
    (todayTimestamp - dateTimestamp) / (24 * 60 * 60 * 1000),
  );
  return daysInPast > PAST_DATE_WARNING_THRESHOLD_DAYS;
}

export type EditableSubscription = {
  id: string;
  name: string | null;
  cost: number | null;
  billing_cycle: string | null;
  next_renewal_date: string | null;
};

function toFormState(subscription: EditableSubscription | null | undefined) {
  if (!subscription) {
    return {
      name: "",
      cost: "",
      billingCycle: "" as BillingCycle | "",
      nextRenewalDate: "",
    };
  }
  return {
    name: subscription.name ?? "",
    cost: subscription.cost !== null ? String(subscription.cost) : "",
    billingCycle:
      subscription.billing_cycle === "monthly" ||
      subscription.billing_cycle === "yearly"
        ? subscription.billing_cycle
        : ("" as BillingCycle | ""),
    nextRenewalDate: subscription.next_renewal_date ?? "",
  };
}

function SubscriptionForm({
  subscription,
  onOpenChange,
  onRequestDelete,
  onSuccess,
}: {
  subscription?: EditableSubscription | null;
  onOpenChange: (open: boolean) => void;
  onRequestDelete: () => void;
  onSuccess: (action: SuccessAction) => void;
}) {
  const router = useRouter();
  const isEditMode = !!subscription;
  const initial = toFormState(subscription);

  const [name, setName] = useState(initial.name);
  const [cost, setCost] = useState(initial.cost);
  const [billingCycle, setBillingCycle] = useState<BillingCycle | "">(
    initial.billingCycle,
  );
  const [nextRenewalDate, setNextRenewalDate] = useState(
    initial.nextRenewalDate,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showPastDateWarning =
    !!nextRenewalDate && isMeaningfullyInThePast(nextRenewalDate);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const parsedCost = Number(cost);

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (!cost || Number.isNaN(parsedCost) || parsedCost <= 0) {
      setError("Cost must be a number greater than 0.");
      return;
    }
    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      setError("Select a billing cycle.");
      return;
    }
    if (!nextRenewalDate) {
      setError("Next renewal date is required.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to save a subscription.");
      setIsSubmitting(false);
      return;
    }

    const { error: submitError } = isEditMode
      ? await supabase
          .from("subscriptions")
          .update({
            name: trimmedName,
            cost: parsedCost,
            billing_cycle: billingCycle,
            next_renewal_date: nextRenewalDate,
          })
          .eq("id", subscription.id)
      : await supabase.from("subscriptions").insert({
          user_id: user.id,
          name: trimmedName,
          cost: parsedCost,
          billing_cycle: billingCycle,
          next_renewal_date: nextRenewalDate,
        });

    if (submitError) {
      setError(submitError.message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onOpenChange(false);
    onSuccess(isEditMode ? "updated" : "added");
    router.refresh();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">
          {isEditMode ? "Edit subscription" : "Add subscription"}
        </DialogTitle>
      </DialogHeader>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="name"
            className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
          >
            Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="e.g. Netflix"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-10 border-white/10 bg-black/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="cost"
              className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
            >
              Cost
            </Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="$0.00"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              className="h-10 border-white/10 bg-black/40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              <span className="hidden sm:inline">Billing cycle</span>
              <span className="sm:hidden">Cycle</span>
            </Label>
            <div className="flex h-10 items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                  billingCycle === "monthly"
                    ? "bg-[var(--accent-pink)] text-black"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="hidden sm:inline">Monthly</span>
                <span className="sm:hidden">Mo</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                  billingCycle === "yearly"
                    ? "bg-[var(--accent-pink)] text-black"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="hidden sm:inline">Yearly</span>
                <span className="sm:hidden">Yr</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="next-renewal-date"
            className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
          >
            <span className="hidden sm:inline">Next renewal date</span>
            <span className="sm:hidden">Next renewal</span>
          </Label>
          <Input
            id="next-renewal-date"
            type="date"
            value={nextRenewalDate}
            onChange={(event) => setNextRenewalDate(event.target.value)}
            className="h-10 border-white/10 bg-black/40"
          />
          {showPastDateWarning ? (
            <p className="text-xs text-amber-400/80">
              This date is in the past — it&apos;ll be rolled forward
              automatically. Double-check if that wasn&apos;t intended.
            </p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter className="-mx-0 -mb-0 mt-1 border-none bg-transparent p-0 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-white/15 bg-transparent text-foreground hover:bg-white/5"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg border-transparent bg-[var(--accent-pink)] text-black hover:bg-[var(--accent-pink)]/85"
          >
            {isEditMode
              ? isSubmitting
                ? "Saving..."
                : "Save changes"
              : isSubmitting
                ? "Saving..."
                : "Save subscription"}
          </Button>
        </DialogFooter>
      </form>
      {isEditMode ? (
        <button
          type="button"
          onClick={onRequestDelete}
          className="mx-auto text-sm text-red-400 transition-colors hover:text-red-300"
        >
          Delete subscription
        </button>
      ) : null}
    </>
  );
}

function DeleteConfirmation({
  subscription,
  onCancel,
  onDeleted,
  onSuccess,
}: {
  subscription: EditableSubscription;
  onCancel: () => void;
  onDeleted: () => void;
  onSuccess: (action: SuccessAction) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", subscription.id);

    if (deleteError) {
      setError(deleteError.message);
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    onDeleted();
    onSuccess("deleted");
    router.refresh();
  }

  const name = subscription.name ?? "this subscription";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-lg font-bold">Delete {name}?</p>
        <p className="text-sm text-muted-foreground">
          You&apos;ll stop getting renewal reminders for it. This can&apos;t
          be undone.
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="rounded-lg border-white/15 bg-transparent text-foreground hover:bg-white/5"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isDeleting}
          onClick={handleDelete}
          className="rounded-lg border-transparent bg-red-500 text-white hover:bg-red-500/85"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}

export function SubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  initialView = "form",
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: EditableSubscription | null;
  initialView?: "form" | "delete";
  onSuccess: (action: SuccessAction) => void;
}) {
  const [view, setView] = useState<"form" | "delete">(initialView);
  const [wasOpen, setWasOpen] = useState(open);

  // Reset the view to whatever the caller asked for each time the dialog
  // transitions into the open state (e.g. clicking "Delete" on one row after
  // closing an edit dialog on another should start in the delete view again).
  if (open && !wasOpen) {
    setWasOpen(true);
    if (view !== initialView) {
      setView(initialView);
    }
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="dark gap-5 border-none bg-popover p-5 text-foreground sm:max-w-[420px]">
        {open ? (
          view === "delete" && subscription ? (
            <DeleteConfirmation
              key={`delete-${subscription.id}`}
              subscription={subscription}
              onCancel={() => handleOpenChange(false)}
              onDeleted={() => handleOpenChange(false)}
              onSuccess={onSuccess}
            />
          ) : (
            <SubscriptionForm
              key={subscription?.id ?? "add"}
              subscription={subscription}
              onOpenChange={handleOpenChange}
              onRequestDelete={() => setView("delete")}
              onSuccess={onSuccess}
            />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
