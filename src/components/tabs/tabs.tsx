import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";

/* --------------------------------------------------------------- variants -- */

export const tabsListVariants = cva("flex items-stretch", {
  variants: {
    variant: {
      line: "border-b border-line",
      solid: "rounded-gk-md bg-mint p-1",
      soft: "",
      enclosed: "border-b border-line",
    },
    size: {
      sm: "gap-0.5",
      md: "gap-1",
      lg: "gap-1.5",
    },
  },
  defaultVariants: { variant: "line", size: "md" },
});

export const tabsTriggerVariants = cva(
  [
    "relative inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "text-muted hover:text-ink",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        line: "-mb-px border-b-2 border-transparent data-[state=active]:border-leaf data-[state=active]:text-ink",
        solid:
          "rounded-gk-sm data-[state=active]:bg-canvas data-[state=active]:text-ink data-[state=active]:shadow-xs",
        soft: "rounded-gk-md hover:bg-mint/60 data-[state=active]:bg-mint data-[state=active]:text-leaf-dark data-[state=active]:hover:bg-mint",
        enclosed:
          "-mb-px rounded-t-gk-md border border-transparent data-[state=active]:border-line data-[state=active]:border-b-canvas data-[state=active]:bg-canvas data-[state=active]:text-ink",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
        md: "h-10 px-4 text-sm [&_svg]:size-4",
        lg: "h-12 px-5 text-base [&_svg]:size-[1.15rem]",
      },
    },
    defaultVariants: { variant: "line", size: "md" },
  },
);

export type TabsVariant = NonNullable<VariantProps<typeof tabsTriggerVariants>["variant"]>;
export type TabsSize = NonNullable<VariantProps<typeof tabsTriggerVariants>["size"]>;

/* ---------------------------------------------------------------- context -- */

interface TabsContextValue {
  value: string | undefined;
  select: (value: string) => void;
  variant: TabsVariant;
  size: TabsSize;
  activationMode: "automatic" | "manual";
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<${component}> must be used inside <Tabs>`);
  return ctx;
}

const triggerId = (base: string, value: string) => `${base}-trigger-${value}`;
const panelId = (base: string, value: string) => `${base}-panel-${value}`;

/* ------------------------------------------------------------------- root -- */

export interface TabsItem {
  value: string;
  label: ReactNode;
  /** Panel body. Only used by the `items` convenience API. */
  content?: ReactNode;
  /** Leading element in the tab (auto-sized for SVGs). */
  icon?: ReactNode;
  /** Trailing count / status pill. */
  badge?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Visual style, shared by every tab. */
  variant?: TabsVariant;
  /** Tab sizing, shared by every tab. */
  size?: TabsSize;
  /** Controlled active tab value. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * Quick API: pass the tabs (and their `content`) as data and `Tabs` renders
   * the list + panels for you. Omit to compose `TabsList` / `TabsTrigger` /
   * `TabsContent` as children instead (children win if both are given).
   */
  items?: TabsItem[];
  /** `automatic` (default) selects a tab as it's focused with the arrow keys; `manual` waits for Enter / Space / click. */
  activationMode?: "automatic" | "manual";
}

/**
 * Tabbed navigation — `variant` (`line` | `solid` | `soft` | `enclosed`) ×
 * `size` (`sm` | `md` | `lg`), following the same cva pattern as `Button`.
 *
 * - Controllable via `value` / `defaultValue` / `onValueChange`.
 * - Pass `items` for the batteries-included version, or compose `TabsList` /
 *   `TabsTrigger` / `TabsContent` as children.
 * - Full ARIA tablist / roving-tabindex keyboard support (Arrow keys, Home, End);
 *   `activationMode` toggles select-on-focus vs. select-on-Enter.
 */
export function Tabs({
  value: valueProp,
  defaultValue,
  onValueChange,
  variant = "line",
  size = "md",
  items,
  activationMode = "automatic",
  className,
  children,
  ...rest
}: TabsProps) {
  const baseId = useId();
  const firstEnabled = items?.find((i) => !i.disabled)?.value;

  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue: defaultValue ?? firstEnabled,
  });

  const select = useCallback(
    (next: string) => {
      setValue(next);
      onValueChange?.(next);
    },
    [setValue, onValueChange],
  );

  const ctx = useMemo<TabsContextValue>(
    () => ({ value, select, variant, size, activationMode, baseId }),
    [value, select, variant, size, activationMode, baseId],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn("flex flex-col gap-3", className)} {...rest}>
        {items && !children ? (
          <>
            <TabsList>
              {items.map((it) => (
                <TabsTrigger
                  key={it.value}
                  value={it.value}
                  disabled={it.disabled}
                  icon={it.icon}
                  badge={it.badge}
                >
                  {it.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {items.map((it) => (
              <TabsContent key={it.value} value={it.value}>
                {it.content}
              </TabsContent>
            ))}
          </>
        ) : (
          children
        )}
      </div>
    </TabsContext.Provider>
  );
}

/* ------------------------------------------------------------------- list -- */

export type TabsListProps = HTMLAttributes<HTMLDivElement>;

export function TabsList({ className, children, onKeyDown, ...rest }: TabsListProps) {
  const { variant, size, select, activationMode } = useTabsContext("TabsList");
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;

    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? [],
    );
    if (!tabs.length) return;
    event.preventDefault();

    const current = tabs.findIndex((t) => t === document.activeElement);
    let nextIndex = current;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else if (event.key === "ArrowRight") nextIndex = current < 0 ? 0 : (current + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      nextIndex = current < 0 ? tabs.length - 1 : (current - 1 + tabs.length) % tabs.length;

    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    nextTab.focus();
    if (activationMode === "automatic" && nextTab.dataset.value) select(nextTab.dataset.value);
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn(tabsListVariants({ variant, size }), className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- trigger -- */

export interface TabsTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  /** Identity of the tab — must match a `TabsContent` `value`. */
  value: string;
  /** Leading element (auto-sized for SVGs). Ignored when `asChild` is set. */
  icon?: ReactNode;
  /** Trailing count / status pill. Ignored when `asChild` is set. */
  badge?: ReactNode;
  /**
   * Render the single child element instead of a `<button>` — e.g. a router
   * `<Link>` for tabbed navigation, so each tab is still a real anchor. The tab
   * props (`role`, `data-state`, click-to-select, classes) are merged onto the
   * child; `icon` / `badge` are not injected in this mode.
   */
  asChild?: boolean;
}

export function TabsTrigger({
  value,
  icon,
  badge,
  disabled = false,
  asChild = false,
  className,
  children,
  onClick,
  ...rest
}: TabsTriggerProps) {
  const { value: selected, select, variant, size, baseId } = useTabsContext("TabsTrigger");
  const isSelected = selected === value;

  const shared = {
    role: "tab",
    id: triggerId(baseId, value),
    "aria-selected": isSelected,
    "aria-controls": panelId(baseId, value),
    tabIndex: isSelected || selected == null ? 0 : -1,
    "data-value": value,
    "data-state": isSelected ? "active" : "inactive",
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      onClick?.(event as ReactMouseEvent<HTMLButtonElement>);
      if (!event.defaultPrevented) select(value);
    },
    className: cn(tabsTriggerVariants({ variant, size }), className),
  } as const;

  if (asChild) {
    return (
      <Slot aria-disabled={disabled || undefined} {...shared} {...rest}>
        {children}
      </Slot>
    );
  }

  return (
    <button type="button" disabled={disabled} {...shared} {...rest}>
      {icon != null ? (
        <span className="inline-flex shrink-0 items-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
      {badge != null ? (
        <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-leaf px-1 text-[0.6875rem] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

/* ---------------------------------------------------------------- content -- */

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  /** Keep the panel mounted (just hidden) while another tab is active. */
  forceMount?: boolean;
}

export function TabsContent({
  value,
  forceMount = false,
  className,
  children,
  ...rest
}: TabsContentProps) {
  const { value: selected, baseId } = useTabsContext("TabsContent");
  const isSelected = selected === value;

  if (!isSelected && !forceMount) return null;

  return (
    <div
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={triggerId(baseId, value)}
      hidden={!isSelected}
      tabIndex={0}
      data-state={isSelected ? "active" : "inactive"}
      className={cn(
        "min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        !isSelected && "hidden",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
