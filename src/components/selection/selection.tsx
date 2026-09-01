import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";

/* ------------------------------------------------------------------ icons -- */

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M4 8h8" strokeLinecap="round" />
    </svg>
  );
}

/* --------------------------------------------------------------- variants -- */

/** Colour intent of the checked box / dot — mirrors `Button`'s variant axis. */
export const selectionControlVariants = cva("border-line", {
  variants: {
    variant: {
      primary:
        "peer-checked:border-leaf peer-checked:bg-leaf peer-indeterminate:border-leaf peer-indeterminate:bg-leaf",
      secondary:
        "peer-checked:border-ink peer-checked:bg-ink peer-indeterminate:border-ink peer-indeterminate:bg-ink",
      outline: "peer-checked:border-leaf peer-indeterminate:border-leaf",
      danger:
        "peer-checked:border-danger peer-checked:bg-danger peer-indeterminate:border-danger peer-indeterminate:bg-danger",
    },
  },
  defaultVariants: { variant: "primary" },
});

export type SelectionVariant = NonNullable<
  VariantProps<typeof selectionControlVariants>["variant"]
>;
export type SelectionSize = "sm" | "md" | "lg";

const BOX: Record<SelectionSize, string> = { sm: "size-4", md: "size-5", lg: "size-6" };
const MARK: Record<SelectionSize, string> = {
  sm: "[&_svg]:size-3",
  md: "[&_svg]:size-3.5",
  lg: "[&_svg]:size-4",
};
const DOT: Record<SelectionSize, string> = { sm: "size-1.5", md: "size-2", lg: "size-2.5" };
const TEXT: Record<SelectionSize, string> = { sm: "text-sm", md: "text-sm", lg: "text-base" };
const GAP: Record<SelectionSize, string> = { sm: "gap-2", md: "gap-2.5", lg: "gap-3" };
const MARK_COLOR: Record<SelectionVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-leaf",
  danger: "text-white",
};

/* ----------------------------------------------------------- base control -- */

interface SelectionControlProps {
  type: "checkbox" | "radio";
  variant: SelectionVariant;
  size: SelectionSize;
  label?: ReactNode;
  description?: ReactNode;
  indeterminate?: boolean;
  containerClassName?: string;
  /** Classes for the `<input>`. */
  className?: string;
  inputRef: Ref<HTMLInputElement>;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
}

function SelectionControl({
  type,
  variant,
  size,
  label,
  description,
  indeterminate,
  containerClassName,
  className,
  inputRef,
  inputProps,
}: SelectionControlProps) {
  const autoId = useId();
  const id = inputProps.id ?? autoId;
  const labelId = label != null ? `${id}-label` : undefined;
  const descId = description != null ? `${id}-desc` : undefined;
  const describedBy =
    [inputProps["aria-describedby"], descId].filter(Boolean).join(" ") || undefined;

  const localRef = useRef<HTMLInputElement | null>(null);
  const setRef = (node: HTMLInputElement | null) => {
    localRef.current = node;
    if (typeof inputRef === "function") inputRef(node);
    else if (inputRef) (inputRef as { current: HTMLInputElement | null }).current = node;
  };

  useEffect(() => {
    if (localRef.current) localRef.current.indeterminate = type === "checkbox" && !!indeterminate;
  }, [indeterminate, type]);

  const isRadio = type === "radio";

  return (
    <label
      data-slot="selection-field"
      className={cn(
        "inline-flex items-start",
        GAP[size],
        inputProps.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        containerClassName,
      )}
    >
      <span
        data-slot="selection-control"
        className={cn("relative inline-flex shrink-0", BOX[size])}
      >
        <input
          {...inputProps}
          id={id}
          ref={setRef}
          type={type}
          aria-labelledby={inputProps["aria-labelledby"] ?? labelId}
          aria-describedby={describedBy}
          className={cn(
            "peer absolute inset-0 z-10 m-0 cursor-[inherit] appearance-none opacity-0 focus:outline-none",
            className,
          )}
        />
        <span
          aria-hidden="true"
          data-slot="selection-box"
          className={cn(
            "pointer-events-none absolute inset-0 border-2 border-line bg-canvas transition-colors",
            isRadio ? "rounded-full" : "rounded-gk-sm",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-leaf/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas",
            "peer-disabled:bg-mint/50",
            selectionControlVariants({ variant }),
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity",
            "peer-checked:opacity-100 peer-indeterminate:opacity-0",
            MARK[size],
            MARK_COLOR[variant],
          )}
        >
          {isRadio ? <span className={cn("rounded-full bg-current", DOT[size])} /> : <CheckIcon />}
        </span>
        {!isRadio ? (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity",
              "peer-indeterminate:opacity-100",
              MARK[size],
              MARK_COLOR[variant],
            )}
          >
            <MinusIcon />
          </span>
        ) : null}
      </span>

      {label != null || description != null ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          {label != null ? (
            <span id={labelId} className={cn("font-medium leading-tight text-ink", TEXT[size])}>
              {label}
            </span>
          ) : null}
          {description != null ? (
            <span id={descId} className="text-xs text-muted">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}

/* -------------------------------------------------------------- checkbox -- */

interface GroupCtx<T> {
  value: T;
  variant?: SelectionVariant;
  size?: SelectionSize;
  disabled?: boolean;
}
interface CheckboxGroupCtx extends GroupCtx<string[]> {
  toggle: (value: string) => void;
}
interface RadioGroupCtx extends GroupCtx<string | undefined> {
  name: string;
  select: (value: string) => void;
}

const CheckboxGroupContext = createContext<CheckboxGroupCtx | null>(null);
const RadioGroupContext = createContext<RadioGroupCtx | null>(null);

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> {
  variant?: SelectionVariant;
  size?: SelectionSize;
  label?: ReactNode;
  description?: ReactNode;
  /** Dash state — sets the DOM `indeterminate` property. */
  indeterminate?: boolean;
  /** Classes for the outer `<label>`. */
  containerClassName?: string;
}

/**
 * A checkbox with the `Button` API shape — `variant` (`primary` | `secondary` |
 * `outline` | `danger`) × `size` (`sm` | `md` | `lg`) — plus `label` /
 * `description` and `indeterminate`. Inside a `CheckboxGroup` the `value`,
 * checked state, `variant`, `size` and `disabled` are wired for you.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { variant, size, label, description, indeterminate, className, containerClassName, ...rest },
  ref,
) {
  const group = useContext(CheckboxGroupContext);
  const groupValue = rest.value != null ? String(rest.value) : undefined;
  const inGroup = group != null && groupValue != null;

  const resolvedVariant = variant ?? group?.variant ?? "primary";
  const resolvedSize = size ?? group?.size ?? "md";
  const disabled = rest.disabled || group?.disabled || false;

  const inputProps: InputHTMLAttributes<HTMLInputElement> = inGroup
    ? {
        ...rest,
        disabled,
        checked: group!.value.includes(groupValue!),
        onChange: (e) => {
          rest.onChange?.(e);
          group!.toggle(groupValue!);
        },
      }
    : { ...rest, disabled };

  return (
    <SelectionControl
      type="checkbox"
      variant={resolvedVariant}
      size={resolvedSize}
      label={label}
      description={description}
      indeterminate={indeterminate}
      containerClassName={containerClassName}
      className={className}
      inputRef={ref}
      inputProps={inputProps}
    />
  );
});

/* ----------------------------------------------------------------- radio -- */

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  variant?: SelectionVariant;
  size?: SelectionSize;
  label?: ReactNode;
  description?: ReactNode;
  containerClassName?: string;
}

/**
 * A radio button — same `variant` × `size` API as `Checkbox`. Give it a `value`
 * and drop it inside a `RadioGroup`, which wires the shared `name`, the checked
 * state and `onChange`.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { variant, size, label, description, className, containerClassName, ...rest },
  ref,
) {
  const group = useContext(RadioGroupContext);
  const groupValue = rest.value != null ? String(rest.value) : undefined;
  const inGroup = group != null && groupValue != null;

  const resolvedVariant = variant ?? group?.variant ?? "primary";
  const resolvedSize = size ?? group?.size ?? "md";
  const disabled = rest.disabled || group?.disabled || false;

  const inputProps: InputHTMLAttributes<HTMLInputElement> = inGroup
    ? {
        ...rest,
        name: rest.name ?? group!.name,
        disabled,
        checked: group!.value === groupValue,
        onChange: (e) => {
          rest.onChange?.(e);
          group!.select(groupValue!);
        },
      }
    : { ...rest, disabled };

  return (
    <SelectionControl
      type="radio"
      variant={resolvedVariant}
      size={resolvedSize}
      label={label}
      description={description}
      containerClassName={containerClassName}
      className={className}
      inputRef={ref}
      inputProps={inputProps}
    />
  );
});

/* ---------------------------------------------------------------- groups -- */

export interface SelectionItem {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}
export type RadioItem = SelectionItem;
export type CheckboxGroupItem = SelectionItem;

interface GroupBaseProps {
  variant?: SelectionVariant;
  size?: SelectionSize;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  /** Accessible name for the group. */
  label?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const groupLayout = (orientation: "vertical" | "horizontal", className?: string) =>
  cn(
    "flex",
    orientation === "horizontal" ? "flex-row flex-wrap gap-x-5 gap-y-2.5" : "flex-col gap-2.5",
    className,
  );

export interface RadioGroupProps extends GroupBaseProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  /** Quick API — renders a `Radio` per item. */
  options?: RadioItem[];
}

export function RadioGroup({
  value: valueProp,
  defaultValue,
  onChange,
  name: nameProp,
  variant,
  size,
  disabled,
  orientation = "vertical",
  label,
  options,
  className,
  children,
}: RadioGroupProps) {
  const autoName = useId();
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
  });
  const select = useCallback(
    (v: string) => {
      setValue(v);
      onChange?.(v);
    },
    [setValue, onChange],
  );
  const ctx = useMemo<RadioGroupCtx>(
    () => ({ name: nameProp ?? autoName, value, select, variant, size, disabled }),
    [nameProp, autoName, value, select, variant, size, disabled],
  );

  return (
    <RadioGroupContext.Provider value={ctx}>
      <div
        role="radiogroup"
        aria-label={typeof label === "string" ? label : undefined}
        className={groupLayout(orientation, className)}
      >
        {options
          ? options.map((o) => (
              <Radio
                key={o.value}
                value={o.value}
                label={o.label}
                description={o.description}
                disabled={o.disabled}
              />
            ))
          : children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface CheckboxGroupProps extends GroupBaseProps {
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** Quick API — renders a `Checkbox` per item. */
  options?: CheckboxGroupItem[];
}

export function CheckboxGroup({
  value: valueProp,
  defaultValue,
  onChange,
  variant,
  size,
  disabled,
  orientation = "vertical",
  label,
  options,
  className,
  children,
}: CheckboxGroupProps) {
  const [value, setValue] = useControllableState<string[]>({
    value: valueProp,
    defaultValue: defaultValue ?? [],
  });
  const toggle = useCallback(
    (v: string) => {
      const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
      setValue(next);
      onChange?.(next);
    },
    [value, setValue, onChange],
  );
  const ctx = useMemo<CheckboxGroupCtx>(
    () => ({ value, toggle, variant, size, disabled }),
    [value, toggle, variant, size, disabled],
  );

  return (
    <CheckboxGroupContext.Provider value={ctx}>
      <div
        role="group"
        aria-label={typeof label === "string" ? label : undefined}
        className={groupLayout(orientation, className)}
      >
        {options
          ? options.map((o) => (
              <Checkbox
                key={o.value}
                value={o.value}
                label={o.label}
                description={o.description}
                disabled={o.disabled}
              />
            ))
          : children}
      </div>
    </CheckboxGroupContext.Provider>
  );
}
