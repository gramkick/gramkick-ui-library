import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { Button, type buttonVariants } from "./button";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface MenuButtonItem {
  /** Row content. */
  label: ReactNode;
  /** Fired when the row is chosen (click / Enter / Space). The menu then closes. */
  onSelect?: () => void;
  /** Leading icon, auto-sized for SVGs. */
  icon?: ReactNode;
  disabled?: boolean;
  /** Red styling for destructive actions (e.g. "Delete"). */
  destructive?: boolean;
  /** Draw a divider above this row. */
  separated?: boolean;
}

export type MenuButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onSelect" | "type" | "children"
> &
  VariantProps<typeof buttonVariants> & {
    /** Trigger text — shown before the chevron. */
    label: ReactNode;
    /** The actions shown while the menu is open. */
    items: MenuButtonItem[];
    /** Icon before the label. */
    leftIcon?: ReactNode;
    /** Also open on mouse hover (still opens on click / keyboard, closes on leave / outside / Escape). */
    openOnHover?: boolean;
    /** Which trigger edge the menu lines up with. */
    align?: "start" | "end";
    /** Extra classes for the portalled menu list. */
    menuClassName?: string;
    /** Called whenever the menu opens or closes. */
    onOpenChange?: (open: boolean) => void;
  };

/**
 * A {@link Button} that opens a list of actions. It reuses every `buttonVariants`
 * `variant` × `size`, adds a trailing chevron that flips while open, and renders
 * the list in a `document.body` portal so it escapes any `overflow` container.
 * Full keyboard support (↑/↓/Home/End/Enter/Esc); hover opening is opt-in via
 * `openOnHover`.
 */
export const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(function MenuButton(
  {
    label,
    items,
    variant,
    size,
    leftIcon,
    openOnHover = false,
    align = "start",
    menuClassName,
    onOpenChange,
    className,
    disabled,
    id,
    onClick,
    onKeyDown,
    ...props
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left?: number;
    right?: number;
    minWidth: number;
  } | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  const setTriggerRef = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const setOpenState = useCallback(
    (next: boolean) => {
      setOpen((prev) => {
        if (prev !== next) onOpenChange?.(next);
        return next;
      });
      if (!next) setActiveIndex(-1);
    },
    [onOpenChange],
  );

  const enabledIndexes = items.reduce<number[]>((acc, item, i) => {
    if (!item.disabled) acc.push(i);
    return acc;
  }, []);

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({
      top: r.bottom + 6,
      minWidth: r.width,
      ...(align === "end"
        ? { right: Math.max(8, window.innerWidth - r.right) }
        : { left: Math.max(8, r.left) }),
    });
  }, [align]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpenState(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenState(false);
        triggerRef.current?.focus();
      }
    };
    const reflow = () => place();
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", reflow);
    window.addEventListener("scroll", reflow, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reflow);
      window.removeEventListener("scroll", reflow, true);
    };
  }, [open, place, setOpenState]);

  useEffect(() => {
    // `pos` in the deps: on a keyboard open the menu isn't in the DOM until the
    // layout effect has measured, so wait for that before moving focus.
    if (open && pos && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.focus({ preventScroll: true });
    }
  }, [open, pos, activeIndex]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const hoverOpen = (e: ReactPointerEvent) => {
    if (!openOnHover || disabled || e.pointerType !== "mouse") return;
    clearCloseTimer();
    setOpenState(true);
  };
  const hoverClose = () => {
    if (!openOnHover) return;
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpenState(false), 140);
  };

  const moveActive = (dir: 1 | -1) => {
    if (enabledIndexes.length === 0) return;
    const at = enabledIndexes.indexOf(activeIndex);
    const nextAt =
      at === -1
        ? dir === 1
          ? 0
          : enabledIndexes.length - 1
        : (at + dir + enabledIndexes.length) % enabledIndexes.length;
    setActiveIndex(enabledIndexes[nextAt] ?? -1);
  };

  const choose = (item: MenuButtonItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    setOpenState(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e);
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenState(true);
      setActiveIndex(enabledIndexes[0] ?? -1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpenState(true);
      setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
    }
  };

  const handleMenuKeyDown = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(enabledIndexes[0] ?? -1);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
    } else if (e.key === "Tab") {
      setOpenState(false);
    }
  };

  return (
    <>
      <Button
        {...props}
        ref={setTriggerRef}
        id={id}
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        data-state={open ? "open" : "closed"}
        leftIcon={leftIcon}
        rightIcon={
          <ChevronIcon className={cn("transition-transform duration-150", open && "rotate-180")} />
        }
        onClick={(e) => {
          onClick?.(e);
          if (!disabled) setOpenState(!open);
        }}
        onKeyDown={handleTriggerKeyDown}
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
      >
        {label}
      </Button>

      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <ul
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={typeof label === "string" ? label : undefined}
              onPointerEnter={hoverOpen}
              onPointerLeave={hoverClose}
              onKeyDown={handleMenuKeyDown}
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                right: pos.right,
                minWidth: pos.minWidth,
              }}
              className={cn(
                "z-[80] max-h-[min(60vh,20rem)] min-w-44 overflow-y-auto rounded-gk-md border border-line bg-canvas py-1 text-sm font-medium text-ink shadow-modal",
                menuClassName,
              )}
            >
              {items.map((item, i) => (
                <li
                  key={i}
                  role="none"
                  className={cn(item.separated && i > 0 && "mt-1 border-t border-line pt-1")}
                >
                  <button
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    disabled={item.disabled}
                    onClick={() => choose(item)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors",
                      "hover:bg-mint focus:bg-mint focus:outline-none",
                      "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
                      item.destructive && "text-danger hover:bg-danger/10 focus:bg-danger/10",
                    )}
                  >
                    {item.icon != null ? (
                      <span
                        className="inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-4"
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </>
  );
});
