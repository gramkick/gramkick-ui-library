import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";
import { toOptionGroups, type DropdownOption, type DropdownCategories } from "../dropdown/dropdown";
import { CheckIcon as TickIcon } from "../icon";

/** Same shape as a `Dropdown` option. */
export type ListItem = DropdownOption;
/** Grouped rows, keyed by category name — used with `isCategoriesList`. */
export type ListItemCategories = DropdownCategories;

/** Chrome around the option rows — mirrors `Dropdown`'s `variant` axis. */
export const listItemsVariants = cva("overflow-hidden rounded-gk-md", {
  variants: {
    variant: {
      outline: "border border-line bg-surface shadow-card",
      filled: "border border-transparent bg-mint",
      plain: "",
    },
  },
  defaultVariants: { variant: "outline" },
});

export type ListItemsVariant = NonNullable<VariantProps<typeof listItemsVariants>["variant"]>;
export type ListItemsSize = "sm" | "md" | "lg";

const SIZES: Record<ListItemsSize, { option: string; optionText: string; icon: string }> = {
  sm: { option: "gap-2.5 px-2.5 py-1.5", optionText: "text-sm", icon: "[&_svg]:size-4" },
  md: { option: "gap-2.5 px-3 py-2", optionText: "text-sm", icon: "[&_svg]:size-4" },
  lg: { option: "gap-3 px-3.5 py-2.5", optionText: "text-base", icon: "[&_svg]:size-5" },
};

type Value = string | string[] | null;

type NavRow =
  | { kind: "all"; disabled: false }
  | { kind: "group"; label: ReactNode; disabled: true }
  | { kind: "option"; option: ListItem; disabled: boolean; optionIndex: number };

export interface ListItemsProps extends VariantProps<typeof listItemsVariants> {
  /**
   * Rows to render — `label` / `subtext` / `tertiary` (right) / `icon` (left),
   * any a node, plus `disabled`. With `isCategoriesList`, pass an object keyed by
   * category name instead: `{ "Food & oil": [...], "Rice & grain": [...] }`.
   */
  options: ListItem[] | ListItemCategories;
  /** Treat `options` as `{ category: ListItem[] }` and render grouped headings. */
  isCategoriesList?: boolean;
  size?: ListItemsSize;
  /** Checkbox rows; selection is a `string[]`. */
  multiple?: boolean;
  /** Controlled selection — `string` (single) or `string[]` (multiple). */
  value?: Value;
  defaultValue?: Value;
  onChange?: (value: Value) => void;
  /** Fires on any enabled-row activation (click / Enter / Space), regardless of selection. */
  onItemClick?: (option: ListItem, index: number) => void;
  /** `false` = display-only: no selected state / checkboxes / ticks (rows still fire `onItemClick`). */
  selectable?: boolean;
  /**
   * ARIA role for the list. `"listbox"` (default) with `role="option"` rows, or
   * `"menu"` with `role="menuitem"` rows for an action menu (no selected state).
   */
  role?: "listbox" | "menu";
  /** Multi-select only — a "select all" row that toggles every enabled option. */
  selectAll?: boolean;
  selectAllLabel?: ReactNode;
  emptyMessage?: ReactNode;
  /** Max px height before the list scrolls. Default `320`; pass `0` / `Infinity` to disable. */
  maxHeight?: number;
  /** Accessible name for the list. */
  "aria-label"?: string;
  /** Classes for the wrapper card. */
  className?: string;
  /** Classes for the scrollable `<ul>`. */
  listClassName?: string;
  id?: string;
}

/**
 * The `Dropdown` option list on its own — pass `options` and it renders the same
 * selectable rows (icon / label / subtext / right-aligned `tertiary`, single tick
 * or multi checkboxes) inside a card. `variant` (`outline` | `filled` | `plain`)
 * × `size` (`sm` | `md` | `lg`) match `Dropdown`. Use it when you only need the
 * list, without a trigger or popover.
 */
export function ListItems({
  options,
  isCategoriesList = false,
  variant,
  size = "md",
  multiple = false,
  value: valueProp,
  defaultValue,
  onChange,
  onItemClick,
  selectable = true,
  role = "listbox",
  selectAll = false,
  selectAllLabel = "Select all",
  emptyMessage = "No items",
  maxHeight = 320,
  "aria-label": ariaLabel,
  className,
  listClassName,
  id: idProp,
}: ListItemsProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const sz = SIZES[size];

  const [rawValue, setRawValue] = useControllableState<Value>({
    value: valueProp,
    defaultValue: defaultValue ?? (multiple ? [] : null),
    onChange,
  });
  const selectedValues = useMemo<string[]>(
    () =>
      Array.isArray(rawValue) ? rawValue : rawValue == null || rawValue === "" ? [] : [rawValue],
    [rawValue],
  );

  const commit = useCallback(
    (next: string[]) => setRawValue(multiple ? next : (next[next.length - 1] ?? null)),
    [multiple, setRawValue],
  );

  const groups = useMemo(
    () => toOptionGroups(options, isCategoriesList),
    [options, isCategoriesList],
  );
  const flatOptions = useMemo(() => groups.flatMap((g) => g.options), [groups]);

  const showSelectAll = selectable && multiple && selectAll && flatOptions.length > 0;
  const navRows = useMemo<NavRow[]>(() => {
    const rows: NavRow[] = [];
    if (showSelectAll) rows.push({ kind: "all", disabled: false });
    let optionIndex = 0;
    for (const g of groups) {
      if (g.label != null) rows.push({ kind: "group", label: g.label, disabled: true });
      for (const option of g.options) {
        rows.push({ kind: "option", option, disabled: Boolean(option.disabled), optionIndex });
        optionIndex += 1;
      }
    }
    return rows;
  }, [showSelectAll, groups]);

  const enabledValues = useMemo(
    () => flatOptions.filter((o) => !o.disabled).map((o) => o.value),
    [flatOptions],
  );
  const allChecked =
    enabledValues.length > 0 && enabledValues.every((v) => selectedValues.includes(v));
  const someChecked = !allChecked && enabledValues.some((v) => selectedValues.includes(v));

  const [activeIndex, setActiveIndex] = useState(-1);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (activeIndex >= 0) rowRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  const selectOption = useCallback(
    (opt: ListItem, index: number) => {
      if (opt.disabled) return;
      onItemClick?.(opt, index);
      if (!selectable) return;
      if (multiple) {
        commit(
          selectedValues.includes(opt.value)
            ? selectedValues.filter((v) => v !== opt.value)
            : [...selectedValues, opt.value],
        );
      } else {
        commit([opt.value]);
      }
    },
    [onItemClick, selectable, multiple, selectedValues, commit],
  );

  const toggleAll = useCallback(() => {
    if (!enabledValues.length) return;
    commit(
      allChecked
        ? selectedValues.filter((v) => !enabledValues.includes(v))
        : Array.from(new Set([...selectedValues, ...enabledValues])),
    );
  }, [enabledValues, allChecked, selectedValues, commit]);

  const activateRow = useCallback(
    (row: NavRow | undefined) => {
      if (!row || row.disabled) return;
      if (row.kind === "all") toggleAll();
      else if (row.kind === "option") selectOption(row.option, row.optionIndex);
    },
    [toggleAll, selectOption],
  );

  const moveActive = useCallback(
    (dir: 1 | -1) => {
      const enabled = navRows.map((r, i) => (r.disabled ? -1 : i)).filter((i) => i >= 0);
      if (!enabled.length) return;
      const pos = enabled.indexOf(activeIndex);
      const nextPos =
        pos === -1
          ? dir > 0
            ? 0
            : enabled.length - 1
          : (pos + dir + enabled.length) % enabled.length;
      setActiveIndex(enabled[nextPos]!);
    },
    [navRows, activeIndex],
  );

  const onKeyDown = (e: ReactKeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(navRows.findIndex((r) => !r.disabled));
        break;
      case "End":
        e.preventDefault();
        for (let i = navRows.length - 1; i >= 0; i--)
          if (!navRows[i]!.disabled) {
            setActiveIndex(i);
            break;
          }
        break;
      case "Enter":
      case " ":
        if (activeIndex >= 0 && navRows[activeIndex]) {
          e.preventDefault();
          activateRow(navRows[activeIndex]);
        }
        break;
      default:
    }
  };

  const activeDescendant =
    activeIndex >= 0 && navRows[activeIndex] ? `${id}-row-${activeIndex}` : undefined;

  const checkboxBox = (checked: boolean, indeterminate = false) => (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked || indeterminate ? "border-leaf bg-leaf text-white" : "border-line bg-canvas",
      )}
    >
      {checked ? (
        <TickIcon className="size-3" />
      ) : indeterminate ? (
        <span className="h-0.5 w-2 rounded-full bg-white" />
      ) : null}
    </span>
  );

  return (
    <div className={cn(listItemsVariants({ variant }), className)}>
      <ul
        id={id}
        role={role}
        tabIndex={0}
        aria-multiselectable={role !== "menu" && selectable && multiple ? true : undefined}
        aria-label={ariaLabel}
        aria-activedescendant={activeDescendant}
        onKeyDown={onKeyDown}
        className={cn(
          "overflow-y-auto py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-leaf/30",
          listClassName,
        )}
        style={maxHeight && Number.isFinite(maxHeight) ? { maxHeight } : undefined}
      >
        {!navRows.some((r) => r.kind === "option") ? (
          <li role="presentation" className="px-3 py-6 text-center text-sm text-muted">
            {emptyMessage}
          </li>
        ) : (
          (() => {
            const firstGroupIndex = navRows.findIndex((r) => r.kind === "group");
            return navRows.map((row, i) => {
              const active = i === activeIndex;
              if (row.kind === "group") {
                return (
                  <li
                    key={`group-${i}`}
                    role="presentation"
                    className={cn(
                      "px-3 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-wide text-muted",
                      // divider only *between* groups, never above the first one
                      i > firstGroupIndex && "mt-1 border-t border-line",
                    )}
                  >
                    {row.label}
                  </li>
                );
              }
              if (row.kind === "all") {
                return (
                  <li
                    key="__all__"
                    id={`${id}-row-${i}`}
                    role="option"
                    aria-selected={allChecked}
                    ref={(n) => {
                      rowRefs.current[i] = n;
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => toggleAll()}
                    className={cn(
                      "flex cursor-pointer items-center border-b border-line font-medium",
                      sz.option,
                      sz.optionText,
                      active && "bg-mint",
                    )}
                  >
                    {checkboxBox(allChecked, someChecked)}
                    <span className="flex-1 text-ink">{selectAllLabel}</span>
                  </li>
                );
              }

              const o = row.option;
              const isSelected = selectable && selectedValues.includes(o.value);
              const destructive = Boolean(o.destructive);
              return (
                <li
                  key={o.value}
                  id={`${id}-row-${i}`}
                  role={role === "menu" ? "menuitem" : "option"}
                  aria-selected={role === "menu" || !selectable ? undefined : isSelected}
                  aria-disabled={o.disabled || undefined}
                  ref={(n) => {
                    rowRefs.current[i] = n;
                  }}
                  onMouseEnter={() => !o.disabled && setActiveIndex(i)}
                  onClick={() => selectOption(o, row.optionIndex)}
                  className={cn(
                    "flex cursor-pointer items-center",
                    sz.option,
                    sz.optionText,
                    sz.icon,
                    row.optionIndex > 0 && o.separated && "mt-1 border-t border-line",
                    o.disabled && "cursor-not-allowed opacity-50",
                    destructive && "text-danger",
                    active && !o.disabled && (destructive ? "bg-danger/10" : "bg-mint"),
                    isSelected && !active && "bg-mint/50",
                  )}
                >
                  {selectable && multiple ? checkboxBox(Boolean(isSelected)) : null}

                  {o.icon ? (
                    <span className={cn("flex shrink-0", destructive ? "text-danger" : "text-muted")}>{o.icon}</span>
                  ) : null}

                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate font-medium", destructive ? "text-danger" : "text-ink")}>{o.label}</span>
                    {o.subtext != null ? (
                      <span className="mt-0.5 block truncate text-xs font-normal text-muted">
                        {o.subtext}
                      </span>
                    ) : null}
                  </span>

                  {o.tertiary != null ? (
                    <span className="shrink-0 pl-2 text-xs text-muted">{o.tertiary}</span>
                  ) : null}

                  {selectable && !multiple && isSelected ? (
                    <TickIcon className="ml-1 size-4 shrink-0 text-leaf" />
                  ) : null}
                </li>
              );
            });
          })()
        )}
      </ul>
    </div>
  );
}
