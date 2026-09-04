import { toMonthlyEquivalent } from "@/lib/subscriptions/spend";
import type { Subscription } from "./subscription-list";

const MAX_UPCOMING = 5;
const SPARKLINE_WIDTH = 240;
const SPARKLINE_HEIGHT = 60;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const yearTotalFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCost(cost: number | null): string {
  if (cost === null) {
    return "—";
  }
  return currencyFormatter.format(cost);
}

function getPriciestSubscription(
  subscriptions: Subscription[],
): Subscription | null {
  return subscriptions.reduce<Subscription | null>((priciest, current) => {
    if (!priciest) {
      return current;
    }
    return toMonthlyEquivalent(current) > toMonthlyEquivalent(priciest)
      ? current
      : priciest;
  }, null);
}

function getAnnualEquivalent(subscription: Subscription): number {
  return toMonthlyEquivalent(subscription) * 12;
}

/**
 * Builds a 12-point cumulative-spend curve for the sparkline. There's no real
 * historical time-series data (subscriptions only store their next renewal
 * date, not a spend history), so this is a visual approximation: each
 * subscription's annual-equivalent cost is bucketed into the calendar month
 * its next renewal falls in, then accumulated month-over-month across the
 * year. This produces a plausible upward trend line, not an accurate
 * historical record.
 */
function getCumulativeSpendByMonth(subscriptions: Subscription[]): number[] {
  const monthlyTotals = new Array<number>(12).fill(0);

  for (const subscription of subscriptions) {
    if (!subscription.next_renewal_date) {
      continue;
    }
    const monthIndex = new Date(
      `${subscription.next_renewal_date}T00:00:00`,
    ).getMonth();
    monthlyTotals[monthIndex] += getAnnualEquivalent(subscription);
  }

  const cumulative: number[] = [];
  let runningTotal = 0;
  for (const monthTotal of monthlyTotals) {
    runningTotal += monthTotal;
    cumulative.push(runningTotal);
  }
  return cumulative;
}

function buildSparklinePath(values: number[]): string {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = SPARKLINE_WIDTH / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y =
        SPARKLINE_HEIGHT - ((value - min) / range) * SPARKLINE_HEIGHT;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function UpcomingPanel({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  if (subscriptions.length === 0) {
    return null;
  }

  const upcoming = subscriptions
    .filter((subscription) => !!subscription.next_renewal_date)
    .slice(0, MAX_UPCOMING);
  const priciest = getPriciestSubscription(subscriptions);
  const yearTotal = subscriptions.reduce(
    (sum, subscription) => sum + getAnnualEquivalent(subscription),
    0,
  );
  const sparklinePath = buildSparklinePath(
    getCumulativeSpendByMonth(subscriptions),
  );

  return (
    <div className="hidden min-w-0 flex-1 self-stretch border-l border-white/[.08] bg-background sm:flex sm:flex-col sm:items-center sm:justify-center">
      <div
        className="w-full max-w-[320px] rounded-xl bg-[#151515]"
        style={{
          paddingLeft: 28,
          paddingRight: 28,
          paddingTop: 40,
          paddingBottom: 40,
        }}
      >
        {upcoming.length > 0 && (
          <div>
            <p
              className="font-mono text-[11px] font-medium text-white/40 uppercase"
              style={{ letterSpacing: "0.08em" }}
            >
              Upcoming
              <span
                aria-hidden="true"
                className="animate-splash-cursor-blink text-[var(--accent-pink)]"
              >
                .
              </span>
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {upcoming.map((subscription) => (
                <li
                  key={subscription.id}
                  className="flex items-baseline justify-between gap-2"
                >
                  <span className="truncate text-[15px] font-normal text-white">
                    {subscription.name}
                  </span>
                  <span className="shrink-0 font-mono text-[15px] font-normal text-white">
                    {formatCost(subscription.cost)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <div className="border-t border-white/[.08]" />
          <div style={{ marginTop: 12 }}>
            <p
              className="font-mono text-[10.5px] font-medium text-white/35 uppercase"
              style={{ letterSpacing: "0.1em" }}
            >
              This year
            </p>
            <p
              className="font-mono font-bold text-white"
              style={{ marginTop: 8, fontSize: 28 }}
            >
              {yearTotalFormatter.format(yearTotal)}
            </p>
            <svg
              viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
              width={SPARKLINE_WIDTH}
              height={SPARKLINE_HEIGHT}
              fill="none"
              aria-hidden="true"
              style={{ marginTop: 12, display: "block" }}
            >
              <path
                d={sparklinePath}
                stroke="var(--accent-pink)"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {priciest && (
          <div style={{ marginTop: 20 }}>
            <div className="border-t border-white/[.08]" />
            <div style={{ marginTop: 12 }}>
              <p
                className="font-mono text-[10.5px] font-medium text-white/35 uppercase"
                style={{ letterSpacing: "0.1em" }}
              >
                Priciest
              </p>
              <div style={{ marginTop: 8 }}>
                <p className="truncate text-[16px] font-normal text-white">
                  {priciest.name}
                </p>
                <p className="font-mono text-[20px] font-semibold text-[var(--accent-pink)]">
                  {formatCost(priciest.cost)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
