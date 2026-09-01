import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";

export interface MiniSelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface MiniSelectProps {
  value: string;
  options: MiniSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  /** Which edge the option list aligns to. */
  align?: "start" | "end";
  triggerClassName?: string;
}

const MAX_LIST_HEIGHT = 224;

/** A tiny from-scratch dropdown (button + scrollable option list) for the calendar header. */
export function MiniSelect({
  value,
  options,
  onChange,
  ariaLabel,
  align = "start",
  triggerClassName,
}: MiniSelectProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const optRefs = useRef<(HTMLLIElement | null)[]>([]);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? value,
    [options, value],
  );

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : options.findIndex((o) => !o.disabled));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && activeIndex >= 0)
      optRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeIndex]);

  useLayoutEffect(() => {
    if (!open) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const listH = Math.min(listRef.current?.scrollHeight ?? MAX_LIST_HEIGHT, MAX_LIST_HEIGHT);
    const below = window.innerHeight - rect.bottom;
    setPlacement(below < listH + 8 && rect.top > below ? "top" : "bottom");
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
      onChange(v);
      setOpen(false);
    },
    [onChange],
  );

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      e.stopPropagation();
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
            setOpen(false);
          }
          break;
        case "Tab":
          if (open) setOpen(false);
          break;
        default:
      }
    },
    [open, move, options, activeIndex, commit],
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded-gk-sm px-1.5 py-1 text-sm font-semibold text-ink transition-colors hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40",
          triggerClassName,
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
          className={cn("size-3 shrink-0 text-muted transition-transform", open && "rotate-180")}
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "absolute z-[60] max-h-56 min-w-[7rem] overflow-y-auto rounded-gk-md border border-line bg-surface py-1 shadow-modal",
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              ref={(n) => {
                optRefs.current[i] = n;
              }}
              onMouseEnter={() => !o.disabled && setActiveIndex(i)}
              onClick={() => !o.disabled && commit(o.value)}
              className={cn(
                "cursor-pointer px-2.5 py-1.5 text-sm text-ink",
                o.disabled && "cursor-not-allowed opacity-40",
                i === activeIndex && !o.disabled && "bg-mint",
                o.value === value && "font-semibold",
              )}
            >
              {o.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
