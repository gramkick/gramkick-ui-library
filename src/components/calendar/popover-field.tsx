import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6.5h12M5.5 2v3M10.5 2v3" strokeLinecap="round" />
    </svg>
  );
}
function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}

export const dateFieldVariants = cva(
  [
    "flex w-full items-center gap-2 rounded-gk-md text-ink shadow-xs transition-[color,background-color,border-color,box-shadow]",
    "cursor-pointer text-left",
    "focus-visible:outline-none focus-visible:border-leaf focus-visible:ring-2 focus-visible:ring-leaf/30",
    "aria-expanded:border-leaf aria-expanded:ring-2 aria-expanded:ring-leaf/30",
    "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/25",
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
    "aria-[readonly=true]:cursor-default",
  ],
  {
    variants: {
      variant: {
        outline:
          "border border-line bg-canvas hover:border-muted/50 aria-disabled:hover:border-line",
        filled:
          "border border-transparent bg-mint hover:bg-art aria-expanded:bg-canvas aria-disabled:hover:bg-mint",
      },
      size: {
        sm: "min-h-9 px-2.5 text-sm",
        md: "min-h-11 px-3 text-sm",
        lg: "min-h-12 px-3.5 text-base",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export interface DateFieldBaseProps extends VariantProps<typeof dateFieldVariants> {
  label?: ReactNode;
  placeholder?: string;
  hint?: ReactNode;
  error?: ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  clearable?: boolean;
  id?: string;
  className?: string;
  containerClassName?: string;
  popoverClassName?: string;
}

const MAX_POPOVER_HEIGHT = 420;

interface PopoverFieldProps extends DateFieldBaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rendered value; `null` shows the placeholder. */
  valueText: ReactNode | null;
  hasValue: boolean;
  onClear?: () => void;
  /** `"field"` = popover matches the trigger width; `"auto"` = fits its content. */
  popoverWidth?: "field" | "auto";
  children: ReactNode;
}

export function PopoverField({
  open,
  onOpenChange,
  valueText,
  hasValue,
  onClear,
  popoverWidth = "field",
  children,
  variant,
  size,
  label,
  placeholder = "Select…",
  hint,
  error,
  invalid,
  disabled = false,
  readOnly = false,
  required = false,
  clearable = true,
  id: idProp,
  className,
  containerClassName,
  popoverClassName,
}: PopoverFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const dialogId = `${id}-dialog`;

  const isInvalid = Boolean(invalid) || Boolean(error);
  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");

  const toggle = useCallback(() => {
    if (disabled || readOnly) return;
    onOpenChange(!open);
  }, [disabled, readOnly, open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [open, onOpenChange]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const h = Math.min(popoverRef.current?.scrollHeight ?? 360, MAX_POPOVER_HEIGHT);
      const below = window.innerHeight - rect.bottom;
      const above = rect.top;
      setPlacement(below < h + 8 && above > below ? "top" : "bottom");
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const onTriggerKeyDown = (e: ReactKeyboardEvent) => {
    if (disabled || readOnly) return;
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      onOpenChange(true);
    } else if (open && e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
      triggerRef.current?.focus();
    }
  };

  const showClear = clearable && hasValue && !disabled && !readOnly && Boolean(onClear);

  return (
    <div ref={rootRef} className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label != null ? (
        <span
          id={labelId}
          className={cn("text-sm font-medium text-ink", disabled && "opacity-60")}
          onClick={() => !disabled && !readOnly && triggerRef.current?.focus()}
        >
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </span>
      ) : null}

      <div className="relative">
        <div
          ref={triggerRef}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          aria-disabled={disabled || undefined}
          aria-readonly={readOnly || undefined}
          aria-invalid={isInvalid || undefined}
          aria-required={required || undefined}
          aria-labelledby={label != null ? labelId : undefined}
          aria-describedby={describedBy}
          tabIndex={disabled ? -1 : 0}
          onClick={toggle}
          onKeyDown={onTriggerKeyDown}
          className={cn(dateFieldVariants({ variant, size }), className)}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted" />
          <span className={cn("min-w-0 flex-1 truncate", !hasValue && "text-muted")}>
            {hasValue ? valueText : placeholder}
          </span>
          {showClear ? (
            <button
              type="button"
              aria-label="Clear"
              onClick={(e) => {
                e.stopPropagation();
                onClear?.();
                triggerRef.current?.focus();
              }}
              className="flex shrink-0 cursor-pointer items-center rounded-full p-0.5 text-muted hover:bg-mint hover:text-ink"
            >
              <CrossIcon className="size-3.5" />
            </button>
          ) : null}
        </div>

        {open ? (
          <div
            ref={popoverRef}
            id={dialogId}
            role="dialog"
            aria-modal="false"
            aria-label={typeof label === "string" ? label : "Choose a date"}
            className={cn(
              "absolute z-50 rounded-gk-md border border-line bg-surface p-3 shadow-modal",
              placement === "top" ? "bottom-full mb-1" : "top-full mt-1",
              popoverWidth === "auto"
                ? "left-0 w-max min-w-full max-w-[calc(100vw-1.5rem)]"
                : "inset-x-0",
              popoverClassName,
            )}
          >
            {children}
          </div>
        ) : null}
      </div>

      {error != null ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : hint != null ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
