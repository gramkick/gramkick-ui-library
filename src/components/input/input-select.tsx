import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";

/* ------------------------------------------------------------------ icons -- */

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TickIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ types -- */

export interface InputSelectOption {
  /** Stable identity used as the selection value. */
  value: string;
  /** Primary text shown in the menu — node or string. */
  label: ReactNode;
  /** Compact text shown in the trigger once selected. Falls back to `label`. */
  triggerLabel?: ReactNode;
  /** Secondary line under the label in the menu — node or string. */
  subtext?: ReactNode;
  /** Leading element in the option row (and the trigger, when selected). */
  icon?: ReactNode;
  disabled?: boolean;
}

/**
 * Config for a dropdown addon docked to the left or right edge of an `Input`
 * (e.g. a country-code or unit picker). Passed via `Input`'s `leftSelect` /
 * `rightSelect` props.
 */
export interface InputSelectConfig {
  options: InputSelectOption[];
  /** Controlled selected value. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Trigger text before anything is picked. */
  placeholder?: ReactNode;
  /** Accessible name for the addon trigger (e.g. "Country code"). */
  "aria-label"?: string;
  disabled?: boolean;
  /** Menu width strategy. `"auto"` (default) sizes to content; `"trigger"` matches the button. */
  menuWidth?: "trigger" | "auto";
  className?: string;
}

const triggerVariants = cva(
  [
    "inline-flex shrink-0 items-center gap-1.5 rounded-gk-md text-ink transition-[color,background-color,border-color,box-shadow]",
    "cursor-pointer whitespace-nowrap",
    "focus-visible:outline-none focus-visible:border-leaf focus-visible:ring-2 focus-visible:ring-leaf/30",
    "aria-expanded:border-leaf aria-expanded:ring-2 aria-expanded:ring-leaf/30",
    "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/25",
    "disabled:cursor-not-allowed disabled:opacity-60",
  ],
  {
    variants: {
      variant: {
        outline: "border border-line bg-canvas hover:border-muted/50 disabled:hover:border-line",
        filled:
          "border border-transparent bg-mint hover:bg-art aria-expanded:bg-canvas disabled:hover:bg-mint",
      },
      size: {
        sm: "h-9 px-2.5 text-sm",
        md: "h-11 px-3 text-sm",
        lg: "h-12 px-3.5 text-base",
      },
      side: {
        left: "rounded-r-none [border-right-color:var(--color-line)]",
        right: "rounded-l-none [border-left-color:var(--color-line)]",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

type TriggerVariants = VariantProps<typeof triggerVariants>;

const MAX_MENU_HEIGHT = 288;

interface InputSelectProps extends InputSelectConfig {
  /** Which edge of the field the addon is docked to. */
  side: NonNullable<TriggerVariants["side"]>;
  size: NonNullable<TriggerVariants["size"]>;
  variant: NonNullable<TriggerVariants["variant"]>;
  /** Mirrors the field's invalid state onto the trigger border. */
  invalid?: boolean;
}

/**
 * A small from-scratch select (button + scrollable option list) meant to sit
 * flush against an `Input`. Opens downward and flips upward when the viewport
 * lacks room below; own click-outside + keyboard handling.
 */
export function InputSelect({
  options,
  value: valueProp,
  defaultValue,
  onChange,
  placeholder = "Select",
  "aria-label": ariaLabel,
  disabled = false,
  menuWidth = "auto",
  className,
  side,
  size,
  variant,
  invalid = false,
}: InputSelectProps) {
  const listboxId = useId();
  // `onChange` is fired explicitly by `commit` so it keeps its `(value: string)` signature.
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue: defaultValue ?? null,
  });

  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const optRefs = useRef<(HTMLLIElement | null)[]>([]);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const selIdx = options.findIndex((o) => o.value === value);
    setActiveIndex(selIdx >= 0 ? selIdx : options.findIndex((o) => !o.disabled));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && activeIndex >= 0)
      optRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeIndex]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const listH = Math.min(listRef.current?.scrollHeight ?? MAX_MENU_HEIGHT, MAX_MENU_HEIGHT);
      const below = window.innerHeight - rect.bottom;
      setPlacement(below < listH + 8 && rect.top > below ? "top" : "bottom");
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const move = useCallback(
    (dir: 1 | -1) => {
      const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
      if (!enabled.length) return;
      const pos = enabled.indexOf(activeIndex);
      const nextPos =
        pos === -1
          ? dir > 0
            ? 0
            : enabled.length - 1
          : (pos + dir + enabled.length) % enabled.length;
      setActiveIndex(enabled[nextPos]!);
    },
    [options, activeIndex],
  );

  const commit = useCallback(
    (v: string) => {
      setValue(v);
      onChange?.(v);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [setValue, onChange],
  );

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!open) setOpen(true);
          else move(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (!open) setOpen(true);
          else move(-1);
          break;
        case "Home":
          if (open) {
            e.preventDefault();
            setActiveIndex(options.findIndex((o) => !o.disabled));
          }
          break;
        case "End":
          if (open) {
            e.preventDefault();
            for (let i = options.length - 1; i >= 0; i--)
              if (!options[i]!.disabled) {
                setActiveIndex(i);
                break;
              }
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (!open) setOpen(true);
          else if (activeIndex >= 0 && !options[activeIndex]!.disabled)
            commit(options[activeIndex]!.value);
          break;
        case "Escape":
          if (open) {
            e.preventDefault();
            close();
            triggerRef.current?.focus();
          }
          break;
        case "Tab":
          if (open) close();
          break;
        default:
      }
    },
    [disabled, open, move, options, activeIndex, commit, close],
  );

  const activeDescendant =
    open && activeIndex >= 0 && options[activeIndex]
      ? `${listboxId}-opt-${activeIndex}`
      : undefined;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-activedescendant={activeDescendant}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(triggerVariants({ variant, size, side }), className)}
      >
        {selected?.icon != null ? (
          <span className="flex shrink-0 text-muted [&_svg]:size-4">{selected.icon}</span>
        ) : null}
        <span className={cn("min-w-0 truncate", selected == null && "text-muted")}>
          {selected ? (selected.triggerLabel ?? selected.label) : placeholder}
        </span>
        <ChevronIcon
          className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "absolute z-50 max-h-72 overflow-y-auto rounded-gk-md border border-line bg-surface py-1 shadow-modal",
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1",
            side === "right" ? "right-0" : "left-0",
            menuWidth === "trigger" ? "w-full" : "w-max min-w-full max-w-[16rem]",
          )}
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={o.disabled || undefined}
                ref={(n) => {
                  optRefs.current[i] = n;
                }}
                onMouseEnter={() => !o.disabled && setActiveIndex(i)}
                onClick={() => !o.disabled && commit(o.value)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-sm text-ink",
                  o.disabled && "cursor-not-allowed opacity-40",
                  i === activeIndex && !o.disabled && "bg-mint",
                  isSelected && i !== activeIndex && "bg-mint/50",
                )}
              >
                {o.icon != null ? (
                  <span className="flex shrink-0 text-muted [&_svg]:size-4">{o.icon}</span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{o.label}</span>
                  {o.subtext != null ? (
                    <span className="mt-0.5 block truncate text-xs font-normal text-muted">
                      {o.subtext}
                    </span>
                  ) : null}
                </span>
                {isSelected ? <TickIcon className="size-4 shrink-0 text-leaf" /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
