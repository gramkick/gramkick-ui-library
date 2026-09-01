import { forwardRef, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";

/* ------------------------------------------------------------------ icons -- */

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M8 4v5M8 11.5h.01" strokeLinecap="round" />
    </svg>
  );
}

/* --------------------------------------------------------------- variants -- */

export type StepStatus = "pending" | "current" | "complete" | "error";
export type StepsVariant = "solid" | "outline";
export type StepsSize = "sm" | "md" | "lg";

/** Root layout — `orientation` × `size`, same cva pattern as the rest. */
export const stepsVariants = cva("flex w-full", {
  variants: {
    orientation: {
      horizontal: "flex-row items-start",
      vertical: "flex-col",
    },
    size: { sm: "", md: "", lg: "" },
  },
  defaultVariants: { orientation: "horizontal", size: "md" },
});

const CIRCLE: Record<StepsSize, string> = {
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-10 text-base",
};
const CONNECTOR_TOP: Record<StepsSize, string> = {
  sm: "top-3.5",
  md: "top-[1.125rem]",
  lg: "top-5",
};
const LABEL_SIZE: Record<StepsSize, string> = { sm: "text-xs", md: "text-sm", lg: "text-sm" };
const TRACK_H: Record<StepsSize, string> = { sm: "h-1", md: "h-1.5", lg: "h-2" };

type Strength = "weak" | "fair" | "strong";
const STRENGTH_FILL: Record<Strength, string> = {
  weak: "bg-danger",
  fair: "bg-sun",
  strong: "bg-leaf",
};
const STRENGTH_TEXT: Record<Strength, string> = {
  weak: "text-danger",
  fair: "text-[#8a6d1f]",
  strong: "text-leaf",
};
const STRENGTH_WORD: Record<Strength, string> = { weak: "Weak", fair: "Fair", strong: "Strong" };

function circleClass(status: StepStatus, variant: StepsVariant): string {
  const base =
    "relative z-10 flex shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-colors";
  if (status === "error") return cn(base, "border-danger bg-danger text-white");
  if (status === "complete")
    return cn(
      base,
      variant === "solid" ? "border-leaf bg-leaf text-white" : "border-leaf bg-canvas text-leaf",
    );
  if (status === "current") return cn(base, "border-leaf bg-canvas text-leaf ring-4 ring-leaf/15");
  return cn(base, "border-line bg-canvas text-muted");
}
const doneLine = (done: boolean) => (done ? "bg-leaf" : "bg-line");

/* ------------------------------------------------------------------ props -- */

export interface StepItem {
  label: ReactNode;
  description?: ReactNode;
  /** Overrides the number / check. */
  icon?: ReactNode;
  /** Force a status; otherwise derived from `current`. */
  status?: StepStatus;
  disabled?: boolean;
}

export interface StepsProps
  extends
    Omit<HTMLAttributes<HTMLElement>, "onChange">,
    Pick<VariantProps<typeof stepsVariants>, "orientation"> {
  steps?: StepItem[];

  /**
   * Alternate mode: instead of a step list, render a segmented **strength track**
   * filled to this percentage (0–100). `steps` is ignored when set.
   */
  percent?: number;
  /** Track mode — number of segments. Default `4`. */
  segments?: number;
  /** Track mode — append the rounded `%` after `label`. Default `false`. */
  showValue?: boolean;
  /** Track mode — text under the bar (e.g. "Strong"). Falls back to the auto strength word / `%`. */
  label?: ReactNode;
  /** Track mode — the two boundaries (%) between weak / fair / strong. Default `[34, 67]`. */
  thresholds?: [number, number];

  /** Zero-based index of the active step. */
  current?: number;
  defaultCurrent?: number;
  onCurrentChange?: (index: number) => void;
  /** Fires when a step is activated (also moves `current` unless controlled). */
  onStepClick?: (index: number, step: StepItem) => void;
  /** Let completed / current steps be clicked. Default `false`. */
  clickable?: boolean;
  variant?: StepsVariant;
  size?: StepsSize;
  /** Accessible name for the list. Default `"Progress"`. */
  "aria-label"?: string;
}

/**
 * A progress stepper. Pass `steps` (each `label` / `description` / `icon` /
 * `status` / `disabled`) and the zero-based `current` index — earlier steps show
 * a check, later ones are dimmed. `variant` (`solid` | `outline`) × `size`
 * (`sm` | `md` | `lg`) × `orientation` (`horizontal` | `vertical`). With
 * `clickable`, completed steps become buttons (`onStepClick`).
 *
 * Or pass `percent` for the alternate **strength track** — a segmented bar
 * filled to a percentage (password meters, profile completion, …).
 */
export const Steps = forwardRef<HTMLElement, StepsProps>(function Steps(
  {
    steps,
    percent,
    segments = 4,
    showValue = false,
    label,
    thresholds = [34, 67],
    current: currentProp,
    defaultCurrent,
    onCurrentChange,
    onStepClick,
    clickable = false,
    orientation = "horizontal",
    variant = "solid",
    size = "md",
    className,
    "aria-label": ariaLabel = "Progress",
    ...rest
  },
  ref,
) {
  const [current, setCurrent] = useControllableState<number>({
    value: currentProp,
    defaultValue: defaultCurrent ?? 0,
    onChange: onCurrentChange,
  });

  /* ---- alternate mode: strength track ---- */
  if (percent != null) {
    const pct = Math.max(0, Math.min(100, percent));
    const rounded = Math.round(pct);
    const [t1, t2] = thresholds;
    const strength: Strength = pct <= 0 ? "weak" : pct < t1 ? "weak" : pct < t2 ? "fair" : "strong";
    const segCount = Math.max(1, segments);
    const filled = pct <= 0 ? 0 : Math.max(1, Math.round((pct / 100) * segCount));
    const caption = label ?? (showValue ? `${rounded}%` : pct > 0 ? STRENGTH_WORD[strength] : null);

    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        data-slot="steps"
        data-strength={strength}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={rounded}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("flex w-full flex-col gap-1.5", className)}
        {...rest}
      >
        <div data-slot="strength-track" className={cn("flex w-full gap-1.5", TRACK_H[size])}>
          {Array.from({ length: segCount }, (_, i) => (
            <span
              key={i}
              data-slot="strength-segment"
              data-filled={i < filled || undefined}
              className={cn(
                "flex-1 rounded-full transition-colors",
                i < filled ? STRENGTH_FILL[strength] : "bg-line",
              )}
            />
          ))}
        </div>
        {caption != null ? (
          <div className={cn("text-xs font-medium", STRENGTH_TEXT[strength])}>
            {caption}
            {showValue && label != null ? ` · ${rounded}%` : null}
          </div>
        ) : null}
      </div>
    );
  }

  const list = steps ?? [];
  const statusOf = (i: number, step: StepItem): StepStatus =>
    step.status ?? (i < current ? "complete" : i === current ? "current" : "pending");

  const last = list.length - 1;
  const vertical = orientation === "vertical";

  const indicator = (i: number, step: StepItem, status: StepStatus) =>
    step.icon != null ? (
      step.icon
    ) : status === "complete" ? (
      <CheckIcon />
    ) : status === "error" ? (
      <AlertIcon />
    ) : (
      <span>{i + 1}</span>
    );

  return (
    <ol
      ref={ref as Ref<HTMLOListElement>}
      data-slot="steps"
      aria-label={ariaLabel}
      className={cn(stepsVariants({ orientation, size }), className)}
      {...rest}
    >
      {list.map((step, i) => {
        const status = statusOf(i, step);
        const interactive =
          clickable && !step.disabled && (status === "complete" || status === "current");
        const activate = () => {
          if (!interactive) return;
          onStepClick?.(i, step);
          setCurrent(i);
        };
        const labelText = typeof step.label === "string" ? step.label : undefined;

        const circle = (
          <span
            aria-hidden="true"
            data-slot="step-indicator"
            className={cn(circleClass(status, variant), CIRCLE[size], "[&_svg]:size-[55%]")}
          >
            {indicator(i, step, status)}
          </span>
        );

        const text = (
          <div className={cn(vertical ? "text-left" : "mt-2 text-center")}>
            <div
              className={cn(
                "font-medium text-ink",
                LABEL_SIZE[size],
                status === "pending" && "text-muted",
              )}
            >
              {step.label}
            </div>
            {step.description != null ? (
              <div className="mt-0.5 text-xs text-muted">{step.description}</div>
            ) : null}
          </div>
        );

        if (vertical) {
          return (
            <li
              key={i}
              data-slot="step"
              data-status={status}
              aria-current={status === "current" ? "step" : undefined}
              className="flex gap-3"
            >
              <div className="flex flex-col items-center self-stretch">
                {interactive ? (
                  <button
                    type="button"
                    aria-label={labelText ?? `Step ${i + 1}`}
                    onClick={activate}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40"
                  >
                    {circle}
                  </button>
                ) : (
                  circle
                )}
                {i < last ? (
                  <span
                    className={cn("mt-1 w-0.5 grow rounded-full", doneLine(status === "complete"))}
                    style={{ minHeight: "1.5rem" }}
                  />
                ) : null}
              </div>
              <div className={cn("pb-6", i === last && "pb-0")}>{text}</div>
            </li>
          );
        }

        return (
          <li
            key={i}
            data-slot="step"
            data-status={status}
            aria-current={status === "current" ? "step" : undefined}
            className="relative flex flex-1 flex-col items-center"
          >
            {i > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute right-1/2 h-0.5 w-full",
                  CONNECTOR_TOP[size],
                  doneLine(statusOf(i - 1, list[i - 1]!) === "complete"),
                )}
              />
            ) : null}
            {interactive ? (
              <button
                type="button"
                aria-label={labelText ?? `Step ${i + 1}`}
                onClick={activate}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-gk-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40"
              >
                {circle}
                {text}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {circle}
                {text}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
});
