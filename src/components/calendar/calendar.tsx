import { useCallback, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cn } from "../../lib/cn";
import { MiniSelect } from "./mini-select";
import {
  addDays,
  addMonths,
  atMidnight,
  calendarGrid,
  clampDay,
  endOfMonth,
  formatDate,
  formatMonthLabel,
  isAfterDay,
  isBeforeDay,
  isBetweenDay,
  isSameDay,
  isSameMonth,
  normalizeRange,
  startOfMonth,
  weekdayLabels,
  type DateRange,
} from "../../lib/date";

function Chevron({ className, dir }: { className?: string; dir: "left" | "right" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path
        d={dir === "left" ? "M10 3l-5 5 5 5" : "M6 3l5 5-5 5"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface CalendarProps {
  mode?: "single" | "range";
  /** Controlled view month (any day within it). */
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** Months rendered side by side. Default `1`. */
  monthsToShow?: number;
  /** Selected day (single mode). */
  selected?: Date | null;
  /** Committed range (range mode). */
  range?: DateRange | null;
  onSelectDate?: (date: Date) => void;
  onSelectRange?: (range: DateRange) => void;
  min?: Date | null;
  max?: Date | null;
  disabledDate?: (date: Date) => boolean;
  /** 0 = Sunday (default) … 6 = Saturday. */
  weekStartsOn?: number;
  locale?: string;
  /** Month + year dropdown header instead of a text label. Default `true`. */
  monthDropdown?: boolean;
  /** Earliest year in the header year dropdown (absolute). Overrides `pastYears`. */
  fromYear?: number;
  /** Latest year in the header year dropdown (absolute). Overrides `futureYears`. */
  toYear?: number;
  /** Years before the current year to list in the header dropdown. Default `10`. */
  pastYears?: number;
  /** Years after the current year to list in the header dropdown. Default `10`. */
  futureYears?: number;
  className?: string;
}

/** A month grid — the shared primitive behind `DatePicker` / `DateRangePicker`. */
export function Calendar({
  mode = "single",
  month: monthProp,
  defaultMonth,
  onMonthChange,
  monthsToShow = 1,
  selected,
  range,
  onSelectDate,
  onSelectRange,
  min,
  max,
  disabledDate,
  weekStartsOn = 0,
  locale,
  monthDropdown,
  fromYear,
  toYear,
  pastYears = 10,
  futureYears = 10,
  className,
}: CalendarProps) {
  const initial = startOfMonth(defaultMonth ?? selected ?? range?.start ?? new Date());
  const [uncontrolledMonth, setUncontrolledMonth] = useState(initial);
  const viewMonth = monthProp ? startOfMonth(monthProp) : uncontrolledMonth;

  const [draftStart, setDraftStart] = useState<Date | null>(null);
  const [hoverDay, setHoverDay] = useState<Date | null>(null);
  const [focusDay, setFocusDay] = useState<Date>(() =>
    clampDay(selected ?? range?.start ?? new Date(), min, max),
  );

  const setMonth = useCallback(
    (m: Date) => {
      const next = startOfMonth(m);
      if (!monthProp) setUncontrolledMonth(next);
      onMonthChange?.(next);
      setFocusDay((prev) => (isSameMonth(prev, next) ? prev : clampDay(next, min, max)));
    },
    [monthProp, onMonthChange, min, max],
  );

  const weekdays = useMemo(() => weekdayLabels(weekStartsOn, locale), [weekStartsOn, locale]);
  const months = Array.from({ length: Math.max(1, monthsToShow) }, (_, i) =>
    addMonths(viewMonth, i),
  );

  const showDropdowns = monthDropdown ?? true;
  const viewYear = viewMonth.getFullYear();
  const viewMonthIndex = viewMonth.getMonth();
  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2020, i, 1)),
      ),
    [locale],
  );
  const yearOptions = useMemo(() => {
    const thisYear = new Date().getFullYear();
    let lo = fromYear ?? thisYear - Math.max(0, pastYears);
    let hi = toYear ?? thisYear + Math.max(0, futureYears);
    if (min) lo = Math.max(lo, min.getFullYear());
    if (max) hi = Math.min(hi, max.getFullYear());
    // Always keep the year currently in view selectable.
    lo = Math.min(lo, viewYear);
    hi = Math.max(hi, viewYear, lo);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }, [fromYear, toYear, pastYears, futureYears, min, max, viewYear]);

  const isDisabled = useCallback(
    (d: Date) => {
      if (min && isBeforeDay(d, min)) return true;
      if (max && isAfterDay(d, max)) return true;
      return Boolean(disabledDate?.(d));
    },
    [min, max, disabledDate],
  );

  // Effective range for painting: an in-progress draft, else the committed range.
  const previewRange: DateRange | null = draftStart
    ? normalizeRange(draftStart, hoverDay ?? draftStart)
    : (range ?? null);

  const pickDay = useCallback(
    (d: Date) => {
      if (isDisabled(d)) return;
      const day = atMidnight(d);
      if (mode === "single") {
        onSelectDate?.(day);
        return;
      }
      if (!draftStart) {
        setDraftStart(day);
        setHoverDay(day);
      } else {
        onSelectRange?.(normalizeRange(draftStart, day));
        setDraftStart(null);
        setHoverDay(null);
      }
    },
    [isDisabled, mode, onSelectDate, draftStart, onSelectRange],
  );

  const onGridKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      // Let the header's month/year dropdowns handle their own keys.
      if ((e.target as HTMLElement).closest('[role="combobox"],[role="listbox"]')) return;
      let next: Date | null = null;
      switch (e.key) {
        case "ArrowLeft":
          next = addDays(focusDay, -1);
          break;
        case "ArrowRight":
          next = addDays(focusDay, 1);
          break;
        case "ArrowUp":
          next = addDays(focusDay, -7);
          break;
        case "ArrowDown":
          next = addDays(focusDay, 7);
          break;
        case "PageUp":
          next = addMonths(focusDay, -1);
          break;
        case "PageDown":
          next = addMonths(focusDay, 1);
          break;
        case "Home":
          next = addDays(focusDay, -((focusDay.getDay() - weekStartsOn + 7) % 7));
          break;
        case "End":
          next = addDays(focusDay, 6 - ((focusDay.getDay() - weekStartsOn + 7) % 7));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          pickDay(focusDay);
          return;
        default:
          return;
      }
      e.preventDefault();
      const clamped = clampDay(next, min, max);
      setFocusDay(clamped);
      if (!isSameMonth(clamped, viewMonth)) setMonth(clamped);
    },
    [focusDay, weekStartsOn, pickDay, min, max, viewMonth, setMonth],
  );

  const canGoPrev = !min || isBeforeDay(startOfMonth(min), viewMonth);
  const canGoNext = !max || isBeforeDay(addMonths(viewMonth, months.length - 1), startOfMonth(max));

  const navBtn =
    "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-gk-sm text-muted transition-colors hover:bg-mint hover:text-ink disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className={cn("select-none", className)} onKeyDown={onGridKeyDown}>
      <div className="flex gap-4">
        {months.map((m, mi) => {
          const days = calendarGrid(m, weekStartsOn);
          const isFirst = mi === 0;
          const isLast = mi === months.length - 1;

          return (
            <div key={mi} aria-label={formatMonthLabel(m, locale)} className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between gap-1">
                {isFirst ? (
                  <button
                    type="button"
                    aria-label="Previous month"
                    disabled={!canGoPrev}
                    onClick={() => setMonth(addMonths(viewMonth, -1))}
                    className={navBtn}
                  >
                    <Chevron dir="left" className="size-4" />
                  </button>
                ) : (
                  <span className="size-8 shrink-0" aria-hidden="true" />
                )}

                {isFirst && showDropdowns ? (
                  <div className="flex flex-1 items-center justify-center gap-1">
                    <MiniSelect
                      ariaLabel="Month"
                      value={String(viewMonthIndex)}
                      onChange={(v) => setMonth(new Date(viewYear, Number(v), 1))}
                      options={monthNames.map((name, i) => ({
                        value: String(i),
                        label: name,
                        disabled:
                          (min != null && isBeforeDay(endOfMonth(new Date(viewYear, i, 1)), min)) ||
                          (max != null && isAfterDay(new Date(viewYear, i, 1), max)),
                      }))}
                    />
                    <MiniSelect
                      ariaLabel="Year"
                      align="end"
                      value={String(viewYear)}
                      onChange={(v) => setMonth(new Date(Number(v), viewMonthIndex, 1))}
                      options={yearOptions.map((y) => ({ value: String(y), label: String(y) }))}
                    />
                  </div>
                ) : (
                  <div className="flex-1 text-center text-sm font-semibold text-ink">
                    {formatMonthLabel(m, locale)}
                  </div>
                )}

                {isLast ? (
                  <button
                    type="button"
                    aria-label="Next month"
                    disabled={!canGoNext}
                    onClick={() => setMonth(addMonths(viewMonth, 1))}
                    className={navBtn}
                  >
                    <Chevron dir="right" className="size-4" />
                  </button>
                ) : (
                  <span className="size-8 shrink-0" aria-hidden="true" />
                )}
              </div>

              <div className="grid grid-cols-7">
                {weekdays.map((w, i) => (
                  <div
                    key={i}
                    className="flex h-8 items-center justify-center text-xs font-medium text-muted"
                  >
                    {w}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {days.map((d, di) => {
                  const outside = !isSameMonth(d, m);
                  const disabled = isDisabled(d);
                  const today = isSameDay(d, new Date());
                  const isStart =
                    mode === "range" && Boolean(previewRange) && isSameDay(d, previewRange!.start);
                  const isEnd =
                    mode === "range" && Boolean(previewRange) && isSameDay(d, previewRange!.end);
                  const inRange =
                    mode === "range" &&
                    Boolean(previewRange?.start && previewRange?.end) &&
                    isBetweenDay(d, previewRange!.start!, previewRange!.end!);
                  const isSelectedSingle = mode === "single" && isSameDay(d, selected ?? null);
                  const isEndpoint = isStart || isEnd || isSelectedSingle;
                  const isFocus = isSameDay(d, focusDay);
                  const singleDayRange = isStart && isEnd;

                  return (
                    <div key={di} className="relative flex h-9 items-center justify-center">
                      {inRange && !singleDayRange ? (
                        // Range band — full cell width so it covers the endpoint circle,
                        // inset 2px top/bottom so week rows keep a visible gap.
                        <span
                          aria-hidden="true"
                          className={cn(
                            "pointer-events-none absolute inset-y-[2px] inset-x-0 bg-mint",
                            isStart && "rounded-l-full",
                            isEnd && "rounded-r-full",
                          )}
                        />
                      ) : null}
                      <button
                        type="button"
                        tabIndex={isFocus ? 0 : -1}
                        disabled={disabled}
                        aria-disabled={disabled || undefined}
                        aria-selected={isEndpoint || inRange || undefined}
                        aria-label={formatDate(
                          d,
                          { weekday: "long", year: "numeric", month: "long", day: "numeric" },
                          locale,
                        )}
                        onClick={() => pickDay(d)}
                        onFocus={() => setFocusDay(atMidnight(d))}
                        onMouseEnter={() => draftStart && setHoverDay(atMidnight(d))}
                        className={cn(
                          "relative flex size-8 cursor-pointer items-center justify-center rounded-full text-sm transition-colors",
                          "hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40",
                          "disabled:pointer-events-none disabled:cursor-default disabled:text-muted/40 disabled:line-through",
                          outside && "text-muted/50",
                          !outside && !isEndpoint && "text-ink",
                          today && !isEndpoint && "font-semibold text-leaf",
                          isEndpoint && "bg-leaf font-semibold text-white hover:bg-leaf-dark",
                        )}
                      >
                        {d.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
