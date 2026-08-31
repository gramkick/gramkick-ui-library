import { forwardRef, type HTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const cardVariants = cva("bg-surface text-ink", {
  variants: {
    /** Border + elevation treatment. */
    variant: {
      elevated: "border border-line shadow-card",
      raised: "border border-line shadow-art",
      outline: "border border-line shadow-none",
      ghost: "border-0 shadow-none",
    },
    /** Corner rounding — independent of `variant`, so you can pair a shadow with square corners. */
    radius: {
      none: "rounded-none",
      sm: "rounded-gk-sm",
      md: "rounded-gk-md",
      lg: "rounded-gk-lg",
      xl: "rounded-gk-xl",
    },
    /** Hover/focus affordance for clickable cards (pair with `asChild` or your own handlers). */
    interactive: {
      true: "cursor-pointer transition-shadow hover:shadow-art focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
      false: "",
    },
  },
  defaultVariants: {
    variant: "elevated",
    radius: "lg",
    interactive: false,
  },
});

export type CardProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants> & {
    /** Render the single child element instead of a `<div>` (e.g. an `<a>` or `<button>`). */
    asChild?: boolean;
  };

/**
 * Surface container. Compose with `CardHeader` / `CardTitle` / `CardDescription` /
 * `CardContent` / `CardFooter`.
 *
 * - `variant` — `elevated` (default) · `raised` · `outline` · `ghost`
 * - `radius` — `none` · `sm` · `md` · `lg` (default) · `xl`
 * - `interactive` — hover + focus ring for clickable cards
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant, radius, interactive, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      className={cn(cardVariants({ variant, radius, interactive }), className)}
      {...props}
    />
  );
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
  },
);

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={cn("text-lg font-semibold leading-none text-ink", className)}
        {...props}
      />
    );
  },
);

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn("text-sm text-muted", className)} {...props} />;
});

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
  },
);

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div ref={ref} className={cn("flex items-center gap-3 p-6 pt-0", className)} {...props} />
    );
  },
);
