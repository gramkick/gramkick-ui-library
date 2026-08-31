import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { useMediaQuery } from "../../hooks/use-media-query";
import { Button, type ButtonProps } from "../button/button";

/* -------------------------------------------------------------------------------------------------
 * Primitives — thin styled wrappers over @radix-ui/react-dialog. Use these for full control.
 * -----------------------------------------------------------------------------------------------*/

export const DialogRoot = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export const dialogContentVariants = cva(
  [
    "fixed z-50 flex flex-col gap-4 overflow-y-auto border-line bg-surface px-6 pb-6 pt-3 shadow-modal focus:outline-none",
    // Mobile default: a bottom sheet pinned to the bottom edge, full width, tight top, rounded top only.
    "inset-x-0 bottom-0 mx-auto max-h-[85dvh] w-full rounded-t-gk-lg border-t pb-[max(1.5rem,env(safe-area-inset-bottom))]",
  ],
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[calc(100vw-2rem)] sm:h-[calc(100dvh-2rem)]",
      },
      placement: {
        // Bottom sheet on phones, centered modal from the `sm` breakpoint up.
        responsive:
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-gk-lg sm:border sm:pb-6 sm:pt-6",
        // Always a centered modal, at every width.
        center:
          "inset-x-auto bottom-auto left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-gk-lg border px-6 pb-6 pt-6",
      },
    },
    defaultVariants: { size: "md", placement: "responsive" },
  },
);

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn("fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]", className)}
      {...props}
    />
  );
});

export type DialogContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & {
    /** Extra classes for the backdrop. */
    overlayClassName?: string;
    /** Render the top-right close button. Default: `true`. */
    showClose?: boolean;
    /** Accessible label for the close button. */
    closeLabel?: string;
    /** Allow dragging the bottom sheet down to dismiss it (mobile only). Default: `true`. */
    dismissibleByDrag?: boolean;
  };

/**
 * Drag-down-to-dismiss for the mobile bottom sheet. Attached to the grab-handle
 * area; follows the pointer while dragging, then either snaps back or slides out
 * and calls `onDismiss` past a distance threshold.
 */
function useBottomSheetDrag(enabled: boolean, onDismiss: () => void) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ startY: 0, dy: 0, active: false });
  const [releasing, setReleasing] = useState(false);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || event.button > 0) return;
      drag.current = { startY: event.clientY, dy: 0, active: true };
      setReleasing(false);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* not supported (e.g. jsdom) */
      }
    },
    [enabled],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current.active) return;
    const dy = Math.max(0, event.clientY - drag.current.startY);
    drag.current.dy = dy;
    const el = contentRef.current;
    if (el) el.style.transform = dy > 0 ? `translateY(${dy}px)` : "";
  }, []);

  const onPointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!drag.current.active) return;
      drag.current.active = false;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* not supported (e.g. jsdom) */
      }
      const el = contentRef.current;
      const height = el?.getBoundingClientRect().height ?? 0;
      const threshold = Math.max(80, Math.min(140, height * 0.28));
      setReleasing(true);
      if (!el) return;
      if (drag.current.dy > threshold) {
        el.style.transform = `translateY(${Math.max(height, 320)}px)`;
        window.setTimeout(onDismiss, 200);
      } else {
        el.style.transform = "";
      }
    },
    [onDismiss],
  );

  const handlers = enabled
    ? { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd }
    : {};

  return { contentRef, handlers, releasing };
}

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent(
  {
    className,
    overlayClassName,
    children,
    size,
    placement = "responsive",
    showClose = true,
    closeLabel = "Close",
    dismissibleByDrag = true,
    ...props
  },
  ref,
) {
  const isDesktop = useMediaQuery("(min-width: 40rem)");
  const canDrag = dismissibleByDrag && placement !== "center" && !isDesktop;
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dismiss = useCallback(() => closeRef.current?.click(), []);
  const { contentRef, handlers, releasing } = useBottomSheetDrag(canDrag, dismiss);

  const setContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref, contentRef],
  );

  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        ref={setContentRef}
        className={cn(
          dialogContentVariants({ size, placement }),
          releasing && "transition-transform duration-200 ease-out",
          className,
        )}
        {...props}
      >
        {placement !== "center" ? (
          <div
            {...handlers}
            data-slot="dialog-handle"
            aria-hidden="true"
            className={cn(
              "-mt-1 mb-1 flex shrink-0 touch-none select-none justify-center py-2 sm:hidden",
              canDrag && "cursor-grab active:cursor-grabbing",
            )}
          >
            <span className="h-1 w-9 rounded-full bg-line" />
          </div>
        ) : null}

        {children}

        {placement !== "center" ? (
          <DialogPrimitive.Close
            ref={closeRef}
            aria-hidden="true"
            tabIndex={-1}
            className="hidden"
          />
        ) : null}

        {showClose ? (
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className="absolute right-4 top-4 cursor-pointer rounded-gk-sm p-1 text-muted transition-colors hover:bg-mint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40"
          >
            <XIcon />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 pr-6", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold text-ink", className)}
      {...props}
    />
  );
});

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted", className)}
      {...props}
    />
  );
});

/* -------------------------------------------------------------------------------------------------
 * Dialog — prop-driven convenience component. Every prop is optional.
 * -----------------------------------------------------------------------------------------------*/

export type DialogVariant = "default" | "danger" | "warning" | "success";

const accentBubbleClasses: Record<DialogVariant, string> = {
  default: "bg-mint text-leaf",
  danger: "bg-danger/10 text-danger",
  warning: "bg-soft-yellow text-ink",
  success: "bg-mint text-leaf",
};

const titleToneClasses: Record<DialogVariant, string> = {
  default: "text-ink",
  danger: "text-danger",
  warning: "text-ink",
  success: "text-ink",
};

export type DialogAction = ButtonProps & {
  /** Close the dialog after the button's own `onClick` runs. Default: `true`. */
  closeOnClick?: boolean;
};

export interface DialogProps extends VariantProps<typeof dialogContentVariants> {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Radix modal behaviour (focus trap + scroll lock). Default: `true`. */
  modal?: boolean;
  /** Element that opens the dialog (wrapped in `DialogTrigger asChild`). Omit for a controlled dialog. */
  trigger?: ReactNode;
  /** Accent tone for the header icon bubble and title. */
  variant?: DialogVariant;
  /** Icon shown in a coloured bubble at the start of the header. */
  icon?: ReactNode;
  /** Title — text or any node. */
  title?: ReactNode;
  /** Small line directly under the title — text or any node. */
  subtext?: ReactNode;
  /**
   * `"responsive"` (default) — bottom sheet on phones, centered modal from `sm` up.
   * `"center"` — always a centered modal.
   */
  placement?: "responsive" | "center";
  /** Let the mobile bottom sheet be dragged down to close. Default: `true`. */
  dismissibleByDrag?: boolean;
  /** Icon immediately before the title text. */
  titleStartIcon?: ReactNode;
  /** Body copy — text or any node. */
  description?: ReactNode;
  /** Extra body content rendered below the description. */
  children?: ReactNode;
  /** Show the top-right close button. Default: `true`. */
  showClose?: boolean;
  closeLabel?: string;
  /** Footer buttons — each takes the full `Button` prop set plus `closeOnClick`. */
  actions?: DialogAction[];
  /** Classes for the content panel. */
  className?: string;
  /** Classes for the backdrop. */
  overlayClassName?: string;
  /** Escape hatch for the underlying `DialogContent`. */
  contentProps?: Omit<
    DialogContentProps,
    | "size"
    | "placement"
    | "dismissibleByDrag"
    | "className"
    | "overlayClassName"
    | "showClose"
    | "closeLabel"
    | "children"
  >;
}

/**
 * A ready-made dialog: header (accent icon, leading title icon, title, subtext,
 * close), a body from `description` and/or `children`, and a footer built from an
 * `actions` list of `Button` configs.
 *
 * Responsive by default — a bottom sheet on phones, a centered modal from the
 * `sm` breakpoint up (`placement="center"` forces centered everywhere). For
 * bespoke layouts use the primitives instead: `DialogRoot`, `DialogContent`,
 * `DialogHeader`, `DialogTitle`, …
 */
export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  modal,
  trigger,
  size,
  placement,
  dismissibleByDrag,
  variant = "default",
  icon,
  title,
  subtext,
  titleStartIcon,
  description,
  children,
  showClose = true,
  closeLabel = "Close",
  actions,
  className,
  overlayClassName,
  contentProps,
}: DialogProps) {
  const hasTitle = title != null && title !== "";

  return (
    <DialogRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal={modal}>
      {trigger != null ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent
        size={size}
        placement={placement}
        dismissibleByDrag={dismissibleByDrag}
        showClose={showClose}
        closeLabel={closeLabel}
        className={className}
        overlayClassName={overlayClassName}
        {...contentProps}
      >
        <div className={cn("flex items-start gap-3", showClose && "pr-6")}>
          {icon != null ? (
            <span
              aria-hidden="true"
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-full [&_svg]:size-5",
                accentBubbleClasses[variant],
              )}
            >
              {icon}
            </span>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {titleStartIcon != null ? (
                <span aria-hidden="true" className="shrink-0 text-muted [&_svg]:size-4">
                  {titleStartIcon}
                </span>
              ) : null}
              <DialogPrimitive.Title
                className={
                  hasTitle
                    ? cn("min-w-0 text-lg font-semibold", titleToneClasses[variant])
                    : "sr-only"
                }
              >
                {hasTitle ? title : "Dialog"}
              </DialogPrimitive.Title>
            </div>
            {subtext != null ? <div className="mt-1 text-sm text-muted">{subtext}</div> : null}
          </div>
        </div>

        {description != null ? (
          <DialogPrimitive.Description asChild>
            <div className="text-sm leading-relaxed text-muted">{description}</div>
          </DialogPrimitive.Description>
        ) : null}

        {children}

        {actions && actions.length > 0 ? (
          <DialogFooter>
            {actions.map(({ closeOnClick = true, ...actionProps }, index) =>
              closeOnClick ? (
                <DialogClose key={index} asChild>
                  <Button {...actionProps} />
                </DialogClose>
              ) : (
                <Button key={index} {...actionProps} />
              ),
            )}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </DialogRoot>
  );
}
