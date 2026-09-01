import { useCallback, useState } from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { atMidnight, formatDate } from "../../lib/date";
import { Calendar } from "../calendar/calendar";
import {
  PopoverField,
  dateFieldVariants,
  type DateFieldBaseProps,
} from "../calendar/popover-field";

export { dateFieldVariants };

export interface DatePickerProps extends DateFieldBaseProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
  min?: Date | null;
  max?: Date | null;
  disabledDate?: (date: Date) => boolean;
  /** 0 = Sunday (default) … 6 = Saturday. */
  weekStartsOn?: number;
  locale?: string;
  /** Year dropdown bounds — absolute (`fromYear` / `toYear`) or relative to the current year. */
  fromYear?: number;
  toYear?: number;
  pastYears?: number;
  futureYears?: number;
  /** Trigger text formatter. Default: locale medium date. */
  format?: (date: Date) => string;
}

/**
 * Single-date field + calendar popover. Same field pattern as `Dropdown`
 * (`label` / `placeholder` / `hint` / `error` / `disabled` / `readOnly` /
 * `invalid` / `variant` / `size` / `clearable`); the popover flips upward when
 * short of room below and the grid is fluid for small screens.
 */
export function DatePicker({
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
  format,
  placeholder = "Pick a date",
  ...field
}: DatePickerProps) {
  const [value, setValue] = useControllableState<Date | null>({
    value: valueProp,
    defaultValue: defaultValue ?? null,
    onChange,
  });
  const [open, setOpen] = useState(false);

  const select = useCallback(
    (d: Date) => {
      setValue(atMidnight(d));
      setOpen(false);
    },
    [setValue],
  );

  return (
    <PopoverField
      {...field}
      placeholder={placeholder}
      open={open}
      onOpenChange={setOpen}
      popoverWidth="auto"
      hasValue={value != null}
      valueText={value ? (format ? format(value) : formatDate(value, undefined, locale)) : null}
      onClear={() => setValue(null)}
    >
      <Calendar
        mode="single"
        selected={value}
        defaultMonth={value ?? undefined}
        onSelectDate={select}
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
    </PopoverField>
  );
}
