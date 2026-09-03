"use client";

import {
  forwardRef,
  useId,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";
import { ChevronDownIcon } from "../icon";

export type AccordionVariant = "separated" | "contained" | "ghost";
export type AccordionSize = "sm" | "md" | "lg";

export interface AccordionItem {
  /** Stable id used for open/close state and ARIA wiring. */
  value: string;
  /** The always-visible header. */
  title: ReactNode;
  /** Revealed when the item is open. */
  content: ReactNode;
  /** Optional node before the title (auto-sized for SVGs). */
  icon?: ReactNode;
  disabled?: boolean;
}

/** Root chrome — `variant` × `size`, same cva pattern as the rest of the kit. */
export const accordionVariants = cva("w-full text-ink", {
  variants: {
    variant: {
      separated: "flex flex-col gap-2",
      contained: "divide-y divide-line overflow-hidden rounded-gk-md border border-line",
      ghost: "divide-y divide-line",
    },
    size: { sm: "", md: "", lg: "" },
  },
  defaultVariants: { variant: "separated", size: "md" },
});

const ITEM: Record<AccordionVariant, string> = {
  separated: "overflow-hidden rounded-gk-md border border-line",
  contained: "",
  ghost: "",
};

const TRIGGER_PAD: Record<AccordionSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-3 text-sm",
  lg: "px-5 py-4 text-base",
};
const CONTENT_PAD: Record<AccordionSize, string> = {
  sm: "px-3 pb-2.5 pt-2 text-xs",
  md: "px-4 pb-3.5 pt-3 text-sm",
  lg: "px-5 pb-4 pt-3.5 text-sm",
};
const CHEVRON: Record<AccordionSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-[1.15rem]",
};

export interface AccordionProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">,
    VariantProps<typeof accordionVariants> {
  items: AccordionItem[];
  /** `single` (default) closes siblings when one opens; `multiple` allows many. */
  type?: "single" | "multiple";
  /** Uncontrolled initial open value(s). */
  defaultValue?: string | string[];
  /** Controlled open value(s). */
  value?: string | string[];
  /** Fires with the full list of open values on every change. */
  onValueChange?: (value: string[]) => void;
  /** `single` mode only — allow clicking the open item to close it. Default `true`. */
  collapsible?: boolean;
}

const toArray = (v: string | string[] | undefined): string[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];

/**
 * A data-driven disclosure list. Pass `items` (`value` / `title` / `content`);
 * `type`, `variant` (`separated` | `contained` | `ghost`) and `size`
 * (`sm` | `md` | `lg`) shape it. Open state is controllable via
 * `value` / `defaultValue` / `onValueChange`. The panel animates open with a
 * grid-rows transition — no height measuring, no dependency.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  {
    items,
    type = "single",
    defaultValue,
    value,
    onValueChange,
    collapsible = true,
    variant,
    size,
    className,
    ...rest
  },
  ref,
) {
  const resolvedSize: AccordionSize = size ?? "md";
  const resolvedVariant: AccordionVariant = variant ?? "separated";

  const [open, setOpen] = useControllableState<string[]>({
    value: value === undefined ? undefined : toArray(value),
    defaultValue: toArray(defaultValue),
    onChange: onValueChange,
  });

  const baseId = useId();

  const toggle = (v: string) => {
    const isOpen = open.includes(v);
    if (type === "multiple") {
      setOpen(isOpen ? open.filter((x) => x !== v) : [...open, v]);
      return;
    }
    setOpen(isOpen ? (collapsible ? [] : [v]) : [v]);
  };

  return (
    <div ref={ref} className={cn(accordionVariants({ variant: resolvedVariant, size: resolvedSize }), className)} {...rest}>
      {items.map((item) => {
        const isOpen = open.includes(item.value);
        const triggerId = `${baseId}-${item.value}-trigger`;
        const panelId = `${baseId}-${item.value}-panel`;
        return (
          <div key={item.value} className={ITEM[resolvedVariant]}>
            <h3 className="m-0">
              <button
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                disabled={item.disabled}
                onClick={() => toggle(item.value)}
                className={cn(
                  "flex w-full items-center gap-3 text-left font-semibold transition-colors",
                  "hover:text-leaf disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-ink",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40 focus-visible:ring-inset",
                  TRIGGER_PAD[resolvedSize],
                )}
              >
                {item.icon ? (
                  <span className="flex shrink-0 items-center text-muted [&_svg]:size-4">{item.icon}</span>
                ) : null}
                <span className="min-w-0 flex-1">{item.title}</span>
                <ChevronDownIcon
                  className={cn(
                    "shrink-0 text-muted transition-transform duration-200",
                    CHEVRON[resolvedSize],
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div
                  className={cn(
                    "leading-relaxed text-muted",
                    CONTENT_PAD[resolvedSize],
                    resolvedVariant === "separated" && "border-t border-line",
                  )}
                >
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
