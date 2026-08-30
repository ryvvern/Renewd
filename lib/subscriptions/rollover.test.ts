import { describe, expect, it } from "vitest";
import { getNextRenewalDate } from "./rollover";

describe("getNextRenewalDate", () => {
  it("returns a future date unchanged", () => {
    const today = new Date(2026, 5, 15); // Jun 15, 2026
    expect(getNextRenewalDate("2026-07-01", "monthly", today)).toBe(
      "2026-07-01",
    );
  });

  it("returns today's date unchanged", () => {
    const today = new Date(2026, 5, 15); // Jun 15, 2026
    expect(getNextRenewalDate("2026-06-15", "monthly", today)).toBe(
      "2026-06-15",
    );
  });

  it("rolls a monthly subscription forward once when it's one month overdue", () => {
    const today = new Date(2026, 5, 5); // Jun 5, 2026
    expect(getNextRenewalDate("2026-05-10", "monthly", today)).toBe(
      "2026-06-10",
    );
  });

  it("rolls Jan 31 monthly into a non-leap February (Feb 28)", () => {
    // 2026 is not a leap year, so Feb has 28 days.
    const today = new Date(2026, 1, 1); // Feb 1, 2026
    expect(getNextRenewalDate("2026-01-31", "monthly", today)).toBe(
      "2026-02-28",
    );
  });

  it("rolls Jan 31 monthly into a leap February (Feb 29)", () => {
    // 2028 is a leap year, so Feb has 29 days.
    const today = new Date(2028, 1, 1); // Feb 1, 2028
    expect(getNextRenewalDate("2028-01-31", "monthly", today)).toBe(
      "2028-02-29",
    );
  });

  it("re-clamps to the last day of the month on every step, not just once", () => {
    // Starting Jan 31, 2026, overdue until May 2026: each monthly step must
    // re-clamp against its own target month, not carry a "31" forward blindly.
    // Jan 31 -> Feb 28 -> Mar 28 -> Apr 28 -> May 28
    const today = new Date(2026, 4, 1); // May 1, 2026
    expect(getNextRenewalDate("2026-01-31", "monthly", today)).toBe(
      "2026-05-28",
    );
  });

  it("rolls Feb 29 yearly into a non-leap year (Feb 28)", () => {
    const today = new Date(2029, 1, 20); // Feb 20, 2029
    expect(getNextRenewalDate("2028-02-29", "yearly", today)).toBe(
      "2029-02-28",
    );
  });

  it("advances multiple months for a monthly subscription several cycles overdue", () => {
    // Jan 10 -> Feb 10 -> Mar 10 -> Apr 10 -> May 10, today is in May.
    const today = new Date(2026, 4, 5); // May 5, 2026
    expect(getNextRenewalDate("2026-01-10", "monthly", today)).toBe(
      "2026-05-10",
    );
  });

  it("advances multiple years for a yearly subscription several years overdue", () => {
    const today = new Date(2029, 5, 1); // Jun 1, 2029
    expect(getNextRenewalDate("2025-03-15", "yearly", today)).toBe(
      "2030-03-15",
    );
  });

  it("is not affected by time-of-day when comparing against today", () => {
    // today has a non-midnight time component; the date part is Jun 15, 2026.
    const today = new Date(2026, 5, 15, 23, 59, 59);
    expect(getNextRenewalDate("2026-06-15", "monthly", today)).toBe(
      "2026-06-15",
    );
    expect(getNextRenewalDate("2026-05-15", "monthly", today)).toBe(
      "2026-06-15",
    );
  });
});
