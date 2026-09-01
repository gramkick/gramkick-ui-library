import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center whitespace-nowrap rounded-full font-semibold [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-mint text-leaf-dark",
        success: "bg-leaf text-white",
        warning: "bg-soft-yellow text-ink",
        danger: "bg-danger/10 text-danger",
        info: "bg-soft-blue text-brand-blue",
        outline: "border border-line text-muted",
      },
      size: {
        sm: "gap-1 px-2 py-0.5 text-[0.6875rem] leading-4 [&_svg]:size-2.5",
        md: "gap-1 px-2.5 py-0.5 text-xs leading-4 [&_svg]:size-3",
        lg: "gap-1.5 px-3 py-1 text-sm leading-5 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    /** Badge text, as an alternative to `children`. `children` wins when both are given. */
    label?: ReactNode;
    /** Element rendered before the label (SVGs auto-sized to the badge size). Hidden from assistive tech. */
    leftIcon?: ReactNode;
    /** Element rendered after the label (SVGs auto-sized to the badge size). Hidden from assistive tech. */
    rightIcon?: ReactNode;
  };

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant, size, label, leftIcon, rightIcon, children, ...props },
  ref,
) {
  const labelNode = children ?? label;
  return (
    <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {leftIcon ? (
        <span className="inline-flex shrink-0 items-center" aria-hidden="true">
          {leftIcon}
        </span>
      ) : null}
      {labelNode}
      {rightIcon ? (
        <span className="inline-flex shrink-0 items-center" aria-hidden="true">
          {rightIcon}
        </span>
      ) : null}
    </span>
  );
});
