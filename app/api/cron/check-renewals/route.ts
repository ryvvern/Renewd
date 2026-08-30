import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";

import { createServiceClient } from "@/lib/supabase/service";
import { getNextRenewalDate } from "@/lib/subscriptions/rollover";

export const dynamic = "force-dynamic";

const REMINDER_WINDOW_DAYS = 3;
const REMINDER_FROM_ADDRESS = "onboarding@resend.dev";

type BillingCycle = "monthly" | "yearly";

type Subscription = {
  id: string;
  user_id: string;
  name: string | null;
  cost: number | null;
  billing_cycle: BillingCycle | null;
  next_renewal_date: string | null;
};

function isAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return false;
  }

  const secretParam = request.nextUrl.searchParams.get("secret");
  if (secretParam === expectedSecret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${expectedSecret}`) {
    return true;
  }

  return false;
}

function todayIsoDate(): string {
  const now = new Date();
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoDateDaysFromNow(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCost(cost: number | null): string {
  if (cost === null) {
    return "an unknown amount";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cost);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const errors: string[] = [];
  let remindersSent = 0;
  let rolledOver = 0;

  const today = todayIsoDate();
  const reminderCutoff = isoDateDaysFromNow(REMINDER_WINDOW_DAYS);

  const { data: subscriptions, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, user_id, name, cost, billing_cycle, next_renewal_date")
    .lte("next_renewal_date", reminderCutoff)
    .returns<Subscription[]>();

  if (fetchError) {
    return NextResponse.json(
      { remindersSent: 0, rolledOver: 0, errors: [fetchError.message] },
      { status: 500 },
    );
  }

  for (const subscription of subscriptions ?? []) {
    if (!subscription.next_renewal_date) {
      continue;
    }

    const isOverdue = subscription.next_renewal_date < today;

    if (isOverdue) {
      try {
        if (!subscription.billing_cycle) {
          throw new Error("missing billing_cycle");
        }
        const nextDate = getNextRenewalDate(
          subscription.next_renewal_date,
          subscription.billing_cycle,
        );
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({ next_renewal_date: nextDate })
          .eq("id", subscription.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
        rolledOver += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(
          `Failed to roll over subscription ${subscription.id}: ${message}`,
        );
      }
      continue;
    }

    // Upcoming within the reminder window (not overdue): send a reminder email.
    try {
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(subscription.user_id);

      if (userError) {
        throw new Error(userError.message);
      }
      const email = userData.user?.email;
      if (!email) {
        throw new Error("user has no email");
      }

      const name = subscription.name ?? "your subscription";
      const { error: sendError } = await resend.emails.send({
        from: REMINDER_FROM_ADDRESS,
        to: email,
        subject: `Reminder: ${name} renews soon`,
        text: `${name} renews on ${subscription.next_renewal_date} for ${formatCost(
          subscription.cost,
        )}.`,
      });

      if (sendError) {
        throw new Error(sendError.message);
      }
      remindersSent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(
        `Failed to send reminder for subscription ${subscription.id}: ${message}`,
      );
    }
  }

  return NextResponse.json({ remindersSent, rolledOver, errors });
}
