import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

/* --------------------------------------------------------------- variants -- */

/**
 * The shared type scale. `variant` picks the role (size + line-height + tracking
 * from the `--text-*` tokens, plus a default weight); `weight`, `tone`, `align`
 * and `truncate` are orthogonal overrides. Applying `textVariants({ … })` to any
 * element gives it the same typography as `<Text>` without the wrapper.
 */
export const textVariants = cva("text-ink", {
  variants: {
    variant: {
      /** Hero / campaign headline — fluid, tight, only one per view. */
      display: "font-display text-display font-bold text-balance",
      /** Page title. */
      h1: "font-display text-h1 font-bold text-balance",
      /** Major section heading. */
      h2: "font-display text-h2 font-bold text-balance",
      /** Sub-section heading. */
      h3: "font-display text-h3 font-semibold",
      /** Card / product-detail heading. */
      h4: "font-display text-h4 font-semibold",
      h5: "font-display text-h5 font-semibold",
      h6: "font-display text-h6 font-semibold",
      /** Lead paragraph — PDP intro, section standfirst. */
      "body-lg": "font-sans text-body-lg font-normal",
      /** Default running text. */
      body: "font-sans text-body font-normal",
      /** Dense UI text, list meta, table cells. */
      "body-sm": "font-sans text-body-sm font-normal",
      /** Helper text, timestamps, fine print. */
      caption: "font-sans text-caption font-normal",
      /** Eyebrow / kicker above a heading, category label. */
      overline: "font-sans text-overline font-semibold uppercase",
      /** Form labels, tabs, chips. */
      label: "font-sans text-label font-semibold",
      /** Current selling price — bold, lining/tabular figures. */
      price: "font-sans text-price font-bold tabular-nums",
      /** Struck-through was / MRP price shown beside `price`. */
      "price-original": "font-sans text-body-sm font-normal text-muted line-through tabular-nums",
    },
    tone: {
      default: "text-ink",
      muted: "text-muted",
      brand: "text-leaf",
      danger: "text-danger",
      /** For text on `ink` / photographic backgrounds. */
      inverted: "text-canvas",
      /** Inherit the parent's colour. */
      inherit: "text-inherit",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    /** Single-line ellipsis. For multi-line use the `lineClamp` prop. */
    truncate: { true: "truncate", false: "" },
  },
  defaultVariants: { variant: "body" },
});

export type TextVariant = NonNullable<VariantProps<typeof textVariants>["variant"]>;
export type TextTone = NonNullable<VariantProps<typeof textVariants>["tone"]>;
export type TextWeight = NonNullable<VariantProps<typeof textVariants>["weight"]>;

type HeadingVariant = "display" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/* ------------------------------------------------------------------ Text -- */

interface TextOwnProps extends VariantProps<typeof textVariants> {
  /** Element to render. Defaults to `"p"`. Ignored when `asChild` is set. */
  as?: ElementType;
  /** Render the single child element instead, merging these classes onto it. */
  asChild?: boolean;
  /** Clamp to N lines with a trailing ellipsis (product titles, descriptions). */
  lineClamp?: number;
  children?: ReactNode;
}

export interface TextProps
  extends TextOwnProps, Omit<HTMLAttributes<HTMLElement>, keyof TextOwnProps> {}

/**
 * One primitive for every piece of text. Pick a role with `variant`
 * (`display` · `h1`–`h6` · `body-lg` · `body` · `body-sm` · `caption` ·
 * `overline` · `label` · `price` · `price-original`); adjust with `weight`,
 * `tone`, `align`, `truncate` or `lineClamp`. Change the tag with `as` (keeps
 * the visual size) or hand rendering to a child with `asChild`.
 *
 * @example
 * <Text variant="overline" tone="muted">New in</Text>
 * <Heading level={1}>Fresh produce, delivered</Heading>
 * <Text as="h2" variant="h4" lineClamp={2}>{product.name}</Text>
 * <Text variant="price">₹1,299</Text> <Text variant="price-original">₹1,999</Text>
 */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  {
    as,
    asChild = false,
    variant,
    tone,
    weight,
    align,
    truncate,
    lineClamp,
    className,
    style,
    ...props
  },
  ref,
) {
  const Comp = (asChild ? Slot : (as ?? "p")) as ElementType;

  const clampStyle: CSSProperties | undefined =
    lineClamp != null && lineClamp > 0
      ? {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: lineClamp,
          overflow: "hidden",
        }
      : undefined;

  return (
    <Comp
      ref={ref}
      data-slot="text"
      className={cn(textVariants({ variant, tone, weight, align, truncate }), className)}
      style={clampStyle ? { ...clampStyle, ...style } : style}
      {...props}
    />
  );
});

/* --------------------------------------------------------------- Heading -- */

export interface HeadingProps extends Omit<TextProps, "as" | "variant"> {
  /** `1`–`6` → renders `<h1>`–`<h6>` and, unless `variant` overrides it, the
   *  matching size. Default `2`. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Visual size, independent of `level` — e.g. an `<h2>` that looks like `h4`. */
  variant?: HeadingVariant;
}

/**
 * Semantic heading sugar over `<Text>`: `level` sets both the tag and the
 * default size. Use `variant` to detach the look from the level.
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, variant, ...props },
  ref,
) {
  return (
    <Text
      ref={ref as never}
      as={`h${level}` as ElementType}
      variant={variant ?? (`h${level}` as HeadingVariant)}
      {...props}
    />
  );
});
