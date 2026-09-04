import { redirect } from "next/navigation";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { getAverageMonthlySpend } from "@/lib/subscriptions/spend";
import { AddSubscription } from "./add-subscription";
import { LogoutButton } from "./logout-button";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import { SubscriptionList, type Subscription } from "./subscription-list";
import { UpcomingPanel } from "./upcoming-panel";

const avgCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("subscriptions")
    .select("id, name, cost, billing_cycle, next_renewal_date")
    .order("next_renewal_date", { ascending: true })
    .returns<Subscription[]>();

  if (subscriptionsError) {
    throw new Error(subscriptionsError.message);
  }

  const subscriptionList = subscriptions ?? [];
  const averageMonthlySpend = getAverageMonthlySpend(subscriptionList);
  const isEmpty = subscriptionList.length === 0;

  return (
    <div className="dark flex min-h-svh flex-col bg-background text-foreground">
      <div className="flex flex-1 flex-col p-4 sm:p-0">
        <div className="flex flex-1 flex-col rounded-3xl bg-card sm:rounded-none sm:bg-transparent">
          <div className="flex flex-col gap-6 sm:gap-0">
            <header className="flex flex-col gap-4 px-6 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 sm:pt-8 sm:pb-8">
              <div className="flex items-center justify-between gap-4 sm:min-w-0 sm:flex-col sm:items-start sm:justify-start sm:gap-1">
                <span className="text-2xl font-extrabold tracking-tight whitespace-nowrap sm:text-4xl">
                  <span className="text-[var(--accent-pink)]">R</span>
                  <span className="text-white">enewd</span>
                </span>
                <p className="text-base text-muted-foreground sm:hidden">
                  Avg{" "}
                  <span className="font-mono text-lg font-bold text-foreground">
                    {avgCurrencyFormatter.format(averageMonthlySpend)}
                  </span>
                </p>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {user.email}
                </span>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 sm:gap-4">
                <div className="hidden text-right sm:block">
                  <p className="text-base text-muted-foreground">
                    Avg{" "}
                    <span className="font-mono text-xl font-bold text-[var(--accent-pink)]">
                      {avgCurrencyFormatter.format(averageMonthlySpend)}
                    </span>
                    /mo
                  </p>
                  <p className="text-sm text-muted-foreground">
                    includes annual plans, averaged monthly
                  </p>
                </div>
                <AddSubscription />
                <div className="hidden sm:block">
                  <LogoutButton />
                </div>
              </div>
            </header>
          </div>

          <div className="hidden border-t border-white/[.08] sm:block" />

          <div className="flex flex-1 flex-col sm:flex-row sm:items-stretch">
            <div
              className={cn(
                "min-w-0 px-6 pb-6 sm:px-8 sm:py-6",
                isEmpty ? "sm:flex-1" : "sm:w-[900px]",
              )}
            >
              <SubscriptionList subscriptions={subscriptionList} />
            </div>
            <UpcomingPanel subscriptions={subscriptionList} />
          </div>

          <MobileMenuSheet />
        </div>
      </div>
    </div>
  );
}
