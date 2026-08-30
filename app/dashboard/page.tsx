import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAverageMonthlySpend } from "@/lib/subscriptions/spend";
import { AddSubscription } from "./add-subscription";
import { LogoutButton } from "./logout-button";
import { SubscriptionList, type Subscription } from "./subscription-list";

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

  return (
    <div className="dark min-h-svh bg-background py-8 text-foreground">
      <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-6 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-semibold tracking-tight">
              Renewd
            </span>
            <span className="text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>

          <div className="flex items-center gap-4">
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
            <LogoutButton />
          </div>
        </header>

        <div className="text-right sm:hidden">
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

        <SubscriptionList subscriptions={subscriptionList} />
      </div>
    </div>
  );
}
