import {
  forwardRef,
  useId,
  useMemo,
  useRef,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { InputSelect, type InputSelectConfig, type InputSelectOption } from "./input-select";

export type { InputSelectConfig, InputSelectOption };

export const inputVariants = cva(
  [
    "w-full rounded-gk-md text-ink shadow-xs transition-[color,background-color,border-color,box-shadow]",
    "placeholder:text-muted",
    "focus:outline-none focus:ring-2",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "read-only:cursor-default",
    "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/25",
    // Hide the browsers' own reveal / clear widgets so a custom rightIcon owns that slot.
    "[&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden",
  ],
  {
    variants: {
      variant: {
        outline: [
          "border border-line bg-canvas hover:border-muted/50",
          "focus:border-leaf focus:ring-leaf/30",
          "disabled:hover:border-line read-only:bg-mint/40 read-only:hover:border-line",
        ],
        filled: [
          "border border-transparent bg-mint hover:bg-art",
          "focus:border-leaf focus:bg-canvas focus:ring-leaf/30",
          "disabled:hover:bg-mint read-only:bg-mint/60 read-only:hover:bg-mint/60",
        ],
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-3.5 text-sm",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

type InputSize = NonNullable<VariantProps<typeof inputVariants>["size"]>;

const iconGutter: Record<InputSize, { padLeft: string; padRight: string; box: string }> = {
  sm: { padLeft: "pl-8", padRight: "pr-8", box: "w-8 [&_svg]:size-3.5" },
  md: { padLeft: "pl-10", padRight: "pr-10", box: "w-10 [&_svg]:size-4" },
  lg: { padLeft: "pl-11", padRight: "pr-11", box: "w-11 [&_svg]:size-[1.15rem]" },
};

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> &
  VariantProps<typeof inputVariants> & {
    /** Field label. Rendered as a `<label>` wired to the input. Text or node. */
    label?: ReactNode;
    /** Helper text under the field. Hidden while `error` is set. Text or node. */
    hint?: ReactNode;
    /** Error message under the field. Also forces the invalid styling + `aria-invalid`. */
    error?: ReactNode;
    /** Decorative element inside the field, on the left (SVGs auto-sized). */
    leftIcon?: ReactNode;
    /** Element inside the field, on the right — may be interactive (clear / reveal button). */
    rightIcon?: ReactNode;
    /** Dropdown addon docked to the left edge (e.g. a country-code picker). */
    leftSelect?: InputSelectConfig;
    /** Dropdown addon docked to the right edge (e.g. a unit picker). */
    rightSelect?: InputSelectConfig;
    /**
     * Keystroke filter. An edit (typing, paste, drop, autofill) is applied only
     * when the resulting value matches this pattern — otherwise it's rejected and
     * the field keeps its previous value. Empty is always allowed so the field
     * can be cleared. Anchor the pattern against the whole value, e.g.
     * `/^\d*$/` (digits only) or `/^\d*\.?\d{0,2}$/` (up to 2 decimals).
     */
    allowPattern?: RegExp;
    /** Force the error styling without an `error` message. */
    invalid?: boolean;
    /** Classes for the outer wrapper (label + field + hint/error). */
    containerClassName?: string;
  };

/**
 * Text field. Optional `label` / `hint` / `error` wrap it in an accessible group
 * (`aria-describedby`, `aria-invalid` are wired up); `leftIcon` / `rightIcon` sit
 * inside the field; `size` and `variant` control the shape; `disabled` and
 * `readOnly` get distinct styling with hover suppressed. `leftSelect` /
 * `rightSelect` dock a from-scratch dropdown to either edge (country codes,
 * units, …), joined seamlessly with the field. `allowPattern` restricts what can
 * be typed / pasted to values matching a regex.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id: idProp,
    className,
    containerClassName,
    variant,
    size,
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    leftSelect,
    rightSelect,
    allowPattern,
    invalid,
    required,
    disabled,
    readOnly,
    type = "text",
    value,
    defaultValue,
    onChange,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const resolvedSize: InputSize = size ?? "md";

  const isInvalid =
    Boolean(invalid) || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null, ariaDescribedBy]
      .filter(Boolean)
      .join(" ") || undefined;

  const hasLeftSelect = leftSelect != null;
  const hasRightSelect = rightSelect != null;

  // Drop stateful flags (`g` / `y`) so `.test()` is position-independent.
  const filterRe = useMemo(
    () =>
      allowPattern
        ? new RegExp(allowPattern.source, allowPattern.flags.replace(/[gy]/g, ""))
        : null,
    [allowPattern],
  );
  const lastAcceptedRef = useRef(
    value != null ? String(value) : defaultValue != null ? String(defaultValue) : "",
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (filterRe && next !== "" && !filterRe.test(next)) {
      // Reject the edit: restore the last value that passed (covers uncontrolled;
      // controlled fields snap back on the skipped re-render anyway).
      event.target.value = lastAcceptedRef.current;
      return;
    }
    lastAcceptedRef.current = next;
    onChange?.(event);
  };

  const leftIconEl =
    leftIcon != null ? (
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center text-muted",
          iconGutter[resolvedSize].box,
        )}
      >
        {leftIcon}
      </span>
    ) : null;

  const rightIconEl =
    rightIcon != null ? (
      <span
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-center text-muted",
          iconGutter[resolvedSize].box,
        )}
      >
        {rightIcon}
      </span>
    ) : null;

  const inputEl = (
    <input
      ref={ref}
      id={id}
      type={type}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      className={cn(
        inputVariants({ variant, size }),
        leftIcon != null && iconGutter[resolvedSize].padLeft,
        rightIcon != null && iconGutter[resolvedSize].padRight,
        hasLeftSelect && "rounded-l-none border-l-0",
        hasRightSelect && "rounded-r-none border-r-0",
        className,
      )}
      {...props}
    />
  );

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label != null ? (
        <label
          htmlFor={id}
          className={cn("text-sm font-medium text-ink", disabled && "opacity-60")}
        >
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}

      {hasLeftSelect || hasRightSelect ? (
        <div className="flex items-stretch">
          {hasLeftSelect ? (
            <InputSelect
              {...leftSelect}
              side="left"
              size={resolvedSize}
              variant={variant ?? "outline"}
              invalid={isInvalid}
              disabled={disabled || leftSelect.disabled}
            />
          ) : null}

          <div className="relative flex min-w-0 flex-1 items-center">
            {leftIconEl}
            {inputEl}
            {rightIconEl}
          </div>

          {hasRightSelect ? (
            <InputSelect
              {...rightSelect}
              side="right"
              size={resolvedSize}
              variant={variant ?? "outline"}
              invalid={isInvalid}
              disabled={disabled || rightSelect.disabled}
            />
          ) : null}
        </div>
      ) : (
        <div className="relative">
          {leftIconEl}
          {inputEl}
          {rightIconEl}
        </div>
      )}

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
});
