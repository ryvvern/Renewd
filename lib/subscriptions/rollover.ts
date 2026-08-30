type BillingCycle = "monthly" | "yearly";

type CalendarDate = {
  year: number;
  month: number; // 1-11 (1 = January)
  day: number;
};

function parseIsoDate(isoDate: string): CalendarDate {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year, month, day };
}

function formatIsoDate({ year, month, day }: CalendarDate): string {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of `month`.
  return new Date(year, month, 0).getDate();
}

function toComparableDate(date: Date): CalendarDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

function addOneMonth(date: CalendarDate): CalendarDate {
  const month = date.month === 12 ? 1 : date.month + 1;
  const year = date.month === 12 ? date.year + 1 : date.year;
  const day = Math.min(date.day, daysInMonth(year, month));
  return { year, month, day };
}

function addOneYear(date: CalendarDate): CalendarDate {
  const year = date.year + 1;
  const day = Math.min(date.day, daysInMonth(year, date.month));
  return { year, month: date.month, day };
}

export function getNextRenewalDate(
  currentDate: string,
  billingCycle: BillingCycle,
  today: Date = new Date(),
): string {
  let date = parseIsoDate(currentDate);
  const todayCalendar = toComparableDate(today);
  const advance = billingCycle === "monthly" ? addOneMonth : addOneYear;

  while (compareCalendarDates(date, todayCalendar) < 0) {
    date = advance(date);
  }

  return formatIsoDate(date);
}
