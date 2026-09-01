import { useCallback, useMemo, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useMediaQuery } from "../../hooks/use-media-query";
import { atMidnight, formatDate, isSameDay, type DateRange } from "../../lib/date";
import { Calendar } from "../calendar/calendar";
import { PopoverField, type DateFieldBaseProps } from "../calendar/popover-field";
import { buildDefaultPresets, type DateRangePreset } from "../calendar/presets";

export { buildDefaultPresets, type DateRangePreset };

export interface DropdownRangePickerProps extends DateFieldBaseProps {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  /** `presetKey` is the chosen preset's key, or `"custom"`. */
  onChange?: (range: DateRange, presetKey: string) => void;
  /** Replace the preset list. */
  presets?: DateRangePreset[];
  /** Show the "Custom range" row that opens the calendar. Default `true`. */
  allowCustom?: boolean;
  customLabel?: ReactNode;
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
  monthsToShow?: number;
  format?: (range: DateRange, presetKey: string | null) => string;
}

function rangeText(range: DateRange, locale?: string): string {
  const s = range.start ? formatDate(range.start, undefined, locale) : "…";
  const e = range.end ? formatDate(range.end, undefined, locale) : "…";
  return isSameDay(range.start, range.end) && range.start ? s : `${s} – ${e}`;
}

/**
 * A range field whose popover is a list of quick presets (Today, This week,
 * Last 15 days, …) plus an optional "Custom range" row that swaps in the range
 * calendar. Same field pattern + upward-flip as `Dropdown`.
 */
export function DropdownRangePicker({
  value: valueProp,
  defaultValue,
  onChange,
  presets,
  allowCustom = true,
  customLabel = "Custom range",
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
  placeholder = "Select a range",
  ...field
}: DropdownRangePickerProps) {
  // `onChange` is fired explicitly by `commit` / `onClear` so it carries the preset key.
  const [value, setValue] = useControllableState<DateRange | null>({
    value: valueProp,
    defaultValue: defaultValue ?? null,
  });
  const [presetKey, setPresetKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"presets" | "custom">("presets");
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const resolvedPresets = useMemo(
    () => presets ?? buildDefaultPresets(weekStartsOn),
    [presets, weekStartsOn],
  );

  const commit = useCallback(
    (range: DateRange, key: string) => {
      setValue(range);
      setPresetKey(key);
      onChange?.(range, key);
      setOpen(false);
      setMode("presets");
    },
    [setValue, onChange],
  );

  const range = value ?? { start: null, end: null };
  const complete = Boolean(range.start && range.end);
  const activePreset = presetKey ? resolvedPresets.find((p) => p.key === presetKey) : undefined;

  const valueText = complete
    ? format
      ? format(range, presetKey)
      : activePreset
        ? activePreset.label
        : rangeText(range, locale)
    : null;

  return (
    <PopoverField
      {...field}
      placeholder={placeholder}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setMode("presets");
      }}
      popoverWidth={mode === "custom" ? "auto" : "field"}
      popoverClassName={mode === "presets" ? "p-0" : undefined}
      hasValue={complete}
      valueText={valueText}
      onClear={() => {
        setValue(null);
        setPresetKey(null);
        onChange?.({ start: null, end: null }, "custom");
      }}
    >
      {mode === "presets" ? (
        <ul role="listbox" aria-label="Range presets" className="max-h-72 overflow-y-auto py-1">
          {resolvedPresets.map((p) => {
            const selected = presetKey === p.key;
            return (
              <li
                key={p.key}
                role="option"
                aria-selected={selected}
                onClick={() => commit(p.getRange(atMidnight(new Date())), p.key)}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm text-ink hover:bg-mint",
                  selected && "bg-mint/60 font-medium",
                )}
              >
                {p.label}
              </li>
            );
          })}
          {allowCustom ? (
            <li
              role="option"
              aria-selected={presetKey === "custom"}
              onClick={() => setMode("custom")}
              className={cn(
                "flex cursor-pointer items-center justify-between border-t border-line px-3 py-2 text-sm font-medium text-leaf hover:bg-mint",
                presetKey === "custom" && "bg-mint/60",
              )}
            >
              {customLabel}
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="size-3.5"
                aria-hidden="true"
              >
                <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </li>
          ) : null}
        </ul>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setMode("presets")}
            className="mb-2 flex cursor-pointer items-center gap-1 text-xs font-medium text-muted hover:text-ink"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="size-3.5"
              aria-hidden="true"
            >
              <path d="M10 3l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Presets
          </button>
          <Calendar
            mode="range"
            range={range}
            defaultMonth={range.start ?? undefined}
            onSelectRange={(r) => commit(r, "custom")}
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
      )}
    </PopoverField>
  );
}
