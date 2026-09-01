import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

/** Placeholder block — `variant` (shape) × `size`, same cva pattern as the rest. */
export const skeletonVariants = cva("block shrink-0 bg-line/70", {
  variants: {
    variant: {
      text: "w-full rounded",
      rounded: "w-full rounded-gk-md",
      rect: "w-full rounded-none",
      circle: "rounded-full",
    },
    size: { sm: "", md: "", lg: "" },
    animation: {
      /** Opacity pulse. */
      pulse: "motion-safe:animate-pulse",
      /** A highlight that sweeps left → right. */
      shimmer: "relative overflow-hidden",
      none: "",
    },
  },
  compoundVariants: [
    { variant: "text", size: "sm", class: "h-3" },
    { variant: "text", size: "md", class: "h-4" },
    { variant: "text", size: "lg", class: "h-5" },
    { variant: "circle", size: "sm", class: "size-8" },
    { variant: "circle", size: "md", class: "size-10" },
    { variant: "circle", size: "lg", class: "size-14" },
    { variant: ["rounded", "rect"], size: "sm", class: "h-16" },
    { variant: ["rounded", "rect"], size: "md", class: "h-24" },
    { variant: ["rounded", "rect"], size: "lg", class: "h-40" },
  ],
  defaultVariants: { variant: "text", size: "md", animation: "pulse" },
});

export type SkeletonVariant = NonNullable<VariantProps<typeof skeletonVariants>["variant"]>;
export type SkeletonSize = NonNullable<VariantProps<typeof skeletonVariants>["size"]>;

const toLength = (v: number | string | undefined): string | undefined =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

/** The left→right highlight sweep for `animation="shimmer"`. */
function ShimmerSweep() {
  return (
    <span
      aria-hidden="true"
      data-slot="skeleton-sweep"
      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-safe:animate-skeleton-shimmer motion-reduce:hidden"
    />
  );
}

export interface SkeletonProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children">, VariantProps<typeof skeletonVariants> {
  /** Stacked lines — only for `variant="text"`. The last line is 60% width. */
  lines?: number;
  /** Explicit width — number (px) or any CSS length. Overrides the variant default. */
  width?: number | string;
  /** Explicit height — number (px) or any CSS length. */
  height?: number | string;
  /** Accessible name announced while loading. Default `"Loading"`. */
  label?: string;
}

/**
 * A shimmering placeholder shown while content loads. `variant` — `text`
 * (default), `rounded`, `rect`, `circle` — × `size` (`sm` | `md` | `lg`). Pass
 * `lines` for a multi-line text block, or `width` / `height` for exact
 * dimensions. `animation` — `pulse` (default), `shimmer` (a highlight that
 * sweeps left → right), or `none`; all honour `prefers-reduced-motion`.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, variant, size, animation, lines, width, height, label = "Loading", style, ...props },
  ref,
) {
  const dims: CSSProperties = {
    ...style,
    ...(width != null ? { width: toLength(width) } : null),
    ...(height != null ? { height: toLength(height) } : null),
  };

  const sweep = animation === "shimmer" ? <ShimmerSweep /> : null;
  const isText = variant == null || variant === "text";
  if (isText && lines != null && lines > 1) {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
        data-slot="skeleton-group"
        className={cn("flex w-full flex-col gap-2", className)}
        style={width != null ? { width: toLength(width) } : undefined}
        {...props}
      >
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            data-slot="skeleton-line"
            className={cn(
              skeletonVariants({ variant: "text", size, animation }),
              i === lines - 1 && "w-3/5",
            )}
          >
            {sweep}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      data-slot="skeleton"
      className={cn(skeletonVariants({ variant, size, animation }), className)}
      style={Object.keys(dims).length ? dims : undefined}
      {...props}
    >
      {sweep}
    </div>
  );
});
