import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useMediaQuery } from "../../hooks/use-media-query";
import { atMidnight, formatDate, isSameDay, type DateRange } from "../../lib/date";
import { Calendar } from "../calendar/calendar";
import { PopoverField, type DateFieldBaseProps } from "../calendar/popover-field";
import { buildDefaultPresets, type DateRangePreset } from "../calendar/presets";

export interface DateRangePickerProps extends DateFieldBaseProps {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onChange?: (range: DateRange) => void;
  min?: Date | null;
  max?: Date | null;
  disabledDate?: (date: Date) => boolean;
  weekStartsOn?: number;
  locale?: string;
  /** Year dropdown bounds — absolute (`fromYear` / `toYear`) or relative to the current year. */
  fromYear?: number;
  toYear?: number;
  pastYears?: number;
  futureYears?: number;
  /** Months side by side on `sm+` screens (mobile is always 1). Default `2`. */
  monthsToShow?: number;
  format?: (range: DateRange) => string;
  /** Show a quick-preset list beside the calendar. Auto-enabled when `presets` is passed. */
  showPresets?: boolean;
  /** Preset list — defaults to Today / This week / Last 7·15·30 days / This·Last month. */
  presets?: DateRangePreset[];
}

const EMPTY: DateRange = { start: null, end: null };

function defaultFormat(range: DateRange, locale?: string): string {
  const s = range.start ? formatDate(range.start, undefined, locale) : "…";
  const e = range.end ? formatDate(range.end, undefined, locale) : "…";
  return `${s} – ${e}`;
}

/**
 * Start/end date field + range calendar (two months on desktop, one on mobile).
 * With `showPresets` a quick-preset list sits left of the calendar (above it on
 * mobile).
 */
export function DateRangePicker({
  value: valueProp,
  defaultValue,
  onChange,
  min,
  max,
  disabledDate,
  weekStartsOn = 0,
  locale,
  fromYear,
  toYear,
  pastYears,
  futureYears,
  monthsToShow = 2,
  format,
  showPresets,
  presets,
  placeholder = "Pick a date range",
  ...field
}: DateRangePickerProps) {
  // `onChange` is notified explicitly (only once the range is complete / on clear).
  const [value, setValue] = useControllableState<DateRange | null>({
    value: valueProp,
    defaultValue: defaultValue ?? null,
  });
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const range = value ?? EMPTY;
  const complete = Boolean(range.start && range.end);

  const presetsShown = showPresets ?? Boolean(presets);
  const resolvedPresets = useMemo(
    () => presets ?? buildDefaultPresets(weekStartsOn),
    [presets, weekStartsOn],
  );

  const commit = useCallback(
    (r: DateRange) => {
      setValue(r);
      onChange?.(r);
      setOpen(false);
    },
    [setValue, onChange],
  );

  const select = useCallback(
    (r: DateRange) => {
      setValue(r);
      if (r.start && r.end) {
        onChange?.(r);
        setOpen(false);
      }
    },
    [setValue, onChange],
  );

  return (
    <PopoverField
      {...field}
      placeholder={placeholder}
      open={open}
      onOpenChange={setOpen}
      popoverWidth="auto"
      hasValue={complete}
      valueText={complete ? (format ? format(range) : defaultFormat(range, locale)) : null}
      onClear={() => {
        setValue(null);
        onChange?.(EMPTY);
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        {presetsShown ? (
          <ul
            role="listbox"
            aria-label="Range presets"
            className="mb-2 flex shrink-0 gap-1 overflow-x-auto border-b border-line pb-2 sm:mb-0 sm:w-40 sm:flex-col sm:gap-0.5 sm:overflow-visible sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3"
          >
            {resolvedPresets.map((p) => {
              const r = p.getRange(atMidnight(new Date()));
              const active = isSameDay(range.start, r.start) && isSameDay(range.end, r.end);
              return (
                <li
                  key={p.key}
                  role="option"
                  aria-selected={active}
                  onClick={() => commit(r)}
                  className={cn(
                    "shrink-0 cursor-pointer whitespace-nowrap rounded-gk-sm px-2.5 py-1.5 text-sm text-ink hover:bg-mint sm:shrink",
                    active && "bg-mint/60 font-medium",
                  )}
                >
                  {p.label}
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className={cn("min-w-0", presetsShown && "sm:pl-3")}>
          <Calendar
            mode="range"
            range={range}
            defaultMonth={range.start ?? undefined}
            onSelectRange={select}
            monthsToShow={isDesktop ? Math.max(1, monthsToShow) : 1}
            min={min}
            max={max}
            disabledDate={disabledDate}
            weekStartsOn={weekStartsOn}
            locale={locale}
            fromYear={fromYear}
            toYear={toYear}
            pastYears={pastYears}
            futureYears={futureYears}
          />
        </div>
      </div>
    </PopoverField>
  );
}
