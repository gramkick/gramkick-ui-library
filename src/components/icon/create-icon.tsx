import { forwardRef, type ReactNode, type SVGProps } from "react";
import { cn } from "../../lib/cn";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /**
   * Width **and** height. A number is treated as pixels. Defaults to `24`.
   * A CSS `size-*` / `h-* w-*` class on `className` still wins over this.
   */
  size?: number | string;
  /**
   * Sets `color` on the `<svg>` so every `currentColor` stroke / fill follows it.
   * Leave unset to inherit the surrounding text colour.
   */
  color?: string;
  /** Stroke width for the line icons. Defaults to `2` (on the 24×24 grid). */
  strokeWidth?: number | string;
  /**
   * Accessible label. When provided the icon is exposed as `role="img"` with this
   * name; when omitted the icon is `aria-hidden` (decorative).
   */
  title?: string;
}

interface CreateIconOptions {
  /** `"stroke"` = outline icon (default). `"fill"` = solid icon. */
  variant?: "stroke" | "fill";
  viewBox?: string;
}

/**
 * Build a memo-free icon component from raw `<path>` / `<circle>` / … children.
 * Every icon in the library is created through this so they share one prop
 * contract: `size`, `color`, `strokeWidth`, plus any native SVG attribute
 * (`className`, `onClick`, `fill`, `stroke`, …). Colour flows from `currentColor`.
 */
export function createIcon(
  displayName: string,
  children: ReactNode,
  { variant = "stroke", viewBox = "0 0 24 24" }: CreateIconOptions = {},
) {
  const isStroke = variant === "stroke";

  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
    { size = 24, color, strokeWidth = 2, title, className, style, ...rest },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={size}
        height={size}
        fill={isStroke ? "none" : "currentColor"}
        stroke={isStroke ? "currentColor" : undefined}
        strokeWidth={isStroke ? strokeWidth : undefined}
        strokeLinecap={isStroke ? "round" : undefined}
        strokeLinejoin={isStroke ? "round" : undefined}
        className={cn("shrink-0", className)}
        style={color ? { color, ...style } : style}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
        focusable="false"
        {...rest}
      >
        {children}
      </svg>
    );
  });

  Icon.displayName = displayName;
  return Icon;
}

/** The type of a component returned by {@link createIcon}. */
export type IconComponent = ReturnType<typeof createIcon>;
