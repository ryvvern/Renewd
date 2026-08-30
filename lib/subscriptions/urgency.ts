type CalendarDate = {
  year: number;
  month: number; // 1-12 (1 = January)
  day: number;
};

type UrgencyLevel = "red" | "amber" | "green";

const RED_MAX_DAYS = 5;
const AMBER_MAX_DAYS = 14;

function parseIsoDate(isoDate: string): CalendarDate {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year, month, day };
}

function toComparableDate(date: Date): CalendarDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function toUtcTimestamp({ year, month, day }: CalendarDate): number {
  return Date.UTC(year, month - 1, day);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return Math.round((toUtcTimestamp(to) - toUtcTimestamp(from)) / MS_PER_DAY);
}

export function getUrgencyLevel(
  nextRenewalDate: string,
  today: Date = new Date(),
): UrgencyLevel {
  const renewalDate = parseIsoDate(nextRenewalDate);
  const todayCalendar = toComparableDate(today);
  const daysUntilRenewal = daysBetween(todayCalendar, renewalDate);

  if (daysUntilRenewal <= RED_MAX_DAYS) {
    return "red";
  }
  if (daysUntilRenewal <= AMBER_MAX_DAYS) {
    return "amber";
  }
  return "green";
}

export function isDueSoon(
  nextRenewalDate: string,
  today: Date = new Date(),
): boolean {
  return getUrgencyLevel(nextRenewalDate, today) === "red";
}
