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
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { Spinner } from "../spinner/spinner";

/* ------------------------------------------------------------------ icons -- */

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ types -- */

export interface AutosuggestOption {
  value: string;
  label: ReactNode;
  subtext?: ReactNode;
  tertiary?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  [key: string]: unknown;
}

export const autosuggestFieldVariants = cva(
  [
    "flex w-full items-center rounded-gk-md text-ink shadow-xs transition-[color,background-color,border-color,box-shadow]",
    "focus-within:border-leaf focus-within:ring-2 focus-within:ring-leaf/30",
    "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/25",
  ],
  {
    variants: {
      variant: {
        outline: "border border-line bg-canvas hover:border-muted/50",
        filled: "border border-transparent bg-mint hover:bg-art focus-within:bg-canvas",
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

type FieldSize = NonNullable<VariantProps<typeof autosuggestFieldVariants>["size"]>;

const SIZES: Record<FieldSize, { option: string; optionText: string; icon: string; chip: string }> =
  {
    sm: {
      option: "gap-2.5 px-2.5 py-1.5",
      optionText: "text-sm",
      icon: "[&_svg]:size-4",
      chip: "gap-1 px-1.5 py-0.5 text-[0.6875rem]",
    },
    md: {
      option: "gap-2.5 px-3 py-2",
      optionText: "text-sm",
      icon: "[&_svg]:size-4",
      chip: "gap-1 px-2 py-0.5 text-xs",
    },
    lg: {
      option: "gap-3 px-3.5 py-2.5",
      optionText: "text-base",
      icon: "[&_svg]:size-5",
      chip: "gap-1 px-2.5 py-1 text-sm",
    },
  };

const MAX_MENU_HEIGHT = 320;
type Value = string | string[] | null;

const asText = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : "";

export interface AutosuggestProps extends VariantProps<typeof autosuggestFieldVariants> {
  /** Static option list, filtered locally as you type (unless `loadOptions`/`onSearch` is set). */
  options?: AutosuggestOption[];
  /** Async source — called (debounced) with the query; its resolved list becomes the suggestions. */
  loadOptions?: (query: string) => AutosuggestOption[] | Promise<AutosuggestOption[]>;
  /** Debounced query callback; you own fetching + updating `options` + `loading`. */
  onSearch?: (query: string) => void;
  /** External loading flag (merged with `loadOptions`'s own pending state). */
  loading?: boolean;

  multiple?: boolean;
  value?: Value;
  defaultValue?: Value;
  onChange?: (value: Value) => void;

  /** Debounce for the query in ms. Defaults to `250` when async, `0` when purely local. */
  debounce?: number;
  /** Minimum query length before suggestions show. Default `1`. */
  minChars?: number;
  /** Override the local match test (only used without `loadOptions`/`onSearch`). */
  filterOption?: (option: AutosuggestOption, query: string) => boolean;
  /** Option keys used for the default local filter. Default `["label", "value"]`; strings only. */
  searchKeys?: string[];
  /** Text put into the input when a single value is picked. Default: the option's label as text. */
  getInputValue?: (option: AutosuggestOption) => string;
  onInputChange?: (raw: string) => void;

  /* field, mirrors `Input` / `Dropdown` */
  label?: ReactNode;
  placeholder?: string;
  hint?: ReactNode;
  error?: ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  autoFocus?: boolean;

  /** ✕ on each selected chip (multi). Default `true`. */
  removable?: boolean;
  /** ✕ in the field to clear the selection + query. Default `true`. */
  clearable?: boolean;

  /** Add a "create" row (own input + Add button) at the bottom of the menu for free-text entries. */
  creatable?: boolean;
  /** Map the typed text to the option to add. Return an option, a string, or nothing (uses the text). */
  onCreate?: (text: string) => AutosuggestOption | string | void;
  /** Text on the create button. Default `"Add"`. */
  createLabel?: ReactNode;
  /** Placeholder for the create input. Default `"Add a new option"`. */
  createPlaceholder?: string;
  /** Accessible label for the create input. Default `"Create a new option"`. */
  createInputLabel?: string;

  emptyMessage?: ReactNode;
  loadingMessage?: ReactNode;
  minCharsMessage?: ReactNode;

  className?: string;
  containerClassName?: string;
  menuClassName?: string;
}

/**
 * Typeahead field: type to get suggestions (debounced), pick one or many. Follows
 * the `Dropdown` field pattern — `label` / `placeholder` / `hint` / `error` /
 * `disabled` / `readOnly` / `invalid` / `variant` / `size`, node-friendly options
 * (`label` / `subtext` / `tertiary` / `icon`), keyboard + ARIA combobox, and a
 * menu that flips upward when short of room.
 *
 * In multi mode the selected chips render in a row **at the bottom of the menu**
 * (below the suggestions); the input clears after each pick.
 */
export function Autosuggest({
  options,
  loadOptions,
  onSearch,
  loading: loadingProp,
  multiple = false,
  value: valueProp,
  defaultValue,
  onChange,
  debounce,
  minChars = 1,
  filterOption,
  searchKeys,
  getInputValue,
  onInputChange,
  variant,
  size,
  label,
  placeholder,
  hint,
  error,
  invalid,
  disabled = false,
  readOnly = false,
  required = false,
  id: idProp,
  name,
  autoFocus,
  removable = true,
  clearable = true,
  creatable = false,
  onCreate,
  createLabel = "Add",
  createPlaceholder = "Add a new option",
  createInputLabel = "Create a new option",
  emptyMessage = "No matches",
  loadingMessage = "Searching…",
  minCharsMessage,
  className,
  containerClassName,
  menuClassName,
}: AutosuggestProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const listboxId = `${id}-listbox`;
  const resolvedSize: FieldSize = size ?? "md";
  const sz = SIZES[resolvedSize];

  const isInvalid = Boolean(invalid) || Boolean(error);
  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  const isAsync = Boolean(loadOptions || onSearch);
  const delay = debounce ?? (isAsync ? 250 : 0);
  const labelToText = useMemo(
    () => getInputValue ?? ((o: AutosuggestOption) => asText(o.label)),
    [getInputValue],
  );
  const keys = useMemo(() => searchKeys ?? ["label", "value"], [searchKeys]);

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

  const [query, setQuery] = useState("");
  const [createText, setCreateText] = useState("");
  const debouncedQuery = useDebouncedValue(query, delay);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [internalOptions, setInternalOptions] = useState<AutosuggestOption[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const selectedCache = useRef(new Map<string, AutosuggestOption>());
  const onSearchRef = useRef(onSearch);
  const loadRef = useRef(loadOptions);
  const inputChangeRef = useRef(onInputChange);
  const requestId = useRef(0);
  onSearchRef.current = onSearch;
  loadRef.current = loadOptions;
  inputChangeRef.current = onInputChange;

  const trimmed = debouncedQuery.trim();
  const belowMin = trimmed.length < minChars;
  const loading = loadingProp ?? internalLoading;

  /* ---- async sources (debounced, race-safe) ---- */
  useEffect(() => {
    if (!loadRef.current) return;
    if (belowMin) {
      setInternalOptions([]);
      setInternalLoading(false);
      return;
    }
    const rid = ++requestId.current;
    setInternalLoading(true);
    Promise.resolve(loadRef.current(trimmed))
      .then((res) => {
        if (rid === requestId.current) setInternalOptions(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (rid === requestId.current) setInternalOptions([]);
      })
      .finally(() => {
        if (rid === requestId.current) setInternalLoading(false);
      });
  }, [trimmed, belowMin]);

  useEffect(() => {
    if (!onSearchRef.current || belowMin) return;
    onSearchRef.current(trimmed);
  }, [trimmed, belowMin]);

  /* ---- resolve the visible list ---- */
  const rawList = useMemo(
    () => (loadOptions ? internalOptions : (options ?? [])),
    [loadOptions, internalOptions, options],
  );
  const list = useMemo(() => {
    if (belowMin) return [];
    if (isAsync || !trimmed) return rawList;
    if (filterOption) return rawList.filter((o) => filterOption(o, trimmed));
    const q = trimmed.toLowerCase();
    return rawList.filter((o) => keys.some((k) => asText(o[k]).toLowerCase().includes(q)));
  }, [rawList, belowMin, isAsync, trimmed, filterOption, keys]);

  const optionIndex = useMemo(() => {
    const m = new Map<string, AutosuggestOption>(selectedCache.current);
    for (const o of options ?? []) m.set(o.value, o);
    for (const o of internalOptions) m.set(o.value, o);
    return m;
  }, [options, internalOptions]);
  const selectedOptions = selectedValues.map(
    (v) => optionIndex.get(v) ?? ({ value: v, label: v } as AutosuggestOption),
  );
  const singleOption = !multiple ? selectedOptions[0] : undefined;
  const hasValue = selectedValues.length > 0;

  /* ---- open / close ---- */
  const close = useCallback(() => setOpen(false), []);
  const openMenu = useCallback(() => {
    if (disabled || readOnly) return;
    setOpen(true);
  }, [disabled, readOnly]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        close();
        if (!multiple && singleOption) setQuery(labelToText(singleOption));
      }
    };
    document.addEventListener("pointerdown", onPointer, true);
    return () => document.removeEventListener("pointerdown", onPointer, true);
  }, [open, close, multiple, singleOption, labelToText]);

  useEffect(() => {
    setActiveIndex(list.length ? list.findIndex((o) => !o.disabled) : -1);
  }, [list]);

  useEffect(() => {
    if (activeIndex >= 0) optionRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  /* ---- auto up / down placement ---- */
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const field = fieldRef.current;
      if (!field) return;
      const rect = field.getBoundingClientRect();
      const menuHeight = Math.min(menuRef.current?.scrollHeight ?? 240, MAX_MENU_HEIGHT);
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
  }, [open, list.length, loading]);

  /* ---- selection ---- */
  const selectOption = useCallback(
    (opt: AutosuggestOption) => {
      if (opt.disabled) return;
      selectedCache.current.set(opt.value, opt);
      if (multiple) {
        commit(
          selectedValues.includes(opt.value)
            ? selectedValues.filter((v) => v !== opt.value)
            : [...selectedValues, opt.value],
        );
        setQuery("");
        inputChangeRef.current?.("");
        inputRef.current?.focus();
      } else {
        commit([opt.value]);
        setQuery(labelToText(opt));
        inputChangeRef.current?.(labelToText(opt));
        close();
        inputRef.current?.focus();
      }
    },
    [multiple, selectedValues, commit, labelToText, close],
  );
  const removeOne = useCallback(
    (v: string) => commit(selectedValues.filter((x) => x !== v)),
    [selectedValues, commit],
  );
  const clearAll = useCallback(() => {
    commit([]);
    setQuery("");
    inputChangeRef.current?.("");
    inputRef.current?.focus();
  }, [commit]);

  const doCreate = useCallback(() => {
    const raw = createText.trim();
    if (!raw) return;
    const result = onCreate?.(raw);
    const opt: AutosuggestOption =
      result && typeof result === "object"
        ? result
        : typeof result === "string"
          ? { value: result, label: result }
          : { value: raw, label: raw };
    setCreateText("");
    if (selectedValues.includes(opt.value)) return;
    selectedCache.current.set(opt.value, opt);
    if (multiple) {
      commit([...selectedValues, opt.value]);
      inputRef.current?.focus();
    } else {
      commit([opt.value]);
      setQuery(labelToText(opt));
      close();
      inputRef.current?.focus();
    }
  }, [createText, onCreate, selectedValues, multiple, commit, labelToText, close]);

  /* ---- keyboard ---- */
  const moveActive = useCallback(
    (dir: 1 | -1) => {
      const enabled = list.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
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
    [list, activeIndex],
  );

  const onInputKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!open) openMenu();
          else moveActive(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (!open) openMenu();
          else moveActive(-1);
          break;
        case "Home":
          if (open && e.currentTarget.selectionStart === 0) {
            e.preventDefault();
            setActiveIndex(list.findIndex((o) => !o.disabled));
          }
          break;
        case "End":
          if (open && e.currentTarget.selectionStart === e.currentTarget.value.length) {
            e.preventDefault();
            for (let i = list.length - 1; i >= 0; i--)
              if (!list[i]!.disabled) {
                setActiveIndex(i);
                break;
              }
          }
          break;
        case "Enter":
          if (open && activeIndex >= 0 && list[activeIndex]) {
            e.preventDefault();
            selectOption(list[activeIndex]!);
          }
          break;
        case "Escape":
          if (open) {
            e.preventDefault();
            close();
            if (!multiple && singleOption) setQuery(labelToText(singleOption));
          }
          break;
        case "Backspace":
          if (multiple && e.currentTarget.value === "" && selectedValues.length) {
            e.preventDefault();
            removeOne(selectedValues[selectedValues.length - 1]!);
          }
          break;
        case "Tab":
          if (open) close();
          break;
        default:
      }
    },
    [
      disabled,
      readOnly,
      open,
      openMenu,
      moveActive,
      list,
      activeIndex,
      selectOption,
      close,
      multiple,
      singleOption,
      labelToText,
      selectedValues,
      removeOne,
    ],
  );

  const activeDescendant =
    open && activeIndex >= 0 && list[activeIndex] ? `${listboxId}-opt-${activeIndex}` : undefined;
  const showClear = clearable && (hasValue || query.length > 0) && !disabled && !readOnly;

  const menuBody: ReactNode = loading ? (
    <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted">
      <Spinner size="sm" label="" />
      {loadingMessage}
    </div>
  ) : belowMin ? (
    minCharsMessage != null ? (
      <div className="px-3 py-6 text-center text-sm text-muted">{minCharsMessage}</div>
    ) : null
  ) : list.length === 0 ? (
    <div className="px-3 py-6 text-center text-sm text-muted">{emptyMessage}</div>
  ) : (
    <ul
      id={listboxId}
      role="listbox"
      aria-multiselectable={multiple || undefined}
      aria-labelledby={label != null ? labelId : undefined}
      className="max-h-[320px] overflow-y-auto py-1"
    >
      {list.map((o, i) => {
        const isSelected = selectedValues.includes(o.value);
        const active = i === activeIndex;
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
            onMouseDown={(e) => e.preventDefault()}
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
          </li>
        );
      })}
    </ul>
  );

  const renderChip = (o: AutosuggestOption) => (
    <span
      key={o.value}
      className={cn(
        "inline-flex max-w-full shrink-0 items-center rounded-gk-sm bg-mint font-medium text-leaf-dark",
        sz.chip,
      )}
    >
      {o.icon ? <span className="flex shrink-0 [&_svg]:size-3.5">{o.icon}</span> : null}
      <span className="min-w-0 truncate">{o.label}</span>
      {removable && !readOnly && !disabled ? (
        <button
          type="button"
          aria-label={`Remove ${asText(o.label) || o.value}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            removeOne(o.value);
          }}
          className="-mr-0.5 flex shrink-0 cursor-pointer items-center rounded-full text-leaf-dark/70 hover:bg-art hover:text-leaf-dark"
        >
          <CrossIcon className="size-3" />
        </button>
      ) : null}
    </span>
  );

  const hasFieldChips = multiple && !open && selectedOptions.length > 0;
  const fieldChips = hasFieldChips ? (
    <div className="flex min-w-0 shrink items-center gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {selectedOptions.map(renderChip)}
    </div>
  ) : null;

  const chipsRow =
    multiple && selectedOptions.length ? (
      <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto border-t border-line p-2">
        {selectedOptions.map(renderChip)}
      </div>
    ) : null;

  const createRow =
    creatable && !disabled && !readOnly ? (
      <div className="flex items-center gap-2 border-t border-line p-2">
        <input
          value={createText}
          onChange={(e) => setCreateText(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              doCreate();
            } else if (e.key === "Escape") {
              e.preventDefault();
              close();
              inputRef.current?.focus();
            }
          }}
          placeholder={createPlaceholder}
          aria-label={createInputLabel}
          className="h-8 min-w-0 flex-1 rounded-gk-sm border border-line bg-canvas px-2.5 text-sm text-ink placeholder:text-muted focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/30"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={doCreate}
          disabled={!createText.trim()}
          className="inline-flex h-8 shrink-0 cursor-pointer items-center rounded-gk-sm bg-leaf px-3 text-sm font-semibold text-white transition-colors hover:bg-leaf-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createLabel}
        </button>
      </div>
    ) : null;

  const menuVisible = open && (menuBody != null || createRow != null || chipsRow != null);

  return (
    <div ref={rootRef} className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label != null ? (
        <label
          id={labelId}
          htmlFor={id}
          className={cn("text-sm font-medium text-ink", disabled && "opacity-60")}
        >
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}

      <div className="relative">
        <div
          ref={fieldRef}
          aria-invalid={isInvalid || undefined}
          onClick={() => inputRef.current?.focus()}
          className={cn(autosuggestFieldVariants({ variant, size }), className)}
        >
          {fieldChips}
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="text"
            role="combobox"
            autoComplete="off"
            autoFocus={autoFocus}
            spellCheck={false}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={menuVisible && !belowMin && !loading ? listboxId : undefined}
            aria-activedescendant={activeDescendant}
            aria-labelledby={label != null ? labelId : undefined}
            aria-describedby={describedBy}
            aria-invalid={isInvalid || undefined}
            aria-required={required || undefined}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={hasFieldChips ? undefined : placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              inputChangeRef.current?.(e.target.value);
              if (!open) openMenu();
            }}
            onFocus={(e) => {
              if (!multiple && singleOption) e.currentTarget.select();
              if (
                !readOnly &&
                !disabled &&
                (minChars === 0 || query.trim().length >= minChars || multiple || creatable)
              )
                openMenu();
            }}
            onKeyDown={onInputKeyDown}
            className={cn(
              "min-w-0 flex-1 bg-transparent py-2 text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed",
              hasFieldChips && "min-w-[2rem]",
            )}
          />

          <div className="flex shrink-0 items-center gap-0.5 self-center pl-1">
            {showClear ? (
              <button
                type="button"
                aria-label="Clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearAll}
                className="flex cursor-pointer items-center rounded-full p-0.5 text-muted hover:bg-mint hover:text-ink"
              >
                <CrossIcon className="size-3.5" />
              </button>
            ) : null}
            {loading ? (
              <Spinner size="sm" label="" className="text-muted" />
            ) : (
              <ChevronIcon
                className={cn("size-4 text-muted transition-transform", open && "rotate-180")}
              />
            )}
          </div>
        </div>

        {menuVisible ? (
          <div
            ref={menuRef}
            className={cn(
              "absolute inset-x-0 z-50 overflow-hidden rounded-gk-md border border-line bg-surface shadow-modal",
              placement === "top" ? "bottom-full mb-1" : "top-full mt-1",
              menuClassName,
            )}
          >
            {menuBody}
            {createRow}
            {chipsRow}
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
