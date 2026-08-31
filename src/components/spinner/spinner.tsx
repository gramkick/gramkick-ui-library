import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const sizeClasses = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-9 border-[3px]",
} as const;

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: keyof typeof sizeClasses;
  /** Visually-hidden text announced to assistive tech. */
  label?: string;
};

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { className, size = "md", label = "Loading", ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn("inline-flex", className)}
      {...props}
    >
      <span
        className={cn(
          "animate-spin rounded-full border-current border-t-transparent text-leaf motion-reduce:animate-none",
          sizeClasses[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
});
