"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ListFilterIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUrgencyLevel, isDueSoon } from "@/lib/subscriptions/urgency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SubscriptionDialog } from "./subscription-dialog";
import { SuccessOverlay, type SuccessAction } from "./success-overlay";

export type Subscription = {
  id: string;
  name: string | null;
  cost: number | null;
  billing_cycle: string | null;
  next_renewal_date: string | null;
};

type FilterKey = "all" | "due-soon" | "monthly" | "annual";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatCost(cost: number | null): string {
  if (cost === null) {
    return "—";
  }
  return currencyFormatter.format(cost);
}

function formatShortDate(date: string | null): string {
  if (!date) {
    return "—";
  }
  return shortDateFormatter.format(new Date(`${date}T00:00:00`));
}

function formatBillingCycle(billingCycle: string | null): string {
  if (billingCycle === "yearly") {
    return "Annual";
  }
  if (billingCycle === "monthly") {
    return "Monthly";
  }
  return billingCycle ?? "—";
}

const urgencyDotClasses: Record<"red" | "amber" | "green", string> = {
  red: "bg-red-400",
  amber: "bg-amber-400",
  green: "bg-emerald-400",
};

function UrgencyDot({ nextRenewalDate }: { nextRenewalDate: string | null }) {
  if (!nextRenewalDate) {
    return null;
  }
  const level = getUrgencyLevel(nextRenewalDate);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        urgencyDotClasses[level],
        level === "red" && "animate-urgency-pulse",
      )}
    />
  );
}

export function SubscriptionList({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);
  const [successAction, setSuccessAction] = useState<SuccessAction | null>(
    null,
  );
  const [isAddOpenFromEmptyState, setIsAddOpenFromEmptyState] =
    useState(false);

  const counts = useMemo(() => {
    return {
      all: subscriptions.length,
      "due-soon": subscriptions.filter(
        (subscription) =>
          !!subscription.next_renewal_date &&
          isDueSoon(subscription.next_renewal_date),
      ).length,
      monthly: subscriptions.filter(
        (subscription) => subscription.billing_cycle === "monthly",
      ).length,
      annual: subscriptions.filter(
        (subscription) => subscription.billing_cycle === "yearly",
      ).length,
    };
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    switch (filter) {
      case "due-soon":
        return subscriptions.filter(
          (subscription) =>
            !!subscription.next_renewal_date &&
            isDueSoon(subscription.next_renewal_date),
        );
      case "monthly":
        return subscriptions.filter(
          (subscription) => subscription.billing_cycle === "monthly",
        );
      case "annual":
        return subscriptions.filter(
          (subscription) => subscription.billing_cycle === "yearly",
        );
      default:
        return subscriptions;
    }
  }, [subscriptions, filter]);

  const chips: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "due-soon", label: "Due soon" },
    { key: "monthly", label: "Monthly" },
    { key: "annual", label: "Annual" },
  ];
  const overflowChips = chips.filter(
    (chip) => chip.key === "monthly" || chip.key === "annual",
  );
  const isOverflowFilterActive = filter === "monthly" || filter === "annual";

  const isEmpty = subscriptions.length === 0;

  function renderChip(chip: { key: FilterKey; label: string }) {
    const isActive = filter === chip.key;
    return (
      <button
        key={chip.key}
        type="button"
        onClick={() => setFilter(chip.key)}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
          isActive
            ? "border-transparent bg-[var(--accent-pink)] text-black"
            : "border-white/15 bg-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        {chip.key === "due-soon" && (
          <span
            aria-hidden="true"
            className="inline-block size-1.5 shrink-0 rounded-full bg-red-500"
          />
        )}
        {chip.label} · <span className="font-mono">{counts[chip.key]}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {isEmpty ? (
        <div className="flex min-h-[calc(100svh-10rem)] flex-col items-center justify-center gap-8 text-center">
          <div aria-hidden="true" className="relative mb-2 size-24 sm:size-28">
            <div className="absolute top-5 left-0 size-20 -rotate-6 rounded-2xl bg-white/10 sm:top-6 sm:size-24" />
            <div className="absolute top-0 right-0 size-20 rotate-3 rounded-2xl border-2 bg-[#1a1420] border-[var(--accent-pink)] sm:size-24" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-3xl font-extrabold sm:text-4xl">
              No subscriptions yet
            </p>
            <p className="hidden max-w-md text-lg text-muted-foreground sm:block">
              Add the recurring payments you want to keep track of, and
              we&apos;ll remind you before they renew.
            </p>
            <p className="max-w-xs text-base text-muted-foreground sm:hidden">
              Add a recurring payment and we&apos;ll remind you before it
              renews.
            </p>
          </div>
          <Button
            onClick={() => setIsAddOpenFromEmptyState(true)}
            className="h-auto gap-1 rounded-xl border-transparent bg-[var(--accent-pink)] px-6 py-3 text-base font-bold text-black hover:bg-[var(--accent-pink)]/85"
          >
            <PlusIcon className="size-5" />
            <span className="hidden sm:inline">
              Add your first subscription
            </span>
            <span className="sm:hidden">Add subscription</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: all four chips */}
          <div className="scrollbar-hide hidden gap-2 overflow-x-auto pb-1 sm:flex">
            {chips.map(renderChip)}
          </div>

          {/* Mobile: All + Due soon, plus a dropdown for Monthly/Annual */}
          <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1 sm:hidden">
            {chips
              .filter((chip) => chip.key === "all" || chip.key === "due-soon")
              .map(renderChip)}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="More filters"
                    className={cn(
                      "relative flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isOverflowFilterActive
                        ? "border-transparent bg-[var(--accent-pink)] text-black"
                        : "border-white/15 bg-transparent text-muted-foreground hover:text-foreground",
                    )}
                  />
                }
              >
                <ListFilterIcon className="size-3.5" />
                {isOverflowFilterActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[var(--accent-pink)] ring-2 ring-background"
                  />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {overflowChips.map((chip) => {
                  const isActive = filter === chip.key;
                  return (
                    <DropdownMenuItem
                      key={chip.key}
                      onClick={() => setFilter(chip.key)}
                      className="justify-between"
                    >
                      <span>
                        {chip.label} ·{" "}
                        <span className="font-mono">{counts[chip.key]}</span>
                      </span>
                      {isActive && <CheckIcon className="size-3.5" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop column headers */}
          <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] items-center gap-6 border-b border-white/10 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid">
            <span>Name</span>
            <span className="text-right">Cost</span>
            <span className="w-20 text-right">Cycle</span>
            <span className="w-14 text-right">Next</span>
            <span className="w-4" />
          </div>

          <ul className="flex flex-col">
            {filteredSubscriptions.map((subscription) => (
              <li
                key={subscription.id}
                onClick={() => setEditingSubscription(subscription)}
                className="grid cursor-pointer grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-white/10 py-3 text-sm transition-colors hover:bg-white/5 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:gap-6"
              >
                <span className="truncate text-foreground">
                  {subscription.name}
                </span>
                <span className="text-right font-mono text-foreground tabular-nums">
                  {formatCost(subscription.cost)}
                </span>
                <span className="hidden w-20 text-right text-muted-foreground sm:block">
                  {formatBillingCycle(subscription.billing_cycle)}
                </span>
                <span className="hidden w-14 text-right text-muted-foreground tabular-nums sm:block">
                  {formatShortDate(subscription.next_renewal_date)}
                </span>
                <span className="flex w-4 justify-end">
                  <UrgencyDot
                    nextRenewalDate={subscription.next_renewal_date}
                  />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <SubscriptionDialog
        open={isEmpty ? isAddOpenFromEmptyState : !!editingSubscription}
        onOpenChange={(nextOpen) => {
          if (isEmpty) {
            setIsAddOpenFromEmptyState(nextOpen);
          } else if (!nextOpen) {
            setEditingSubscription(null);
          }
        }}
        subscription={isEmpty ? null : editingSubscription}
        onSuccess={setSuccessAction}
      />
      {successAction ? (
        <SuccessOverlay
          action={successAction}
          onDone={() => setSuccessAction(null)}
        />
      ) : null}
    </div>
  );
}
