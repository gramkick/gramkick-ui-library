import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useMediaQuery } from "../../hooks/use-media-query";
import { formatTime, isLocale12Hour, secondsOfDay } from "../../lib/date";
import { PopoverField, type DateFieldBaseProps } from "../calendar/popover-field";

export interface TimePickerProps extends DateFieldBaseProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
  /** Earliest allowed time-of-day (only hours/minutes/seconds are compared). */
  min?: Date | null;
  /** Latest allowed time-of-day. */
  max?: Date | null;
  /** Minute increment in the minutes column. Default `5`. */
  minuteStep?: number;
  /** Second increment. Only used with `withSeconds`. Default `1`. */
  secondStep?: number;
  /** Add a seconds column. Default `false`. */
  withSeconds?: boolean;
  /** 12-hour clock with an AM/PM column. Defaults to the locale's preference. */
  hour12?: boolean;
  locale?: string;
  /** Reject individual time slots (gets a fully-specified `Date`). */
  disabledTime?: (date: Date) => boolean;
  /** Trigger text formatter. Default: locale time. */
  format?: (date: Date) => string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const range = (count: number, step: number) =>
  Array.from({ length: Math.ceil(count / step) }, (_, i) => i * step);

type Meridiem = "AM" | "PM";
const to24 = (h12: number, m: Meridiem) => (h12 % 12) + (m === "PM" ? 12 : 0);
const to12 = (h24: number) => ((h24 + 11) % 12) + 1;

interface TimeColumnProps {
  label: string;
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  isDisabled?: (value: number) => boolean;
  formatItem: (value: number) => string;
  big: boolean;
}

function TimeColumn({
  label,
  values,
  selected,
  onSelect,
  isDisabled,
  formatItem,
  big,
}: TimeColumnProps) {
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    const i = values.indexOf(selected);
    return i >= 0 ? i : 0;
  });

  useEffect(() => {
    const i = values.indexOf(selected);
    if (i >= 0) setActiveIndex(i);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const list = listRef.current;
    const item = activeRef.current;
    if (list && item)
      list.scrollTop = item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2;
  }, [activeIndex]);

  const move = useCallback(
    (dir: 1 | -1) => {
      const enabled = values.map((v, i) => (isDisabled?.(v) ? -1 : i)).filter((i) => i >= 0);
      if (!enabled.length) return;
      const pos = enabled.indexOf(activeIndex);
      const next =
        pos === -1
          ? dir > 0
            ? 0
            : enabled.length - 1
          : (pos + dir + enabled.length) % enabled.length;
      setActiveIndex(enabled[next]!);
    },
    [values, isDisabled, activeIndex],
  );

  const onKeyDown = (e: ReactKeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(values.findIndex((v) => !isDisabled?.(v)));
        break;
      case "End":
        e.preventDefault();
        for (let i = values.length - 1; i >= 0; i--)
          if (!isDisabled?.(values[i]!)) {
            setActiveIndex(i);
            break;
          }
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const v = values[activeIndex];
        if (v != null && !isDisabled?.(v)) onSelect(v);
        break;
      }
      default:
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="pb-1 text-center text-[0.625rem] font-semibold uppercase tracking-wide text-muted">
        {label || " "}
      </div>
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        aria-activedescendant={`${listId}-${activeIndex}`}
        onKeyDown={onKeyDown}
        className={cn(
          "flex flex-col gap-0.5 overflow-y-auto rounded-gk-sm outline-none",
          "focus-visible:ring-2 focus-visible:ring-leaf/30",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          big ? "max-h-[40vh]" : "max-h-56",
        )}
      >
        {values.map((v, i) => {
          const isSel = v === selected;
          const disabled = isDisabled?.(v) ?? false;
          return (
            <li
              key={v}
              id={`${listId}-${i}`}
              ref={i === activeIndex ? activeRef : undefined}
              role="option"
              aria-selected={isSel}
              aria-disabled={disabled || undefined}
              onMouseEnter={() => !disabled && setActiveIndex(i)}
              onClick={() => !disabled && onSelect(v)}
              className={cn(
                "shrink-0 cursor-pointer rounded-gk-sm text-center tabular-nums transition-colors",
                big ? "py-2.5 text-base" : "py-1.5 text-sm",
                "hover:bg-mint",
                disabled && "pointer-events-none text-muted/40 line-through",
                isSel ? "bg-leaf font-semibold text-white hover:bg-leaf-dark" : "text-ink",
                !isSel && i === activeIndex && "bg-mint",
              )}
            >
              {formatItem(v)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Time field + column picker popover. Same field pattern, sizes and variants as
 * `DatePicker` (`variant` `outline` / `filled` × `size` `sm` / `md` / `lg`,
 * `label` / `hint` / `error` / `disabled` / `readOnly` / `invalid` / `clearable`).
 * The popover flips upward when short of room and stays open while you pick
 * (a footer "Done" closes it); on small screens the columns get larger tap
 * targets and pin to the field width.
 */
export function TimePicker({
  value: valueProp,
  defaultValue,
  onChange,
  min,
  max,
  minuteStep = 5,
  secondStep = 1,
  withSeconds = false,
  hour12: hour12Prop,
  locale,
  disabledTime,
  format,
  placeholder = "Pick a time",
  ...field
}: TimePickerProps) {
  const [value, setValue] = useControllableState<Date | null>({
    value: valueProp,
    defaultValue: defaultValue ?? null,
    onChange,
  });
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const hour12 = hour12Prop ?? isLocale12Hour(locale);

  // The date the popover mutates — keeps the day part of the current value.
  const base = useMemo(() => {
    const d = value ? new Date(value) : new Date();
    if (!value) d.setHours(0, 0, 0, 0);
    d.setMilliseconds(0);
    return d;
  }, [value]);

  const curH = base.getHours();
  const curM = base.getMinutes();
  const curS = base.getSeconds();
  const meridiem: Meridiem = curH < 12 ? "AM" : "PM";

  const atHMS = useCallback(
    (h: number, m: number, s: number) => {
      const d = new Date(base);
      d.setHours(h, m, s, 0);
      return d;
    },
    [base],
  );

  const minSecs = min ? secondsOfDay(min) : null;
  const maxSecs = max ? secondsOfDay(max) : null;

  const hourDisabled = useCallback(
    (h24: number) => {
      if (minSecs != null && secondsOfDay(atHMS(h24, 59, 59)) < minSecs) return true;
      if (maxSecs != null && secondsOfDay(atHMS(h24, 0, 0)) > maxSecs) return true;
      return false;
    },
    [minSecs, maxSecs, atHMS],
  );
  const minuteDisabled = useCallback(
    (m: number) => {
      if (minSecs != null && secondsOfDay(atHMS(curH, m, 59)) < minSecs) return true;
      if (maxSecs != null && secondsOfDay(atHMS(curH, m, 0)) > maxSecs) return true;
      return withSeconds ? false : (disabledTime?.(atHMS(curH, m, 0)) ?? false);
    },
    [minSecs, maxSecs, atHMS, curH, withSeconds, disabledTime],
  );
  const secondDisabled = useCallback(
    (s: number) => {
      const d = atHMS(curH, curM, s);
      const secs = secondsOfDay(d);
      if (minSecs != null && secs < minSecs) return true;
      if (maxSecs != null && secs > maxSecs) return true;
      return disabledTime?.(d) ?? false;
    },
    [atHMS, curH, curM, minSecs, maxSecs, disabledTime],
  );

  const hourValues = useMemo(
    () => (hour12 ? [12, ...Array.from({ length: 11 }, (_, i) => i + 1)] : range(24, 1)),
    [hour12],
  );
  const minuteValues = useMemo(() => range(60, Math.max(1, minuteStep)), [minuteStep]);
  const secondValues = useMemo(() => range(60, Math.max(1, secondStep)), [secondStep]);

  const selectHour = (h: number) => {
    const h24 = hour12 ? to24(h, meridiem) : h;
    setValue(atHMS(h24, curM, withSeconds ? curS : 0));
  };
  const selectMinute = (m: number) => setValue(atHMS(curH, m, withSeconds ? curS : 0));
  const selectSecond = (s: number) => setValue(atHMS(curH, curM, s));
  const selectMeridiem = (m: number) => {
    const target: Meridiem = m === 1 ? "PM" : "AM";
    if (target === meridiem) return;
    setValue(atHMS(to24(to12(curH), target), curM, withSeconds ? curS : 0));
  };

  const big = !isDesktop;

  return (
    <PopoverField
      {...field}
      placeholder={placeholder}
      open={open}
      onOpenChange={setOpen}
      // Desktop: a fixed compact popover. Mobile: pin to the field's own width so
      // it can never spill past the viewport (no stray horizontal scroll).
      popoverWidth={isDesktop ? "auto" : "field"}
      hasValue={value != null}
      valueText={
        value ? (format ? format(value) : formatTime(value, { hour12, withSeconds }, locale)) : null
      }
      onClear={() => setValue(null)}
    >
      <div className={cn("flex flex-col", isDesktop ? "w-[15rem]" : "w-full")}>
        <div className="flex gap-1">
          <TimeColumn
            label="Hour"
            big={big}
            values={hourValues}
            selected={hour12 ? to12(curH) : curH}
            onSelect={selectHour}
            isDisabled={(h) => hourDisabled(hour12 ? to24(h, meridiem) : h)}
            formatItem={(h) => (hour12 ? String(h) : pad(h))}
          />
          <TimeColumn
            label="Min"
            big={big}
            values={minuteValues}
            selected={curM}
            onSelect={selectMinute}
            isDisabled={minuteDisabled}
            formatItem={pad}
          />
          {withSeconds ? (
            <TimeColumn
              label="Sec"
              big={big}
              values={secondValues}
              selected={curS}
              onSelect={selectSecond}
              isDisabled={secondDisabled}
              formatItem={pad}
            />
          ) : null}
          {hour12 ? (
            <TimeColumn
              label="AM/PM"
              big={big}
              values={[0, 1]}
              selected={meridiem === "PM" ? 1 : 0}
              onSelect={selectMeridiem}
              formatItem={(v) => (v === 1 ? "PM" : "AM")}
            />
          ) : null}
        </div>

        <div className="mt-2 flex justify-end border-t border-line pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-gk-sm bg-leaf px-3 py-1 text-sm font-semibold text-white hover:bg-leaf-dark"
          >
            Done
          </button>
        </div>
      </div>
    </PopoverField>
  );
}
