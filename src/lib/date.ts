/** Half-open `null`-friendly date range. */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/** A new `Date` at local midnight of the given day (drops the time part). */
export function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** First day of the month `n` months from `d`. */
export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function startOfWeek(d: Date, weekStartsOn = 0): Date {
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  return addDays(atMidnight(d), -diff);
}

/** `<0` if a is before b, `0` same day, `>0` after — compared by day only. */
export function compareDay(a: Date, b: Date): number {
  return atMidnight(a).getTime() - atMidnight(b).getTime();
}
export const isBeforeDay = (a: Date, b: Date) => compareDay(a, b) < 0;
export const isAfterDay = (a: Date, b: Date) => compareDay(a, b) > 0;
export const isBetweenDay = (d: Date, a: Date, b: Date) =>
  compareDay(d, a) >= 0 && compareDay(d, b) <= 0;

export function clampDay(d: Date, min?: Date | null, max?: Date | null): Date {
  if (min && isBeforeDay(d, min)) return atMidnight(min);
  if (max && isAfterDay(d, max)) return atMidnight(max);
  return atMidnight(d);
}

/** 42 dates (6 weeks) starting on the first visible day of `month`'s grid. */
export function calendarGrid(month: Date, weekStartsOn = 0): Date[] {
  const first = startOfWeek(startOfMonth(month), weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

/** Short weekday names ordered from `weekStartsOn`. */
export function weekdayLabels(weekStartsOn = 0, locale?: string): string[] {
  const sunday = new Date(2021, 7, 1); // 1 Aug 2021 is a Sunday
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) => fmt.format(addDays(sunday, (weekStartsOn + i) % 7)));
}

export function formatDate(
  d: Date,
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale, opts).format(d);
}

export function formatMonthLabel(d: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(d);
}

/** Locale-aware time string. `hour12` defaults to the locale's own preference. */
export function formatTime(
  d: Date,
  opts: { hour12?: boolean; withSeconds?: boolean } = {},
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    ...(opts.withSeconds ? { second: "2-digit" } : {}),
    ...(opts.hour12 == null ? {} : { hour12: opts.hour12 }),
  }).format(d);
}

/** Whether the given locale renders time in 12-hour form by default. */
export function isLocale12Hour(locale?: string): boolean {
  return new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12 ?? false;
}

/** Seconds since local midnight — for comparing the time-of-day part only. */
export function secondsOfDay(d: Date): number {
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

export function normalizeRange(a: Date, b: Date): DateRange {
  return isAfterDay(a, b)
    ? { start: atMidnight(b), end: atMidnight(a) }
    : { start: atMidnight(a), end: atMidnight(b) };
}
