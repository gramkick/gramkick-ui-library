import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";
import { ChevronDownIcon as ChevronIcon, XIcon as CrossIcon, CheckIcon as TickIcon } from "../icon";

/* ------------------------------------------------------------------ types -- */

export interface DropdownOption {
  /** Stable identity used as the selection value. */
  value: string;
  /** Primary text — node or string. */
  label: ReactNode;
  /** Secondary line under the label — node or string. */
  subtext?: ReactNode;
  /** Right-aligned metadata (e.g. a count or shortcut) — node or string. */
  tertiary?: ReactNode;
  /** Leading element in the option row. */
  icon?: ReactNode;
  disabled?: boolean;
  /**
   * Red styling for a destructive row (e.g. "Delete"). Honoured by `ListItems`
   * and `MenuButton`; ignored by `Dropdown` itself.
   */
  destructive?: boolean;
  /**
   * Draw a divider above this row. Honoured by `ListItems` and `MenuButton`;
   * ignored by `Dropdown` itself.
   */
  separated?: boolean;
  /** Extra fields are allowed so `searchKeys` can point at them. */
  [key: string]: unknown;
}

/** Grouped options: `{ "Food & oil": [...], "Rice & grain": [...] }`. Used when
 *  `isCategoriesList` is set. */
export type DropdownCategories = Record<string, DropdownOption[]>;

export type DropdownOptions = DropdownOption[] | DropdownCategories;

/**
 * Normalize flat-or-grouped options into an ordered list of groups. A plain
 * array (or `grouped` off) collapses to a single unlabeled group, so callers can
 * treat every list the same way.
 */
export function toOptionGroups(
  options: DropdownOptions,
  grouped: boolean,
): { label: string | null; options: DropdownOption[] }[] {
  if (grouped && !Array.isArray(options)) {
    return Object.entries(options).map(([label, opts]) => ({ label, options: opts ?? [] }));
  }
  const flat = Array.isArray(options) ? options : Object.values(options).flat();
  return [{ label: null, options: flat }];
}

export const dropdownTriggerVariants = cva(
  [
    "flex w-full items-center rounded-gk-md text-ink shadow-xs transition-[color,background-color,border-color,box-shadow]",
    "cursor-pointer text-left",
    "focus-visible:outline-none focus-visible:border-leaf focus-visible:ring-2 focus-visible:ring-leaf/30",
    "aria-expanded:border-leaf aria-expanded:ring-2 aria-expanded:ring-leaf/30",
    "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/25",
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
    "aria-[readonly=true]:cursor-default",
  ],
  {
    variants: {
      variant: {
        outline:
          "border border-line bg-canvas hover:border-muted/50 aria-disabled:hover:border-line",
        filled:
          "border border-transparent bg-mint hover:bg-art aria-expanded:bg-canvas aria-disabled:hover:bg-mint",
      },
      size: {
        sm: "min-h-9 px-2.5 text-sm",
        md: "min-h-11 px-3 text-sm",
        lg: "min-h-12 px-3.5 text-base",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

type DropdownSize = NonNullable<VariantProps<typeof dropdownTriggerVariants>["size"]>;

const SIZES: Record<
  DropdownSize,
  { content: string; chip: string; option: string; optionText: string; icon: string }
> = {
  sm: {
    content: "gap-1 py-1",
    chip: "gap-0.5 px-1.5 py-0.5 text-[0.6875rem]",
    option: "gap-2.5 px-2.5 py-1.5",
    optionText: "text-sm",
    icon: "[&_svg]:size-4",
  },
  md: {
    content: "gap-1.5 py-1.5",
    chip: "gap-1 px-2 py-0.5 text-xs",
    option: "gap-2.5 px-3 py-2",
    optionText: "text-sm",
    icon: "[&_svg]:size-4",
  },
  lg: {
    content: "gap-1.5 py-2",
    chip: "gap-1 px-2.5 py-1 text-sm",
    option: "gap-3 px-3.5 py-2.5",
    optionText: "text-base",
    icon: "[&_svg]:size-5",
  },
};

const MAX_MENU_HEIGHT = 320;

type Value = string | string[] | null;

type NavRow =
  | { kind: "all"; disabled: false }
  | { kind: "group"; label: ReactNode; disabled: true }
  | { kind: "option"; option: DropdownOption; disabled: boolean };

export interface DropdownProps extends VariantProps<typeof dropdownTriggerVariants> {
  /** Flat list, or — with `isCategoriesList` — an object keyed by category name. */
  options: DropdownOptions;
  /** Treat `options` as `{ category: DropdownOption[] }` and render grouped headings. */
  isCategoriesList?: boolean;
  /** Enable multi-select — options render with a checkbox and selections show as chips. */
  multiple?: boolean;
  /** Controlled value. `string` (single) or `string[]` (multiple). */
  value?: Value;
  defaultValue?: Value;
  onChange?: (value: Value) => void;

  /* field, mirrors `Input` */
  label?: ReactNode;
  /** Element rendered inside the trigger, before the value — typically an icon. */
  leftIcon?: ReactNode;
  placeholder?: string;
  hint?: ReactNode;
  error?: ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  id?: string;

  /* search */
  searchable?: boolean;
  /** Option keys matched against the query. Defaults to `["label", "value"]`; string values only. */
  searchKeys?: string[];
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;

  /* multi-select extras */
  /** Show a ✕ on each selected chip (multi). Default `true`. */
  removable?: boolean;
  /** Show a ✕ in the field to clear the whole selection. Default `true`. */
  clearable?: boolean;
  /** Multi-select only — add a "select all" row that toggles every enabled (filtered) option. */
  selectAll?: boolean;
  /** Label for the select-all row. Default `"Select all"`. */
  selectAllLabel?: ReactNode;

  emptyMessage?: ReactNode;
  className?: string;
  containerClassName?: string;
  menuClassName?: string;
}

const asText = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : "";

/**
 * Single / multi-select dropdown, built from scratch (no native `<select>`).
 *
 * - Field API matches `Input`: `label` / `placeholder` / `hint` / `error` /
 *   `disabled` / `readOnly` / `invalid` / `size` / `variant`.
 * - Options carry `label`, `subtext`, `tertiary` (right), `icon` (left) — any of
 *   them a node — plus `disabled`. Multi-select shows a checkbox per option.
 * - `searchable` + `searchKeys` filter the list by a query box in the menu — the
 *   query box moves to the bottom of the menu when it flips upward.
 * - `multiple` + `selectAll` adds a select-all row.
 * - The menu opens downward, and flips upward when the viewport lacks room below.
 */
export function Dropdown({
  options,
  isCategoriesList = false,
  multiple = false,
  value: valueProp,
  defaultValue,
  onChange,
  variant,
  size,
  label,
  leftIcon,
  placeholder = "Select…",
  hint,
  error,
  invalid,
  disabled = false,
  readOnly = false,
  required = false,
  id: idProp,
  searchable = false,
  searchKeys,
  searchPlaceholder = "Search…",
  onSearchChange,
  removable = true,
  clearable = true,
  selectAll = false,
  selectAllLabel = "Select all",
  emptyMessage = "No options",
  className,
  containerClassName,
  menuClassName,
}: DropdownProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const listboxId = `${id}-listbox`;
  const resolvedSize: DropdownSize = size ?? "md";
  const sz = SIZES[resolvedSize];

  const isInvalid = Boolean(invalid) || Boolean(error);
  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null].filter(Boolean).join(" ") || undefined;

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
  const hasValue = selectedValues.length > 0;

  const commit = useCallback(
    (next: string[]) => setRawValue(multiple ? next : (next[next.length - 1] ?? null)),
    [multiple, setRawValue],
  );

  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const query = search.trim().toLowerCase();
  const keys = useMemo(() => searchKeys ?? ["label", "value"], [searchKeys]);

  const groups = useMemo(
    () => toOptionGroups(options, isCategoriesList),
    [options, isCategoriesList],
  );
  const flatOptions = useMemo(() => groups.flatMap((g) => g.options), [groups]);

  // Filter within each group and drop the ones left empty.
  const filteredGroups = useMemo(() => {
    if (!searchable || !query) return groups;
    return groups
      .map((g) => ({
        label: g.label,
        options: g.options.filter((o) =>
          keys.some((k) => asText(o[k]).toLowerCase().includes(query)),
        ),
      }))
      .filter((g) => g.options.length > 0);
  }, [groups, searchable, query, keys]);
  const filtered = useMemo(() => filteredGroups.flatMap((g) => g.options), [filteredGroups]);

  const selectedOptions = useMemo(
    () =>
      selectedValues
        .map((v) => flatOptions.find((o) => o.value === v))
        .filter(Boolean) as DropdownOption[],
    [selectedValues, flatOptions],
  );
  const singleOption = !multiple ? selectedOptions[0] : undefined;

  // Navigable rows: an optional "select all" row, then each group's heading + options.
  const showSelectAll = multiple && selectAll && filtered.length > 0;
  const navRows = useMemo<NavRow[]>(() => {
    const rows: NavRow[] = [];
    if (showSelectAll) rows.push({ kind: "all", disabled: false });
    for (const g of filteredGroups) {
      if (g.label != null) rows.push({ kind: "group", label: g.label, disabled: true });
      for (const option of g.options) {
        rows.push({ kind: "option", option, disabled: Boolean(option.disabled) });
      }
    }
    return rows;
  }, [showSelectAll, filteredGroups]);

  const enabledFilteredValues = useMemo(
    () => filtered.filter((o) => !o.disabled).map((o) => o.value),
    [filtered],
  );
  const allChecked =
    enabledFilteredValues.length > 0 &&
    enabledFilteredValues.every((v) => selectedValues.includes(v));
  const someChecked = !allChecked && enabledFilteredValues.some((v) => selectedValues.includes(v));

  /* ---- open / close ---- */
  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);
  const toggleOpen = useCallback(() => {
    if (disabled || readOnly) return;
    setOpen((o) => !o);
  }, [disabled, readOnly]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [open, close]);

  // Active row: first selected option, else first enabled row.
  useEffect(() => {
    if (!open) return;
    const selIdx = navRows.findIndex(
      (r) => r.kind === "option" && selectedValues.includes(r.option.value),
    );
    setActiveIndex(selIdx >= 0 ? selIdx : navRows.findIndex((r) => !r.disabled));
    if (searchable) searchRef.current?.focus();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setActiveIndex(navRows.findIndex((r) => !r.disabled));
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeIndex >= 0) optionRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  /* ---- auto up / down placement ---- */
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuHeight = Math.min(menuRef.current?.scrollHeight ?? 260, MAX_MENU_HEIGHT);
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setPlacement(spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow ? "top" : "bottom");
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, navRows.length]);

  /* ---- selection ---- */
  const selectOption = useCallback(
    (opt: DropdownOption) => {
      if (opt.disabled) return;
      if (multiple) {
        commit(
          selectedValues.includes(opt.value)
            ? selectedValues.filter((v) => v !== opt.value)
            : [...selectedValues, opt.value],
        );
      } else {
        commit([opt.value]);
        close();
        triggerRef.current?.focus();
      }
    },
    [multiple, selectedValues, commit, close],
  );
  const removeOne = useCallback(
    (v: string) => commit(selectedValues.filter((x) => x !== v)),
    [selectedValues, commit],
  );
  const clearAll = useCallback(() => commit([]), [commit]);

  const toggleAll = useCallback(() => {
    if (!enabledFilteredValues.length) return;
    commit(
      allChecked
        ? selectedValues.filter((v) => !enabledFilteredValues.includes(v))
        : Array.from(new Set([...selectedValues, ...enabledFilteredValues])),
    );
  }, [enabledFilteredValues, allChecked, selectedValues, commit]);

  const activateRow = useCallback(
    (row: NavRow | undefined) => {
      if (!row || row.disabled) return;
      if (row.kind === "all") toggleAll();
      else selectOption(row.option);
    },
    [toggleAll, selectOption],
  );

  /* ---- keyboard ---- */
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

  const onNavKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (disabled || readOnly) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!open) setOpen(true);
          else moveActive(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (!open) setOpen(true);
          else moveActive(-1);
          break;
        case "Home":
          if (open) {
            e.preventDefault();
            setActiveIndex(navRows.findIndex((r) => !r.disabled));
          }
          break;
        case "End":
          if (open) {
            e.preventDefault();
            for (let i = navRows.length - 1; i >= 0; i--)
              if (!navRows[i]!.disabled) {
                setActiveIndex(i);
                break;
              }
          }
          break;
        case "Enter":
          if (open && activeIndex >= 0 && navRows[activeIndex]) {
            e.preventDefault();
            activateRow(navRows[activeIndex]);
          } else if (!open) {
            e.preventDefault();
            setOpen(true);
          }
          break;
        case " ":
          if (!searchable) {
            e.preventDefault();
            if (!open) setOpen(true);
            else if (activeIndex >= 0 && navRows[activeIndex]) activateRow(navRows[activeIndex]);
          }
          break;
        case "Escape":
          if (open) {
            e.preventDefault();
            close();
            triggerRef.current?.focus();
          }
          break;
        case "Tab":
          if (open) close();
          break;
        default:
      }
    },
    [disabled, readOnly, open, moveActive, navRows, activeIndex, activateRow, searchable, close],
  );

  const activeDescendant =
    open && activeIndex >= 0 && navRows[activeIndex]
      ? `${listboxId}-opt-${activeIndex}`
      : undefined;

  const showClear = clearable && hasValue && !disabled && !readOnly;

  const searchNode = searchable ? (
    <div
      className={cn("p-2", placement === "top" ? "border-t border-line" : "border-b border-line")}
    >
      <input
        ref={searchRef}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onSearchChange?.(e.target.value);
        }}
        onKeyDown={onNavKeyDown}
        placeholder={searchPlaceholder}
        aria-label="Search options"
        aria-controls={listboxId}
        aria-activedescendant={activeDescendant}
        className="h-8 w-full rounded-gk-sm border border-line bg-canvas px-2.5 text-sm text-ink placeholder:text-muted focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/30"
      />
    </div>
  ) : null;

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
    <div ref={rootRef} className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label != null ? (
        <span
          id={labelId}
          className={cn("text-sm font-medium text-ink", disabled && "opacity-60")}
          onClick={() => !disabled && !readOnly && triggerRef.current?.focus()}
        >
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </span>
      ) : null}

      <div className="relative">
        <div
          ref={triggerRef}
          role="combobox"
          tabIndex={disabled ? -1 : 0}
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-disabled={disabled || undefined}
          aria-readonly={readOnly || undefined}
          aria-invalid={isInvalid || undefined}
          aria-required={required || undefined}
          aria-labelledby={label != null ? labelId : undefined}
          aria-describedby={describedBy}
          aria-activedescendant={!searchable ? activeDescendant : undefined}
          onClick={toggleOpen}
          onKeyDown={onNavKeyDown}
          className={cn(dropdownTriggerVariants({ variant, size }), className)}
        >
          {leftIcon ? (
            <span className={cn("flex shrink-0 items-center self-center pe-1.5 text-muted", sz.icon)}>
              {leftIcon}
            </span>
          ) : null}
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-nowrap items-center overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              sz.content,
            )}
          >
            {multiple ? (
              selectedOptions.length ? (
                selectedOptions.map((o) => (
                  <span
                    key={o.value}
                    className={cn(
                      "inline-flex max-w-full shrink-0 items-center rounded-gk-sm bg-mint font-medium text-leaf-dark",
                      sz.chip,
                    )}
                  >
                    {removable && !readOnly && !disabled ? (
                      <button
                        type="button"
                        aria-label={`Remove ${asText(o.label) || o.value}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOne(o.value);
                        }}
                        className="-ml-0.5 flex shrink-0 cursor-pointer items-center rounded-full text-leaf-dark/70 hover:bg-art hover:text-leaf-dark"
                      >
                        <CrossIcon className="size-3" />
                      </button>
                    ) : null}
                    {o.icon ? (
                      <span className="flex shrink-0 [&_svg]:size-3.5">{o.icon}</span>
                    ) : null}
                    <span className="min-w-0 truncate">{o.label}</span>
                  </span>
                ))
              ) : (
                <span className="truncate text-muted">{placeholder}</span>
              )
            ) : singleOption ? (
              <span className="inline-flex min-w-0 items-center gap-2">
                {singleOption.icon ? (
                  <span className={cn("flex shrink-0 text-muted", sz.icon)}>
                    {singleOption.icon}
                  </span>
                ) : null}
                <span className="truncate">{singleOption.label}</span>
              </span>
            ) : (
              <span className="truncate text-muted">{placeholder}</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 self-center pl-1">
            {showClear ? (
              <button
                type="button"
                aria-label="Clear selection"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                  triggerRef.current?.focus();
                }}
                className="flex cursor-pointer items-center rounded-full p-0.5 text-muted hover:bg-mint hover:text-ink"
              >
                <CrossIcon className="size-3.5" />
              </button>
            ) : null}
            <ChevronIcon
              className={cn("size-4 text-muted transition-transform", open && "rotate-180")}
            />
          </div>
        </div>

        {open ? (
          <div
            ref={menuRef}
            className={cn(
              "absolute inset-x-0 z-50 overflow-hidden rounded-gk-md border border-line bg-surface shadow-modal",
              placement === "top" ? "bottom-full mb-1" : "top-full mt-1",
              menuClassName,
            )}
          >
            {placement === "top" ? null : searchNode}

            <ul
              id={listboxId}
              role="listbox"
              aria-multiselectable={multiple || undefined}
              aria-labelledby={label != null ? labelId : undefined}
              className="max-h-[320px] overflow-y-auto py-1"
            >
              {!navRows.some((r) => r.kind === "option") ? (
                <li role="presentation" className="px-3 py-6 text-center text-sm text-muted">
                  {emptyMessage}
                </li>
              ) : (
                navRows.map((row, i) => {
                  const active = i === activeIndex;
                  if (row.kind === "group") {
                    const firstGroupIndex = navRows.findIndex((r) => r.kind === "group");
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
                        id={`${listboxId}-opt-${i}`}
                        role="option"
                        aria-selected={allChecked}
                        ref={(n) => {
                          optionRefs.current[i] = n;
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
                  const isSelected = selectedValues.includes(o.value);
                  return (
                    <li
                      key={o.value}
                      id={`${listboxId}-opt-${i}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={o.disabled || undefined}
                      ref={(n) => {
                        optionRefs.current[i] = n;
                      }}
                      onMouseEnter={() => !o.disabled && setActiveIndex(i)}
                      onClick={() => selectOption(o)}
                      className={cn(
                        "flex cursor-pointer items-center",
                        sz.option,
                        sz.optionText,
                        sz.icon,
                        o.disabled && "cursor-not-allowed opacity-50",
                        active && !o.disabled && "bg-mint",
                        isSelected && !active && "bg-mint/50",
                      )}
                    >
                      {multiple ? checkboxBox(isSelected) : null}

                      {o.icon ? <span className="flex shrink-0 text-muted">{o.icon}</span> : null}

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-ink">{o.label}</span>
                        {o.subtext != null ? (
                          <span className="mt-0.5 block truncate text-xs font-normal text-muted">
                            {o.subtext}
                          </span>
                        ) : null}
                      </span>

                      {o.tertiary != null ? (
                        <span className="shrink-0 pl-2 text-xs text-muted">{o.tertiary}</span>
                      ) : null}

                      {!multiple && isSelected ? (
                        <TickIcon className="ml-1 size-4 shrink-0 text-leaf" />
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>

            {placement === "top" ? searchNode : null}
          </div>
        ) : null}
      </div>

      {error != null ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : hint != null ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
