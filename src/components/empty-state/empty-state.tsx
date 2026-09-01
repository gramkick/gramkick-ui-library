import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

/* ------------------------------------------------------------------ icons -- */

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" strokeLinejoin="round" />
      <path d="M3 8.5V16l9 4.5 9-4.5V8.5M12 13v7.5" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 3 1.7 21h20.6L12 3Z" strokeLinejoin="round" />
      <path d="M12 9.5v5M12 17.5h.01" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" strokeLinecap="round" />
    </svg>
  );
}

/* --------------------------------------------------------------- variants -- */

export type EmptyStateVariant = "empty" | "error" | "search";
export type EmptyStateSize = "sm" | "md" | "lg";

/** Centered icon → title → description → actions column. */
export const emptyStateVariants = cva("flex w-full flex-col items-center text-center", {
  variants: {
    size: {
      sm: "gap-2 px-4 py-8",
      md: "gap-3 px-6 py-12",
      lg: "gap-4 px-8 py-16",
    },
    bordered: {
      true: "rounded-gk-lg border border-dashed border-line bg-surface",
      false: "",
    },
  },
  defaultVariants: { size: "md", bordered: false },
});

const iconWrapVariants = cva("flex shrink-0 items-center justify-center rounded-full", {
  variants: {
    variant: {
      empty: "bg-mint text-leaf",
      error: "bg-danger/10 text-danger",
      search: "bg-soft-blue text-brand-blue",
    },
    size: {
      sm: "mb-1 size-10 [&_svg]:size-5",
      md: "mb-1 size-14 [&_svg]:size-7",
      lg: "mb-2 size-16 [&_svg]:size-8",
    },
  },
  defaultVariants: { variant: "empty", size: "md" },
});

const TITLE_SIZE: Record<EmptyStateSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};
const DEFAULT_ICON: Record<EmptyStateVariant, ReactNode> = {
  empty: <BoxIcon />,
  error: <AlertIcon />,
  search: <SearchIcon />,
};

export interface EmptyStateProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, "title">,
    Pick<VariantProps<typeof emptyStateVariants>, "bordered"> {
  /** Tone + default icon — `empty` (default), `error`, or `search` (no results). */
  variant?: EmptyStateVariant;
  size?: EmptyStateSize;
  /** Override the default per-variant icon; pass `null` to hide it. */
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Buttons / links row under the text. */
  actions?: ReactNode;
}

/**
 * Placeholder for a region that has no data or failed to load — a table body, a
 * card, a whole page. `variant` (`empty` | `error` | `search`) × `size`
 * (`sm` | `md` | `lg`) follow the shared pattern; `icon` / `title` /
 * `description` / `actions` are all optional nodes, stacked and centered.
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  {
    className,
    variant = "empty",
    size = "md",
    bordered,
    icon,
    title,
    description,
    actions,
    children,
    ...rest
  },
  ref,
) {
  const iconNode = icon === undefined ? DEFAULT_ICON[variant] : icon;

  return (
    <div
      ref={ref}
      data-slot="empty-state"
      data-variant={variant}
      role={variant === "error" ? "alert" : undefined}
      className={cn(emptyStateVariants({ size, bordered }), className)}
      {...rest}
    >
      {iconNode != null ? (
        <div aria-hidden="true" className={iconWrapVariants({ variant, size })}>
          {iconNode}
        </div>
      ) : null}

      {title != null ? (
        <div className={cn("font-semibold text-ink", TITLE_SIZE[size])}>{title}</div>
      ) : null}

      {description != null ? <p className="max-w-md text-sm text-muted">{description}</p> : null}

      {actions != null ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{actions}</div>
      ) : null}

      {children}
    </div>
  );
});
