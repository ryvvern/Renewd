type BillingCycle = "monthly" | "yearly" | string;

type SpendInput = {
  cost: number | null;
  billing_cycle: BillingCycle | null;
};

export function toMonthlyEquivalent({ cost, billing_cycle }: SpendInput): number {
  if (cost === null) {
    return 0;
  }
  return billing_cycle === "yearly" ? cost / 12 : cost;
}

export function getAverageMonthlySpend(subscriptions: SpendInput[]): number {
  if (subscriptions.length === 0) {
    return 0;
  }
  const total = subscriptions.reduce(
    (sum, subscription) => sum + toMonthlyEquivalent(subscription),
    0,
  );
  return total / subscriptions.length;
}
