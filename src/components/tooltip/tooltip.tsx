import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";

/** Panel chrome — `variant` (tone) × `size`, same cva pattern as the rest. */
export const tooltipVariants = cva(
  "pointer-events-auto rounded-gk-md shadow-modal break-words [overflow-wrap:anywhere]",
  {
    variants: {
      variant: {
        dark: "bg-ink text-white",
        light: "border border-line bg-canvas text-ink",
        accent: "bg-leaf text-white",
        danger: "bg-danger text-white",
      },
      size: {
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-3 py-2 text-sm",
        lg: "px-3.5 py-2.5 text-sm",
      },
    },
    defaultVariants: { variant: "dark", size: "md" },
  },
);

export type TooltipVariant = NonNullable<VariantProps<typeof tooltipVariants>["variant"]>;
export type TooltipSize = NonNullable<VariantProps<typeof tooltipVariants>["size"]>;
export type TooltipSide = "top" | "bottom" | "left" | "right";
export type TooltipAlign = "start" | "center" | "end";
type TooltipTrigger = "hover" | "focus" | "click";

const ARROW_BG: Record<TooltipVariant, string> = {
  dark: "bg-ink",
  light: "bg-canvas",
  accent: "bg-leaf",
  danger: "bg-danger",
};
/** Which two edges of the rotated `light`-variant arrow face outward, per side. */
const LIGHT_ARROW_BORDER: Record<TooltipSide, string> = {
  top: "border-b border-r border-line",
  bottom: "border-t border-l border-line",
  left: "border-t border-r border-line",
  right: "border-b border-l border-line",
};
const DESC_COLOR: Record<TooltipVariant, string> = {
  dark: "text-white/80",
  light: "text-muted",
  accent: "text-white/85",
  danger: "text-white/85",
};
/** Divider above the actions footer of a rich tooltip. */
const DIVIDER: Record<TooltipVariant, string> = {
  dark: "border-white/15",
  light: "border-line",
  accent: "border-white/25",
  danger: "border-white/25",
};
const OPPOSITE: Record<TooltipSide, TooltipSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

const toLength = (v: number | string | undefined): string | undefined =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

export interface TooltipProps {
  /** The element the tooltip is attached to — a single React element. */
  children: ReactNode;
  /** Tooltip body (the "text"). Node or string. */
  content: ReactNode;
  /** Secondary line under the content. */
  description?: ReactNode;
  /** Buttons / links rendered at the bottom (any nodes). */
  actions?: ReactNode;

  /** Preferred side; auto-flips to the opposite side when it would overflow. */
  side?: TooltipSide;
  /** Alignment along that side. Default `center`. */
  align?: TooltipAlign;
  /** Show the triangle pointer. Default `true`. */
  arrow?: boolean;

  variant?: TooltipVariant;
  size?: TooltipSize;

  /** What opens it — one or several of `hover` / `focus` / `click`. Default `["hover", "focus"]`. */
  trigger?: TooltipTrigger | TooltipTrigger[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hover open / close delay in ms. */
  openDelay?: number;
  closeDelay?: number;

  /** Wrapping width. number (px) or any CSS length. Default `16rem`. */
  maxWidth?: number | string;
  disabled?: boolean;

  /** Classes for the panel. */
  className?: string;
  /** Classes for the inline wrapper around `children`. */
  triggerClassName?: string;
  id?: string;
}

/**
 * A hover / focus / click tooltip. `content` / `description` / `actions` all take
 * any node; `variant` (`dark` | `light` | `accent` | `danger`) × `size`
 * (`sm` | `md` | `lg`) follow the shared pattern. `side` (`top` | `bottom` |
 * `left` | `right`, auto-flips) + `align` place it, `arrow` toggles the tip, and
 * the text wraps at `maxWidth` (never past the viewport).
 */
export function Tooltip({
  children,
  content,
  description,
  actions,
  side = "top",
  align = "center",
  arrow = true,
  variant = "dark",
  size = "md",
  trigger = ["hover", "focus"],
  open: openProp,
  defaultOpen,
  onOpenChange,
  openDelay = 150,
  closeDelay,
  maxWidth,
  disabled = false,
  className,
  triggerClassName,
  id: idProp,
}: TooltipProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const triggers = useMemo(() => (Array.isArray(trigger) ? trigger : [trigger]), [trigger]);
  const interactive = triggers.includes("click") || actions != null;
  const rich = description != null || actions != null;
  const resolvedCloseDelay = closeDelay ?? (interactive ? 150 : 60);
  const resolvedMaxWidth = maxWidth ?? (rich ? "20rem" : "16rem");

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const [placedSide, setPlacedSide] = useState<TooltipSide>(side);

  const wrapperRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  useEffect(() => clearTimers, []);

  const show = useCallback(
    (delay = 0) => {
      if (disabled) return;
      clearTimers();
      if (delay <= 0) setOpen(true);
      else openTimer.current = setTimeout(() => setOpen(true), delay);
    },
    [disabled, setOpen],
  );
  const hide = useCallback(
    (delay = 0) => {
      clearTimers();
      if (delay <= 0) setOpen(false);
      else closeTimer.current = setTimeout(() => setOpen(false), delay);
    },
    [setOpen],
  );

  /* ---- outside click + Escape (click trigger) ---- */
  useEffect(() => {
    if (!open || !triggers.includes("click")) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) hide(0);
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [open, triggers, hide]);

  /* ---- flip to the opposite side on overflow ---- */
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const w = wrapperRef.current;
      const p = panelRef.current;
      if (!w || !p) return;
      const wr = w.getBoundingClientRect();
      const pr = p.getBoundingClientRect();
      if (pr.width === 0 && pr.height === 0) {
        setPlacedSide(side); // can't measure (e.g. jsdom) — just honour the prop
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const room: Record<TooltipSide, number> = {
        top: wr.top,
        bottom: vh - wr.bottom,
        left: wr.left,
        right: vw - wr.right,
      };
      const need = side === "left" || side === "right" ? pr.width : pr.height;
      const next =
        room[side] < need + 10 && room[OPPOSITE[side]] > room[side] ? OPPOSITE[side] : side;
      setPlacedSide(next);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, side]);

  /* ---- wrapper handlers ---- */
  const onMouseEnter = () => triggers.includes("hover") && show(openDelay);
  const onMouseLeave = () => triggers.includes("hover") && hide(resolvedCloseDelay);
  const onFocus = () => triggers.includes("focus") && show(0);
  const onBlur = () => triggers.includes("focus") && hide(0);
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      hide(0);
    }
  };

  const child = isValidElement(children) ? (children as ReactElement) : null;
  const childOnClick = (child?.props as { onClick?: (e: ReactMouseEvent) => void } | undefined)
    ?.onClick;
  const triggerNode =
    child != null ? (
      cloneElement(child as ReactElement<Record<string, unknown>>, {
        onClick: (e: ReactMouseEvent) => {
          childOnClick?.(e);
          if (triggers.includes("click") && !disabled) (open ? hide : show)(0);
        },
        ...(disabled
          ? {}
          : interactive
            ? { "aria-expanded": open, "aria-haspopup": "dialog" }
            : { "aria-describedby": open ? id : undefined }),
      })
    ) : (
      <span>{children}</span>
    );

  /* ---- placement classes ---- */
  const horizontal = placedSide === "top" || placedSide === "bottom";
  const sideClass = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  }[placedSide];
  const alignClass = horizontal
    ? align === "start"
      ? "left-0"
      : align === "end"
        ? "right-0"
        : "left-1/2 -translate-x-1/2"
    : align === "start"
      ? "top-0"
      : align === "end"
        ? "bottom-0"
        : "top-1/2 -translate-y-1/2";
  const arrowClass = {
    top: "-bottom-1 left-1/2 -translate-x-1/2",
    bottom: "-top-1 left-1/2 -translate-x-1/2",
    left: "-right-1 top-1/2 -translate-y-1/2",
    right: "-left-1 top-1/2 -translate-y-1/2",
  }[placedSide];

  return (
    <span
      ref={wrapperRef}
      className={cn("relative inline-flex w-fit max-w-full", triggerClassName)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      {triggerNode}

      {open && !disabled && content != null ? (
        <div
          ref={panelRef}
          id={id}
          role={interactive ? "dialog" : "tooltip"}
          aria-label={interactive && typeof content === "string" ? content : undefined}
          data-slot="tooltip"
          data-side={placedSide}
          className={cn(
            "absolute z-50 w-max max-w-[calc(100vw-1rem)]",
            sideClass,
            alignClass,
            tooltipVariants({ variant, size }),
            rich && "min-w-[12rem] px-3.5 py-3",
            className,
          )}
          style={{ maxWidth: toLength(resolvedMaxWidth) }}
          onMouseEnter={() => triggers.includes("hover") && show(0)}
          onMouseLeave={() => triggers.includes("hover") && hide(resolvedCloseDelay)}
        >
          <div className={cn("whitespace-normal", rich && "font-semibold leading-snug")}>
            {content}
          </div>
          {description != null ? (
            <div
              className={cn(
                "mt-1 whitespace-normal text-[0.8125rem] font-normal leading-snug",
                DESC_COLOR[variant],
              )}
            >
              {description}
            </div>
          ) : null}
          {actions != null ? (
            <div
              className={cn(
                "mt-2.5 flex flex-wrap items-center justify-end gap-2 border-t pt-2.5",
                DIVIDER[variant],
              )}
            >
              {actions}
            </div>
          ) : null}

          {arrow ? (
            <span
              aria-hidden="true"
              data-slot="tooltip-arrow"
              className={cn(
                "absolute size-2 rotate-45 rounded-[1px]",
                ARROW_BG[variant],
                variant === "light" && LIGHT_ARROW_BORDER[placedSide],
                arrowClass,
              )}
            />
          ) : null}
        </div>
      ) : null}
    </span>
  );
}
