import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

/* ------------------------------------------------------------------ icons -- */

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M6.5 10.5l2.5 2.5 4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6v5M10 13.6h.01" strokeLinecap="round" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9.2v4.8M10 6.4h.01" strokeLinecap="round" />
    </svg>
  );
}
function WarnIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M10 2.5 1.7 16.5h16.6L10 2.5Z" strokeLinejoin="round" />
      <path d="M10 8v3.5M10 14h.01" strokeLinecap="round" />
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

/* --------------------------------------------------------------- variants -- */

/** Panel tone — the same four as `Tooltip`. */
export const toastVariants = cva(
  "pointer-events-auto flex w-full gap-3 rounded-gk-md p-3.5 shadow-modal [overflow-wrap:anywhere]",
  {
    variants: {
      variant: {
        dark: "bg-ink text-white",
        light: "border border-line bg-canvas text-ink",
        accent: "bg-leaf text-white",
        danger: "bg-danger text-white",
      },
    },
    defaultVariants: { variant: "dark" },
  },
);

export type ToastVariant = NonNullable<VariantProps<typeof toastVariants>["variant"]>;
export type ToastPosition =
  "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

const DESC_COLOR: Record<ToastVariant, string> = {
  dark: "text-white/80",
  light: "text-muted",
  accent: "text-white/85",
  danger: "text-white/85",
};
const CLOSE_HOVER: Record<ToastVariant, string> = {
  dark: "hover:bg-white/15",
  light: "hover:bg-mint hover:text-ink",
  accent: "hover:bg-white/20",
  danger: "hover:bg-white/20",
};
const REGION_POS: Record<ToastPosition, string> = {
  "top-left": "top-0 left-0 items-start",
  "top-center": "top-0 left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-0 right-0 items-end",
  "bottom-left": "bottom-0 left-0 flex-col-reverse items-start",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 flex-col-reverse items-center",
  "bottom-right": "bottom-0 right-0 flex-col-reverse items-end",
};

/* ------------------------------------------------------------------ types -- */

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  /** Buttons / links (any nodes) shown under the text. */
  actions?: ReactNode;
  variant?: ToastVariant;
  /** Leading icon. The `success` / `error` / … helpers set a default. */
  icon?: ReactNode;
  /** Auto-dismiss after N ms. `0` / `Infinity` keeps it until dismissed. Defaults to the config. */
  duration?: number;
  /** Show the ✕ close button. Default `true`. */
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Reuse an id to replace / update an existing toast. */
  id?: string;
}

type ToastItem = ToastOptions & { id: string; open: boolean };

export interface ToastConfig {
  /** Corner the stack docks to. Default `bottom-right`. */
  position: ToastPosition;
  /** Auto-dismiss default in ms. Default `5000`. */
  duration: number;
  /** Max toasts kept on screen (oldest drop off). Default `4`. */
  max: number;
}

const DEFAULT_CONFIG: ToastConfig = { position: "bottom-right", duration: 5000, max: 4 };

/* ------------------------------------------------------------------ store -- */

interface Snapshot {
  items: ToastItem[];
  config: ToastConfig;
  regions: number;
}

let items: ToastItem[] = [];
let config: ToastConfig = { ...DEFAULT_CONFIG };
let regions = 0;
let snapshot: Snapshot = { items, config, regions };
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => snapshot;

function publish() {
  snapshot = { items, config, regions };
  listeners.forEach((l) => l());
}

let counter = 0;
const genId = () => globalThis.crypto?.randomUUID?.() ?? `toast-${Date.now()}-${++counter}`;

let autoRoot: { unmount: () => void } | null = null;
function ensureRegion() {
  if (typeof document === "undefined" || regions > 0 || autoRoot) return;
  const host = document.createElement("div");
  host.setAttribute("data-gk-toast-root", "");
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(<ToastRegion />);
  autoRoot = {
    unmount: () => {
      root.unmount();
      host.remove();
    },
  };
}

function addToast(opts: ToastOptions): string {
  ensureRegion();
  const id = opts.id ?? genId();
  const withoutId = items.filter((x) => x.id !== id);
  items = [...withoutId, { ...opts, id, open: true }].slice(-Math.max(1, config.max));
  publish();
  return id;
}
function setOpen(id: string, open: boolean) {
  items = items.map((x) => (x.id === id ? { ...x, open } : x));
  publish();
}
function removeToast(id: string) {
  items = items.filter((x) => x.id !== id);
  publish();
}
function updateToast(id: string, patch: Partial<ToastOptions>) {
  items = items.map((x) => (x.id === id ? { ...x, ...patch } : x));
  publish();
}
function dismissAll() {
  items = items.map((x) => ({ ...x, open: false }));
  publish();
}
function clearToasts() {
  items = [];
  publish();
}
function configure(patch: Partial<ToastConfig>) {
  config = { ...config, ...patch };
  publish();
}

/* -------------------------------------------------------------- messenger -- */

const withIcon =
  (variant: ToastVariant, icon: ReactNode) =>
  (title: ReactNode, opts?: Omit<ToastOptions, "title" | "variant">) =>
    addToast({ ...opts, title, variant, icon: opts?.icon ?? icon });

export interface ToastMessengerInput extends ToastOptions {
  /** When `false`, nothing is shown (handy for `ToastMessenger({ show: !!error, … })`). */
  show?: boolean;
}

export interface ToastMessengerFn {
  (input?: ToastMessengerInput): string | undefined;
  success: (title: ReactNode, opts?: Omit<ToastOptions, "title" | "variant">) => string;
  error: (title: ReactNode, opts?: Omit<ToastOptions, "title" | "variant">) => string;
  info: (title: ReactNode, opts?: Omit<ToastOptions, "title" | "variant">) => string;
  warning: (title: ReactNode, opts?: Omit<ToastOptions, "title" | "variant">) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  /** Remove every toast immediately, with no exit animation. */
  clear: () => void;
  /** Patch a live toast — handy for "Uploading…" → "Uploaded". */
  update: (id: string, patch: Partial<ToastOptions>) => void;
  /** Set the global position / duration / max. */
  configure: (patch: Partial<ToastConfig>) => void;
}

/**
 * Imperative toast — importable anywhere (no hook, no provider needed) and safe
 * inside `try` / `catch`. Mounts its own outlet on first use; a
 * `<ToastProvider>` (optional) takes over placement/config if you render one.
 *
 * @example
 * try {
 *   await api.save();
 *   ToastMessenger({ variant: "accent", title: "Saved" });
 * } catch (e) {
 *   ToastMessenger({ variant: "danger", title: "Save failed", description: e.message, duration: 0 });
 * }
 */
export const ToastMessenger: ToastMessengerFn = Object.assign(
  (input: ToastMessengerInput = {}): string | undefined => {
    if (input.show === false) return undefined;
    const { show: _show, ...opts } = input;
    return addToast(opts);
  },
  {
    success: withIcon("accent", <CheckIcon />),
    error: withIcon("danger", <AlertIcon />),
    info: withIcon("dark", <InfoIcon />),
    warning: withIcon("light", <WarnIcon className="text-[#b45309]" />),
    dismiss: (id: string) => setOpen(id, false),
    dismissAll,
    clear: clearToasts,
    update: updateToast,
    configure,
  },
);

/* -------------------------------------------------------------------- hook -- */

export interface ToastApi {
  toast: (opts: ToastOptions) => string;
  success: ToastMessengerFn["success"];
  error: ToastMessengerFn["error"];
  info: ToastMessengerFn["info"];
  warning: ToastMessengerFn["warning"];
  dismiss: (id: string) => void;
  dismissAll: () => void;
  update: (id: string, patch: Partial<ToastOptions>) => void;
}

/** React-friendly wrapper around `ToastMessenger` (same store; no provider required). */
export function useToast(): ToastApi {
  return useMemo<ToastApi>(
    () => ({
      toast: (opts) => addToast(opts),
      success: ToastMessenger.success,
      error: ToastMessenger.error,
      info: ToastMessenger.info,
      warning: ToastMessenger.warning,
      dismiss: ToastMessenger.dismiss,
      dismissAll: ToastMessenger.dismissAll,
      update: ToastMessenger.update,
    }),
    [],
  );
}

/* ---------------------------------------------------------------- provider -- */

export interface ToastProviderProps extends Partial<ToastConfig> {
  children?: ReactNode;
}

/**
 * Optional — renders the toast stack inside your React tree (so toast `actions`
 * get your app's context) and applies `position` / `duration` / `max`. Without
 * it, `ToastMessenger` mounts a standalone outlet on `document.body`.
 */
export function ToastProvider({ children, position, duration, max }: ToastProviderProps) {
  useEffect(() => {
    const patch: Partial<ToastConfig> = {};
    if (position != null) patch.position = position;
    if (duration != null) patch.duration = duration;
    if (max != null) patch.max = max;
    if (Object.keys(patch).length) configure(patch);
  }, [position, duration, max]);

  useEffect(() => {
    regions += 1;
    publish(); // the standalone outlet renders `null` while a provider region is up
    return () => {
      regions -= 1;
      publish();
    };
  }, []);

  return (
    <>
      {children}
      <ToastRegion portal />
    </>
  );
}

/* ------------------------------------------------------------------ region -- */

function ToastRegion({ portal = false }: { portal?: boolean }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!portal && snap.regions > 0) return null; // a provider region is handling it

  const node = (
    <div
      data-slot="toast-region"
      className={cn(
        "pointer-events-none fixed z-[100] flex w-full max-w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 p-4",
        REGION_POS[snap.config.position],
      )}
    >
      {snap.items.map((item) => (
        <ToastCard key={item.id} item={item} config={snap.config} />
      ))}
    </div>
  );

  if (!portal) return node;
  return typeof document !== "undefined" ? createPortal(node, document.body) : null;
}

/* ------------------------------------------------------------------- card -- */

function ToastCard({ item, config: cfg }: { item: ToastItem; config: ToastConfig }) {
  const variant: ToastVariant = item.variant ?? "dark";
  const duration = item.duration ?? cfg.duration;
  const dismissible = item.dismissible ?? true;
  const timed = item.open && Number.isFinite(duration) && duration > 0;

  const [entered, setEntered] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const arm = useCallback(() => {
    if (!timed) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(item.id, false), duration);
  }, [timed, duration, item.id]);

  useEffect(() => {
    arm();
    return () => clearTimeout(timer.current);
  }, [arm]);

  useEffect(() => {
    if (item.open) return;
    item.onDismiss?.();
    const t = setTimeout(() => removeToast(item.id), 190);
    return () => clearTimeout(t);
  }, [item.open]); // eslint-disable-line react-hooks/exhaustive-deps

  const enterFrom = cfg.position.endsWith("left")
    ? "-translate-x-4"
    : cfg.position.endsWith("right")
      ? "translate-x-4"
      : cfg.position.startsWith("top")
        ? "-translate-y-3"
        : "translate-y-3";
  const visible = entered && item.open;

  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      aria-live={variant === "danger" ? "assertive" : "polite"}
      data-slot="toast"
      data-variant={variant}
      onMouseEnter={() => clearTimeout(timer.current)}
      onMouseLeave={() => arm()}
      className={cn(
        toastVariants({ variant }),
        "transition-[opacity,transform] duration-200 ease-out will-change-transform",
        visible ? "translate-x-0 translate-y-0 opacity-100" : cn(enterFrom, "opacity-0"),
      )}
    >
      {item.icon != null ? (
        <span className="mt-0.5 flex shrink-0 [&_svg]:size-5">{item.icon}</span>
      ) : null}

      <div className="min-w-0 flex-1">
        {item.title != null ? (
          <div className="font-semibold leading-snug [overflow-wrap:anywhere]">{item.title}</div>
        ) : null}
        {item.description != null ? (
          <div
            className={cn(
              "mt-1 text-[0.8125rem] leading-snug [overflow-wrap:anywhere]",
              DESC_COLOR[variant],
            )}
          >
            {item.description}
          </div>
        ) : null}
        {item.actions != null ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">{item.actions}</div>
        ) : null}
      </div>

      {dismissible ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setOpen(item.id, false)}
          className={cn(
            "-mr-1 -mt-1 flex size-6 shrink-0 cursor-pointer items-center justify-center self-start rounded-full transition-colors",
            variant === "light" ? "text-muted" : "text-current/80",
            CLOSE_HOVER[variant],
          )}
        >
          <CrossIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
