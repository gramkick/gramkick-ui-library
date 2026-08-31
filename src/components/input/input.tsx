import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

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
    /** Force the error styling without an `error` message. */
    invalid?: boolean;
    /** Classes for the outer wrapper (label + field + hint/error). */
    containerClassName?: string;
  };

/**
 * Text field. Optional `label` / `hint` / `error` wrap it in an accessible group
 * (`aria-describedby`, `aria-invalid` are wired up); `leftIcon` / `rightIcon` sit
 * inside the field; `size` and `variant` control the shape; `disabled` and
 * `readOnly` get distinct styling with hover suppressed.
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
    invalid,
    required,
    disabled,
    readOnly,
    type = "text",
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

      <div className="relative">
        {leftIcon != null ? (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center text-muted",
              iconGutter[resolvedSize].box,
            )}
          >
            {leftIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={id}
          type={type}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            inputVariants({ variant, size }),
            leftIcon != null && iconGutter[resolvedSize].padLeft,
            rightIcon != null && iconGutter[resolvedSize].padRight,
            className,
          )}
          {...props}
        />

        {rightIcon != null ? (
          <span
            className={cn(
              "absolute inset-y-0 right-0 flex items-center justify-center text-muted",
              iconGutter[resolvedSize].box,
            )}
          >
            {rightIcon}
          </span>
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
});
