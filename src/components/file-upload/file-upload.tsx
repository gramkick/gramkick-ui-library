import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";
import { FilePreviewDialog } from "./file-preview-dialog";

/* ------------------------------------------------------------------ icons -- */

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path
        d="M12 15V4m0 0L8 8m4-4 4 4M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M9 1.5H4.5A1.5 1.5 0 0 0 3 3v10a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 13V5.5L9 1.5Z"
        strokeLinejoin="round"
      />
      <path d="M9 1.5V5.5H13" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M1.7 10S4.7 4.5 10 4.5 18.3 10 18.3 10 15.3 15.5 10 15.5 1.7 10 1.7 10Z" />
      <circle cx="10" cy="10" r="2.6" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M3 5.5h14M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M6 5.5l.8 10a1.5 1.5 0 0 0 1.5 1.4h3.4a1.5 1.5 0 0 0 1.5-1.4l.8-10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

export const fileUploadZoneVariants = cva(
  [
    "flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-gk-md border-2 border-dashed text-center",
    "transition-[color,background-color,border-color]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "data-[drag-active=true]:border-leaf data-[drag-active=true]:bg-mint",
    "data-[has-file=true]:flex-row data-[has-file=true]:justify-start data-[has-file=true]:border-solid data-[has-file=true]:text-left",
    "aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger/5",
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
  ],
  {
    variants: {
      variant: {
        outline:
          "border-line bg-canvas hover:border-muted/60 hover:bg-mint/40 aria-disabled:hover:bg-canvas",
        filled: "border-transparent bg-mint hover:bg-art aria-disabled:hover:bg-mint",
      },
      size: {
        // `min-h-*` keeps the empty and filled states the same height (no shift on upload).
        sm: "min-h-[4.75rem] px-3 py-4 text-xs",
        md: "min-h-[6.5rem] px-4 py-6 text-sm",
        lg: "min-h-[7.75rem] px-6 py-8 text-base",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

/**
 * Compact "field" look for `variant="dropdown"` — mirrors `Dropdown`'s trigger.
 * Picked files render as a horizontally-scrolling row of chips inside it.
 */
export const fileUploadFieldVariants = cva(
  [
    "flex w-full items-center gap-2 rounded-gk-md border border-line bg-canvas text-ink shadow-xs",
    "cursor-pointer text-left transition-[color,background-color,border-color,box-shadow] hover:border-muted/50",
    "focus-visible:outline-none focus-visible:border-leaf focus-visible:ring-2 focus-visible:ring-leaf/30",
    "data-[drag-active=true]:border-leaf data-[drag-active=true]:ring-2 data-[drag-active=true]:ring-leaf/30",
    "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/25",
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:border-line",
  ],
  {
    variants: {
      size: {
        sm: "min-h-9 px-2.5 text-sm",
        md: "min-h-11 px-3 text-sm",
        lg: "min-h-12 px-3.5 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type FileUploadVariant = "outline" | "filled" | "dropdown";

type ZoneSize = NonNullable<VariantProps<typeof fileUploadZoneVariants>["size"]>;

/** Thumbnail box — matched to the empty-state icon+text height so the zone doesn't resize. */
const THUMB: Record<ZoneSize, string> = { sm: "size-10", md: "size-12", lg: "size-14" };
/** Empty-state upload glyph. */
const EMPTY_ICON: Record<ZoneSize, string> = { sm: "size-5", md: "size-6", lg: "size-7" };

/* ------------------------------------------------------------------ utils -- */

const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** "1.2 MB" — small helper, also exported for consumers rendering their own rows. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const i = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const n = bytes / 1024 ** i;
  const rounded = i === 0 ? Math.round(n) : Math.round(n * 10) / 10;
  return `${rounded} ${UNITS[i]}`;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const tokens = accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((tok) => {
    if (tok.startsWith(".")) return name.endsWith(tok);
    if (tok.endsWith("/*")) return type.startsWith(tok.slice(0, -1));
    return type === tok;
  });
}

const sameFile = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

export type FileRejectionReason = "type" | "size" | "count";
export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

/** Context handed to `renderActions` for one picked file. */
export interface FileActionContext {
  file: File;
  /** Object URL for the file — `""` when the environment can't create one. */
  url: string;
  index: number;
  /** Remove this file from the selection. */
  remove: () => void;
  /** Run the view behaviour (`onView`, else open `url` in a new tab). */
  view: () => void;
  disabled: boolean;
}

function rejectionMessage(
  rejections: FileRejection[],
  maxSize?: number,
  maxFiles?: number,
): string {
  const reasons = new Set(rejections.map((r) => r.reason));
  const parts: string[] = [];
  if (reasons.has("type")) parts.push("some files aren't an accepted type");
  if (reasons.has("size"))
    parts.push(`some files are larger than ${maxSize ? formatFileSize(maxSize) : "the limit"}`);
  if (reasons.has("count"))
    parts.push(`you can add at most ${maxFiles} file${maxFiles === 1 ? "" : "s"}`);
  const joined = parts.join("; ");
  return joined.charAt(0).toUpperCase() + joined.slice(1) + ".";
}

const CAN_OBJECT_URL = typeof URL !== "undefined" && typeof URL.createObjectURL === "function";

function safeCreateObjectUrl(file: File): string {
  try {
    return URL.createObjectURL(file);
  } catch {
    return "";
  }
}

function safeRevokeObjectUrl(url: string): void {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* environment without object-URL support */
  }
}

/* ------------------------------------------------------------------ props -- */

export interface FileUploadProps extends Omit<
  VariantProps<typeof fileUploadZoneVariants>,
  "variant"
> {
  /**
   * `outline` / `filled` — a dashed drop zone (single file shows in-zone, multi
   * lists below). `dropdown` — a compact `Dropdown`-style field where picked
   * files are a horizontally-scrolling row of removable chips.
   */
  variant?: FileUploadVariant;
  /** Field label. Rendered as a `<label>` wired to the hidden input. Text or node. */
  label?: ReactNode;
  /** Helper text under the field. Hidden while `error` (or a rejection message) is showing. */
  hint?: ReactNode;
  /** Error message under the field. Also forces the invalid styling. */
  error?: ReactNode;
  /** Force the error styling without an `error` message. */
  invalid?: boolean;
  /** Primary call-to-action inside the empty drop zone. */
  placeholder?: ReactNode;
  /** Secondary line inside the empty drop zone (e.g. "PNG or JPG, up to 5 MB"). */
  description?: ReactNode;
  /** Caption on the filled single-file zone + its accessible name. Click the zone to replace. */
  replaceLabel?: ReactNode;

  /** Controlled list of picked files. */
  value?: File[];
  defaultValue?: File[];
  onChange?: (files: File[]) => void;
  /** Called with the files that failed `accept` / `maxSize` / `maxFiles`. */
  onReject?: (rejections: FileRejection[]) => void;

  /** Allow selecting more than one file. Single-file mode renders the file inside the zone. */
  multiple?: boolean;
  /** Native `accept` string — also enforced on drag-and-drop. */
  accept?: string;
  /** Per-file size cap in bytes. */
  maxSize?: number;
  /** Cap on the number of kept files (`multiple`). */
  maxFiles?: number;
  /** Don't render the picked file(s) at all (zone stays a plain CTA). */
  hideFileList?: boolean;
  /** Show an image thumbnail for image files. Default `true`. */
  showPreview?: boolean;
  /** Show the per-file "view" action. Default `true`. */
  showView?: boolean;
  /** Show the per-file "delete" action. Default `true`. */
  showDelete?: boolean;
  /**
   * Custom view behaviour. Default: preview the file in the library `Dialog`
   * (`previewInDialog`), else open its object URL in a new tab.
   */
  onView?: (file: File, url: string) => void;
  /** Use the built-in `Dialog` preview for the default view action. Default `true`. */
  previewInDialog?: boolean;
  /** Replace the per-file action buttons (view + delete) with your own nodes. */
  renderActions?: (ctx: FileActionContext) => ReactNode;
  /** `dropdown` variant only — show a ✕ that clears every chip. Default `true`. */
  clearable?: boolean;

  name?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  containerClassName?: string;
}

/**
 * File picker + drop target. Shares `Input`'s field pattern — `label` / `hint` /
 * `error` / `invalid` / `required` (`aria-describedby` + `aria-invalid` wired) —
 * with `variant` × `size` (`sm` | `md` | `lg`).
 *
 * - `variant="outline" | "filled"` — a dashed drop zone. Single-file mode shows
 *   the picked file **inside the zone** (click to replace); multi-file lists them
 *   below. Each file gets **view** + **delete** buttons (`renderActions` to swap).
 * - `variant="dropdown"` — a compact `Dropdown`-style field; picked files are a
 *   horizontally-scrolling row of removable chips, `clearable` ✕ to empty it.
 * - Controllable via `value` / `defaultValue` / `onChange` (always a `File[]`).
 * - `accept` is enforced on drops too; `maxSize` / `maxFiles` reject offenders
 *   through `onReject` and a message under the field.
 */
export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(function FileUpload(
  {
    variant,
    size,
    label,
    hint,
    error,
    invalid,
    placeholder = "Drag & drop or click to upload",
    description,
    replaceLabel = "Replace file",
    value: valueProp,
    defaultValue,
    onChange,
    onReject,
    multiple = false,
    accept,
    maxSize,
    maxFiles,
    hideFileList = false,
    showPreview = true,
    showView = true,
    showDelete = true,
    onView,
    previewInDialog = true,
    renderActions,
    clearable = true,
    name,
    required = false,
    disabled = false,
    id: idProp,
    className,
    containerClassName,
  },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const listId = `${id}-list`;
  const resolvedSize: ZoneSize = size ?? "md";

  const inputRef = useRef<HTMLInputElement | null>(null);
  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const [files, setFiles] = useControllableState<File[]>({
    value: valueProp,
    defaultValue: defaultValue ?? [],
    onChange,
  });

  const [rejectionMsg, setRejectionMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const dragDepth = useRef(0);

  /* ---- object URLs (for thumbnails + the view action) ---- */
  const [urls, setUrls] = useState<Map<File, string>>(() => new Map());
  const urlsRef = useRef(urls);
  urlsRef.current = urls;

  useEffect(() => {
    if (!CAN_OBJECT_URL) return;
    setUrls((prev) => {
      const next = new Map<File, string>();
      for (const file of files) next.set(file, prev.get(file) ?? safeCreateObjectUrl(file));
      for (const [file, url] of prev) if (!next.has(file)) safeRevokeObjectUrl(url);
      return next;
    });
  }, [files]);

  useEffect(
    () => () => {
      for (const url of urlsRef.current.values()) safeRevokeObjectUrl(url);
    },
    [],
  );

  const urlFor = (file: File) => urls.get(file) ?? "";

  const messageText = error ?? rejectionMsg;
  const isInvalid = Boolean(invalid) || Boolean(error) || Boolean(rejectionMsg);
  const describedBy =
    [messageText ? errorId : null, !messageText && hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const ingest = useCallback(
    (incoming: File[]) => {
      if (disabled || !incoming.length) return;
      const rejected: FileRejection[] = [];
      const passed: File[] = [];
      for (const file of incoming) {
        if (!matchesAccept(file, accept)) rejected.push({ file, reason: "type" });
        else if (maxSize != null && file.size > maxSize) rejected.push({ file, reason: "size" });
        else passed.push(file);
      }

      let next: File[];
      if (!multiple) {
        next = passed.slice(-1);
      } else {
        const fresh = passed.filter((f) => !files.some((existing) => sameFile(existing, f)));
        next = [...files, ...fresh];
        if (maxFiles != null && next.length > maxFiles) {
          const overflow = next.slice(maxFiles);
          overflow.forEach((file) => rejected.push({ file, reason: "count" }));
          next = next.slice(0, maxFiles);
        }
      }

      setFiles(next);
      if (rejected.length) {
        onReject?.(rejected);
        setRejectionMsg(rejectionMessage(rejected, maxSize, maxFiles));
      } else {
        setRejectionMsg(null);
      }
    },
    [disabled, accept, maxSize, maxFiles, multiple, files, setFiles, onReject],
  );

  const openDialog = () => {
    if (!disabled) inputRef.current?.click();
  };

  const removeAt = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setRejectionMsg(null);
  };

  const onZoneClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if ((e.target as HTMLElement).closest("[data-file-action], button, a")) return;
    openDialog();
  };
  const onZoneKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDialog();
    }
  };

  const onDragEnter = (e: ReactDragEvent) => {
    e.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setDragActive(true);
  };
  const onDragOver = (e: ReactDragEvent) => {
    e.preventDefault();
    if (!disabled) e.dataTransfer.dropEffect = "copy";
  };
  const onDragLeave = (e: ReactDragEvent) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragActive(false);
  };
  const onDrop = (e: ReactDragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    if (disabled) return;
    ingest(Array.from(e.dataTransfer.files ?? []));
  };

  /* ---- per-file bits ---- */
  const thumb = (file: File, sizeKey: ZoneSize) => {
    const url = urlFor(file);
    if (showPreview && file.type.startsWith("image/") && url) {
      return (
        <img
          src={url}
          alt=""
          className={cn("shrink-0 rounded-gk-sm border border-line object-cover", THUMB[sizeKey])}
        />
      );
    }
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-gk-sm bg-mint text-muted",
          THUMB[sizeKey],
        )}
      >
        <FileIcon className="size-1/2" />
      </span>
    );
  };

  const viewFile = (file: File) => {
    const url = urlFor(file);
    if (onView) onView(file, url);
    else if (previewInDialog) setPreviewFile(file);
    else if (url && typeof window !== "undefined")
      window.open(url, "_blank", "noopener,noreferrer");
  };

  const canView = (url: string) => showView && (Boolean(onView) || previewInDialog || Boolean(url));

  const fileActions = (file: File, index: number) => {
    const url = urlFor(file);
    const remove = () => removeAt(index);
    const view = () => viewFile(file);
    if (renderActions) return renderActions({ file, url, index, remove, view, disabled });
    return (
      <>
        {canView(url) ? (
          <button
            type="button"
            aria-label={`View ${file.name}`}
            onClick={view}
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-gk-sm p-1 text-muted hover:bg-mint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40"
          >
            <EyeIcon className="size-4" />
          </button>
        ) : null}
        {!disabled && showDelete ? (
          <button
            type="button"
            aria-label={`Delete ${file.name}`}
            onClick={remove}
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-gk-sm p-1 text-muted hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40"
          >
            <TrashIcon className="size-4" />
          </button>
        ) : null}
      </>
    );
  };

  const chipThumb = (file: File) => {
    const url = urlFor(file);
    if (showPreview && file.type.startsWith("image/") && url) {
      return <img src={url} alt="" className="size-4 shrink-0 rounded-[3px] object-cover" />;
    }
    return <FileIcon className="size-3 shrink-0 text-leaf-dark/70" />;
  };

  const isFieldVariant = variant === "dropdown";
  const dropzoneVariant = isFieldVariant ? undefined : variant;
  const showFileInZone = !isFieldVariant && !multiple && !hideFileList && files.length > 0;
  const showList = !isFieldVariant && multiple && !hideFileList && files.length > 0;
  const showChips = isFieldVariant && !hideFileList;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label != null ? (
        <label
          htmlFor={id}
          className={cn("text-sm font-medium text-ink", disabled && "opacity-60")}
        >
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}

      <input
        ref={setRefs}
        id={id}
        type="file"
        className="sr-only"
        tabIndex={-1}
        name={name}
        accept={accept}
        multiple={multiple}
        required={required}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          ingest(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      {isFieldVariant ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-label={typeof placeholder === "string" ? placeholder : "Add files"}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          data-drag-active={dragActive ? "true" : undefined}
          onClick={onZoneClick}
          onKeyDown={onZoneKeyDown}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(fileUploadFieldVariants({ size }), className)}
        >
          {showChips ? (
            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {files.length === 0 ? (
                <span className="truncate text-muted">{placeholder}</span>
              ) : (
                files.map((file, index) => (
                  <span
                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                    className="inline-flex max-w-full shrink-0 items-center gap-1 rounded-gk-sm bg-mint px-2 py-0.5 text-xs font-medium text-leaf-dark"
                  >
                    {chipThumb(file)}
                    <span className="min-w-0 truncate">{file.name}</span>
                    {canView(urlFor(file)) ? (
                      <button
                        type="button"
                        data-file-action
                        aria-label={`View ${file.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          viewFile(file);
                        }}
                        className="flex shrink-0 cursor-pointer items-center rounded-full text-leaf-dark/70 hover:bg-art hover:text-leaf-dark"
                      >
                        <EyeIcon className="size-3.5" />
                      </button>
                    ) : null}
                    {!disabled && showDelete ? (
                      <button
                        type="button"
                        data-file-action
                        aria-label={`Remove ${file.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAt(index);
                        }}
                        className="-mr-0.5 flex shrink-0 cursor-pointer items-center rounded-full text-leaf-dark/70 hover:bg-art hover:text-leaf-dark"
                      >
                        <CrossIcon className="size-3" />
                      </button>
                    ) : null}
                  </span>
                ))
              )}
            </div>
          ) : (
            <span className="min-w-0 flex-1 truncate text-muted">{placeholder}</span>
          )}

          <div className="flex shrink-0 items-center gap-1 self-center pl-1">
            {clearable && files.length > 0 && !disabled ? (
              <button
                type="button"
                data-file-action
                aria-label="Clear all files"
                onClick={(e) => {
                  e.stopPropagation();
                  setFiles([]);
                  setRejectionMsg(null);
                }}
                className="flex cursor-pointer items-center rounded-full p-0.5 text-muted hover:bg-mint hover:text-ink"
              >
                <CrossIcon className="size-3.5" />
              </button>
            ) : null}
            <UploadIcon className="size-4 shrink-0 text-muted" />
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-label={showFileInZone && typeof replaceLabel === "string" ? replaceLabel : undefined}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          aria-controls={showList ? listId : undefined}
          data-drag-active={dragActive ? "true" : undefined}
          data-has-file={showFileInZone ? "true" : undefined}
          onClick={onZoneClick}
          onKeyDown={onZoneKeyDown}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(fileUploadZoneVariants({ variant: dropzoneVariant, size }), className)}
        >
          {showFileInZone ? (
            <div className="flex w-full items-center gap-3">
              {thumb(files[0]!, resolvedSize)}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{files[0]!.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatFileSize(files[0]!.size)}
                  {replaceLabel != null ? <> &middot; {replaceLabel}</> : null}
                </p>
              </div>
              <div data-file-action className="flex shrink-0 items-center gap-1">
                {fileActions(files[0]!, 0)}
              </div>
            </div>
          ) : (
            <>
              <UploadIcon className={cn("text-muted", EMPTY_ICON[resolvedSize])} />
              <span className="font-medium text-ink">{placeholder}</span>
              {description != null ? <span className="text-muted">{description}</span> : null}
            </>
          )}
        </div>
      )}

      {showList ? (
        <ul id={listId} className="flex flex-col gap-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              className="flex items-center gap-2.5 rounded-gk-md border border-line bg-canvas px-2.5 py-2 text-sm"
            >
              {thumb(file, "sm")}
              <span className="min-w-0 flex-1 truncate text-ink">{file.name}</span>
              <span className="shrink-0 text-xs text-muted">{formatFileSize(file.size)}</span>
              <span data-file-action className="flex shrink-0 items-center gap-1">
                {fileActions(file, index)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {messageText != null ? (
        <p id={errorId} className="text-xs text-danger">
          {messageText}
        </p>
      ) : hint != null ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}

      {previewInDialog && !onView ? (
        <FilePreviewDialog
          file={previewFile}
          url={previewFile ? urlFor(previewFile) : ""}
          subtext={previewFile ? formatFileSize(previewFile.size) : undefined}
          open={previewFile != null}
          onOpenChange={(open) => {
            if (!open) setPreviewFile(null);
          }}
        />
      ) : null}
    </div>
  );
});
