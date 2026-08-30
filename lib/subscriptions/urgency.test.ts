import { describe, expect, it } from "vitest";
import { getUrgencyLevel, isDueSoon } from "./urgency";

describe("getUrgencyLevel", () => {
  it("is red for a renewal date that is today", () => {
    const today = new Date(2026, 5, 15); // Jun 15, 2026
    expect(getUrgencyLevel("2026-06-15", today)).toBe("red");
    expect(isDueSoon("2026-06-15", today)).toBe(true);
  });

  it("is red for an overdue renewal date", () => {
    const today = new Date(2026, 5, 15); // Jun 15, 2026
    expect(getUrgencyLevel("2026-06-01", today)).toBe("red");
  });

  it("is red for a date within 5 days", () => {
    const today = new Date(2026, 5, 15); // Jun 15, 2026
    expect(getUrgencyLevel("2026-06-20", today)).toBe("red"); // +5 days
  });

  it("is amber right at the 5/6 day boundary", () => {
    const today = new Date(2026, 5, 15); // Jun 15, 2026
    expect(getUrgencyLevel("2026-06-20", today)).toBe("red"); // +5 days -> red
    expect(getUrgencyLevel("2026-06-21", today)).toBe("amber"); // +6 days -> amber
  });

  it("is green right at the 14/15 day boundary", () => {
    const today = new Date(2026, 5, 15); // Jun 15, 2026
    expect(getUrgencyLevel("2026-06-29", today)).toBe("amber"); // +14 days -> amber
    expect(getUrgencyLevel("2026-06-30", today)).toBe("green"); // +15 days -> green
  });

  it("is green for a date far in the future", () => {
    const today = new Date(2026, 5, 15); // Jun 15, 2026
    expect(getUrgencyLevel("2027-01-01", today)).toBe("green");
    expect(isDueSoon("2027-01-01", today)).toBe(false);
  });
});
