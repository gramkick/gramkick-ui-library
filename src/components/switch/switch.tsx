import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";
import type { SelectionSize, SelectionVariant } from "../selection/selection";

/** Track chrome — `variant` (the "on" colour) mirrors the selection controls. */
export const switchVariants = cva(
  [
    "pointer-events-none absolute inset-0 rounded-full border-2 border-transparent bg-line transition-colors",
    "peer-focus-visible:ring-2 peer-focus-visible:ring-leaf/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas",
    "peer-disabled:bg-mint/60",
  ],
  {
    variants: {
      variant: {
        primary: "peer-checked:bg-leaf",
        secondary: "peer-checked:bg-ink",
        outline: "peer-checked:border-leaf peer-checked:bg-mint",
        danger: "peer-checked:bg-danger",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

const TRACK: Record<SelectionSize, string> = { sm: "h-4 w-7", md: "h-5 w-9", lg: "h-6 w-11" };
const THUMB_ON: Record<SelectionSize, string> = {
  sm: "peer-checked:translate-x-3",
  md: "peer-checked:translate-x-4",
  lg: "peer-checked:translate-x-5",
};
const GAP: Record<SelectionSize, string> = { sm: "gap-2", md: "gap-2.5", lg: "gap-3" };
const TEXT: Record<SelectionSize, string> = { sm: "text-sm", md: "text-sm", lg: "text-base" };

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  /** The "on" colour — same axis as `Checkbox` / `Radio`. */
  variant?: SelectionVariant;
  size?: SelectionSize;
  label?: ReactNode;
  description?: ReactNode;
  /** Classes for the outer `<label>`. */
  containerClassName?: string;
}

/**
 * An on/off toggle — same `variant` (`primary` | `secondary` | `outline` |
 * `danger`) × `size` (`sm` | `md` | `lg`) API as the selection components, plus
 * `label` / `description`. A native `<input type="checkbox" role="switch">` under
 * the hood: pass `checked` / `defaultChecked` / `onChange` directly.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    variant = "primary",
    size = "md",
    label,
    description,
    className,
    containerClassName,
    disabled,
    id: idProp,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const labelId = label != null ? `${id}-label` : undefined;
  const descId = description != null ? `${id}-desc` : undefined;
  const describedBy = [rest["aria-describedby"], descId].filter(Boolean).join(" ") || undefined;

  return (
    <label
      data-slot="switch-field"
      className={cn(
        "inline-flex items-start",
        GAP[size],
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        containerClassName,
      )}
    >
      <span
        data-slot="switch-control"
        className={cn("relative inline-flex shrink-0 items-center", TRACK[size])}
      >
        <input
          {...rest}
          id={id}
          ref={ref}
          type="checkbox"
          role="switch"
          disabled={disabled}
          aria-labelledby={rest["aria-labelledby"] ?? labelId}
          aria-describedby={describedBy}
          className={cn(
            "peer absolute inset-0 z-10 m-0 cursor-[inherit] appearance-none opacity-0 focus:outline-none",
            className,
          )}
        />
        <span aria-hidden="true" data-slot="switch-track" className={switchVariants({ variant })} />
        <span
          aria-hidden="true"
          data-slot="switch-thumb"
          className={cn(
            "pointer-events-none absolute inset-y-0.5 left-0.5 aspect-square rounded-full bg-white shadow-sm transition-transform",
            THUMB_ON[size],
            variant === "outline" && "peer-checked:bg-leaf",
          )}
        />
      </span>

      {label != null || description != null ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          {label != null ? (
            <span id={labelId} className={cn("font-medium leading-tight text-ink", TEXT[size])}>
              {label}
            </span>
          ) : null}
          {description != null ? (
            <span id={descId} className="text-xs text-muted">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
});
