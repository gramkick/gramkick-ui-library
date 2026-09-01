import type { ReactNode } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  startOfMonth,
  startOfWeek,
  type DateRange,
} from "../../lib/date";

export interface DateRangePreset {
  key: string;
  label: ReactNode;
  /** `today` is passed at local midnight. */
  getRange: (today: Date) => DateRange;
}

/** Today, Yesterday, This week, Last 7 / 15 / 30 days, This month, Last month. */
export function buildDefaultPresets(weekStartsOn = 0): DateRangePreset[] {
  return [
    { key: "today", label: "Today", getRange: (t) => ({ start: t, end: t }) },
    {
      key: "yesterday",
      label: "Yesterday",
      getRange: (t) => ({ start: addDays(t, -1), end: addDays(t, -1) }),
    },
    {
      key: "this-week",
      label: "This week",
      getRange: (t) => ({ start: startOfWeek(t, weekStartsOn), end: t }),
    },
    { key: "last-7", label: "Last 7 days", getRange: (t) => ({ start: addDays(t, -6), end: t }) },
    {
      key: "last-15",
      label: "Last 15 days",
      getRange: (t) => ({ start: addDays(t, -14), end: t }),
    },
    {
      key: "last-30",
      label: "Last 30 days",
      getRange: (t) => ({ start: addDays(t, -29), end: t }),
    },
    {
      key: "this-month",
      label: "This month",
      getRange: (t) => ({ start: startOfMonth(t), end: t }),
    },
    {
      key: "last-month",
      label: "Last month",
      getRange: (t) => ({
        start: startOfMonth(addMonths(t, -1)),
        end: endOfMonth(addMonths(t, -1)),
      }),
    },
  ];
}
