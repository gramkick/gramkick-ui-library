import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const buttonVariants = cva(
  [
    "relative inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-gk-md font-semibold",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: "bg-leaf text-white hover:bg-leaf-dark",
        secondary: "bg-mint text-leaf-dark hover:bg-art",
        outline: "border border-line bg-canvas text-ink hover:bg-mint",
        ghost: "text-ink hover:bg-mint",
        danger: "bg-danger text-white hover:brightness-95",
        link: "text-leaf underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

const spinnerSizeClasses: Record<ButtonSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
  icon: "size-5",
};

const iconWrapperClasses: Record<ButtonSize, string> = {
  sm: "[&_svg]:size-3.5",
  md: "[&_svg]:size-4",
  lg: "[&_svg]:size-5",
  icon: "[&_svg]:size-5",
};

function ButtonSpinner({ className }: { className?: string }) {
  return (
    <span
      data-slot="spinner"
      aria-hidden="true"
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none",
        className,
      )}
    />
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Render the single child element instead of a `<button>`, forwarding all props to it. */
    asChild?: boolean;
    /** Button text, as an alternative to `children`. `children` wins when both are given. */
    label?: ReactNode;
    /** Element rendered before the label (auto-sized for SVGs). Hidden from assistive tech. */
    leftIcon?: ReactNode;
    /** Element rendered after the label (auto-sized for SVGs). Hidden from assistive tech. */
    rightIcon?: ReactNode;
    /** Swap the content for a spinner, disable the button, and set `aria-busy`. */
    loading?: boolean;
    /** Optional label shown next to the spinner while `loading` (keeps the button readable). */
    loadingText?: ReactNode;
    /** Where the spinner sits relative to `loadingText`. Ignored without `loadingText`. */
    spinnerPlacement?: "start" | "end";
  };

/**
 * The primary action element.
 *
 * - Label comes from `children` or the `label` prop (`children` wins).
 * - `leftIcon` / `rightIcon` — decorative slots around the label.
 * - `loading` — shows a spinner and blocks interaction. Without `loadingText` the
 *   label is kept in place but visually hidden so the button never changes width;
 *   with `loadingText` the spinner + text render inline.
 * - `asChild` renders the child as-is (Radix `Slot`); the icon / loading props then
 *   do nothing because there is no `<button>` to compose.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    type,
    label,
    leftIcon,
    rightIcon,
    loading = false,
    loadingText,
    spinnerPlacement = "start",
    disabled,
    children,
    ...props
  },
  ref,
) {
  const labelNode = children ?? label;

  if (asChild) {
    return (
      <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {labelNode}
      </Slot>
    );
  }

  const resolvedSize: ButtonSize = size ?? "md";
  const spinner = <ButtonSpinner className={spinnerSizeClasses[resolvedSize]} />;
  const iconWrapper = cn(
    "inline-flex shrink-0 items-center justify-center",
    iconWrapperClasses[resolvedSize],
  );
  const iconSlot = (node: ReactNode) => (
    <span className={iconWrapper} aria-hidden="true">
      {node}
    </span>
  );

  let content: ReactNode;
  if (loading && loadingText == null) {
    // Keep the label in the layout AND the a11y tree (so the button keeps its
    // accessible name) but visually hidden for a stable width; float the spinner over it.
    content = (
      <>
        <span className="absolute inset-0 flex items-center justify-center">{spinner}</span>
        <span className="inline-flex items-center gap-2 opacity-0">
          {leftIcon ? iconSlot(leftIcon) : null}
          {labelNode}
          {rightIcon ? iconSlot(rightIcon) : null}
        </span>
      </>
    );
  } else if (loading) {
    content = (
      <>
        {spinnerPlacement === "start" ? spinner : null}
        {loadingText}
        {spinnerPlacement === "end" ? spinner : null}
      </>
    );
  } else {
    content = (
      <>
        {leftIcon ? iconSlot(leftIcon) : null}
        {labelNode}
        {rightIcon ? iconSlot(rightIcon) : null}
      </>
    );
  }

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
});
