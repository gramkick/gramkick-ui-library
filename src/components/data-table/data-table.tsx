import {
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { useControllableState } from "../../hooks/use-controllable-state";
import { Checkbox } from "../selection/selection";
import { Dropdown } from "../dropdown/dropdown";
import { EmptyState } from "../empty-state/empty-state";
import { Skeleton } from "../skeleton/skeleton";

/* ------------------------------------------------------------------ icons -- */

const Chevron = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    aria-hidden="true"
  >
    <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Caret = ({ className }: { className?: string }) => (
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
/** Stacked triangles: the active direction is `leaf` green, the other a faint ink. */
const SortIcon = ({ dir }: { dir: "asc" | "desc" | null }) => (
  <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
    <path d="M8 2.5l3.2 3.8H4.8z" className={dir === "asc" ? "fill-leaf" : "fill-ink/25"} />
    <path d="M8 13.5l3.2-3.8H4.8z" className={dir === "desc" ? "fill-leaf" : "fill-ink/25"} />
  </svg>
);

/* --------------------------------------------------------------- variants -- */

export const dataTableVariants = cva("w-full border-collapse text-left align-middle", {
  variants: {
    variant: {
      default: "[&_tbody_tr]:border-b [&_tbody_tr]:border-line",
      striped: "[&_tbody_tr]:border-b [&_tbody_tr]:border-line",
      bordered: "[&_th]:border [&_td]:border [&_th]:border-line [&_td]:border-line",
    },
    size: { sm: "text-xs", md: "text-sm", lg: "text-sm" },
  },
  defaultVariants: { variant: "default", size: "md" },
});

export type DataTableVariant = NonNullable<VariantProps<typeof dataTableVariants>["variant"]>;
export type DataTableSize = NonNullable<VariantProps<typeof dataTableVariants>["size"]>;

const PAD: Record<DataTableSize, string> = {
  sm: "px-2.5 py-1.5",
  md: "px-3 py-2.5",
  lg: "px-4 py-3",
};
const ROW_H: Record<DataTableSize, string> = { sm: "h-9", md: "h-12", lg: "h-14" };

/* ------------------------------------------------------------------ types -- */

export interface RichCell {
  text?: ReactNode;
  subtext?: ReactNode;
  /** Round avatar. */
  iconUrl?: string;
  /** Leading node (SVG auto-sized) when there's no `iconUrl`. */
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  /** Full control over the cell. */
  cell?: (row: T, index: number) => ReactNode;
  /** Value for the cell — a node, a primitive, or a `RichCell` / `{ name, email, iconUrl }` object. */
  accessor?: (row: T) => unknown;
  align?: "left" | "center" | "right";
  width?: number | string;
  headerClassName?: string;
  cellClassName?: string;
  /** Render a sort toggle in this column's header (click cycles asc → desc → off). */
  sortable?: boolean;
  /** Value to sort this column by. Defaults to `accessor`, then `row[id]`. */
  sortAccessor?: (row: T) => unknown;
}

export interface DataTableSort {
  id: string;
  dir: "asc" | "desc";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Stable row id (for selection). Defaults to `row.id` then the absolute index. */
  getRowId?: (row: T, index: number) => string;

  variant?: DataTableVariant;
  size?: DataTableSize;

  /* sorting */
  /** Sortable column + direction. `null` = unsorted. Controlled. */
  sort?: DataTableSort | null;
  defaultSort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  /** `data` already arrives sorted — the table won't reorder it (server-side sort). */
  manualSort?: boolean;

  /**
   * Highlight rows that match a condition. Pass a CSS color for every row, or a
   * resolver that returns a color for the rows to flag (and a falsy value for the
   * rest). Use an opaque color so pinned columns match; it wins over the
   * striped / selected / hover tints.
   */
  highlightBackgroundColor?:
    string | ((row: T, index: number) => string | false | null | undefined);

  /** `Skeleton` rows instead of data (kept at row height to avoid layout shift). */
  loading?: boolean;
  loadingRows?: number;
  /** Replace the default skeleton body. */
  loadingState?: ReactNode;
  /** Anything truthy shows the error state in place of the rows. */
  error?: ReactNode;
  /** Replace the default error `EmptyState`. */
  errorState?: ReactNode;
  /** Replace the default "no data" `EmptyState`. */
  emptyState?: ReactNode;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;

  /** `<thead>` sticks to the top while the body scrolls (needs `maxHeight`). */
  stickyHeader?: boolean;
  /**
   * Pin the leading column to the left edge — the selection checkbox when
   * `selectable`, otherwise the first data column. Its shadow only shows once
   * the table is scrolled.
   */
  stickyFirstColumn?: boolean;
  /** Per-row actions rendered in a trailing column. */
  actions?: (row: T) => ReactNode;
  actionsHeader?: ReactNode;
  /** Pin the actions column to the right edge. */
  stickyActions?: boolean;
  /** Cap the body height and scroll it vertically. number (px) or CSS length. */
  maxHeight?: number | string;

  /* selection */
  selectable?: boolean;
  /** `checkbox` = tri-state select-all; `menu` = checkbox + caret menu (this page / all N / clear). */
  selectionMode?: "checkbox" | "menu";
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[], meta: { allPages: boolean }) => void;

  /* pagination */
  pagination?: boolean;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Total rows across all pages. Falls back to `data.length` (client-side paging). */
  totalCount?: number;
  /** `data` is already the current page — the table won't slice it. */
  manualPagination?: boolean;

  className?: string;
  id?: string;
  "aria-label"?: string;
}

/* --------------------------------------------------------------- rich cell -- */

const RICH_KEYS = new Set([
  "text",
  "title",
  "name",
  "label",
  "subtext",
  "subtitle",
  "description",
  "email",
  "caption",
  "iconUrl",
  "avatarUrl",
  "avatar",
  "image",
  "imageUrl",
  "leftIcon",
  "icon",
  "rightIcon",
]);

function normalizeCell(v: unknown): RichCell | null {
  if (v == null || typeof v !== "object" || Array.isArray(v) || isValidElement(v)) return null;
  const o = v as Record<string, unknown>;
  if (!Object.keys(o).some((k) => RICH_KEYS.has(k))) return null;
  const text = o.text ?? o.title ?? o.name ?? o.label;
  const subtext = o.subtext ?? o.subtitle ?? o.description ?? o.email ?? o.caption;
  const iconUrl = o.iconUrl ?? o.avatarUrl ?? o.avatar ?? o.image ?? o.imageUrl;
  const leftIcon = o.leftIcon ?? o.icon;
  if (text == null && subtext == null && iconUrl == null && leftIcon == null) return null;
  return {
    text: text as ReactNode,
    subtext: subtext as ReactNode,
    iconUrl: typeof iconUrl === "string" ? iconUrl : undefined,
    leftIcon: leftIcon as ReactNode,
    rightIcon: o.rightIcon as ReactNode,
  };
}

function CellBody({ value }: { value: unknown }) {
  if (isValidElement(value)) return <>{value}</>;
  const rich = normalizeCell(value);
  if (!rich) return <>{(value ?? "") as ReactNode}</>;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {rich.iconUrl ? (
        <img src={rich.iconUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
      ) : rich.leftIcon != null ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-leaf [&_svg]:size-4">
          {rich.leftIcon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink">{rich.text}</span>
        {rich.subtext != null ? (
          <span className="block truncate text-xs font-normal text-muted">{rich.subtext}</span>
        ) : null}
      </span>
      {rich.rightIcon != null ? (
        <span className="ml-auto shrink-0 text-muted [&_svg]:size-4">{rich.rightIcon}</span>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- sorting -- */

/** Ascending comparison; `null` / `undefined` sort last. Numbers, dates, and
 *  numeric-ish strings compare naturally. */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return a === b ? 0 : a ? 1 : -1;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/* ------------------------------------------------------------- page range -- */

/**
 * Compact page list: always the first two and last two pages, with the current
 * page floating between ellipses in the middle —
 * `1 2 … 5 … 9 10`. On the first/last two pages there is no middle number, so it
 * collapses to `1 2 … 9 10`.
 */
export function pageRange(current: number, count: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const middle = current > 2 && current < count - 1 ? current : null;
  return middle == null
    ? [1, 2, "gap", count - 1, count]
    : [1, 2, "gap", middle, "gap", count - 1, count];
}

/* --------------------------------------------------------- selection menu -- */

/** Caret + a menu portalled to `document.body` so it escapes the table's overflow. */
function SelectionMenu({
  pageLabel,
  totalLabel,
  onSelectPage,
  onSelectAll,
  onClear,
}: {
  pageLabel: string;
  totalLabel: string;
  onSelectPage: () => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "cursor-pointer px-3 py-1.5 text-ink hover:bg-mint";
  const run = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Selection options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center rounded p-0.5 text-muted hover:bg-mint hover:text-ink"
      >
        <Caret className="size-3.5" />
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <ul
              ref={menuRef}
              role="menu"
              style={{ position: "fixed", top: pos.top, left: pos.left }}
              className="z-[70] min-w-48 overflow-hidden rounded-gk-md border border-line bg-surface py-1 text-left text-sm font-normal shadow-modal"
            >
              <li role="menuitem" onClick={run(onSelectPage)} className={item}>
                {pageLabel}
              </li>
              <li role="menuitem" onClick={run(onSelectAll)} className={item}>
                {totalLabel}
              </li>
              <li
                role="menuitem"
                onClick={run(onClear)}
                className={cn(item, "border-t border-line")}
              >
                Clear selection
              </li>
            </ul>,
            document.body,
          )
        : null}
    </>
  );
}

/* ----------------------------------------------------------------- table -- */

const alignClass = (a?: "left" | "center" | "right") =>
  a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";

/**
 * A dynamic, responsive table. Pass `columns` + `data`; it handles horizontal
 * scroll on mobile, pinned first / actions columns, row selection (with a
 * this-page / all-pages menu), a paginated footer, and skeleton / empty / error
 * states. `variant` (`default` | `striped` | `bordered`) × `size` follow the
 * shared pattern. Cell values that are `{ name, email, iconUrl, … }` objects
 * render as an avatar + text + subtext block.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  variant = "default",
  size = "md",
  sort: sortProp,
  defaultSort,
  onSortChange,
  manualSort = false,
  highlightBackgroundColor,
  loading = false,
  loadingRows,
  loadingState,
  error,
  errorState,
  emptyState,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  stickyHeader = false,
  stickyFirstColumn = false,
  actions,
  actionsHeader,
  stickyActions = false,
  maxHeight,
  selectable = false,
  selectionMode = "checkbox",
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
  pagination = false,
  page: pageProp,
  defaultPage,
  onPageChange,
  pageSize: pageSizeProp,
  defaultPageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  totalCount,
  manualPagination = false,
  className,
  id,
  "aria-label": ariaLabel = "Data table",
}: DataTableProps<T>) {
  const [page, setPage] = useControllableState<number>({
    value: pageProp,
    defaultValue: defaultPage ?? 1,
    onChange: onPageChange,
  });
  const [pageSize, setPageSize] = useControllableState<number>({
    value: pageSizeProp,
    defaultValue: defaultPageSize ?? pageSizeOptions[0] ?? 10,
    onChange: onPageSizeChange,
  });
  const [selected, setSelected] = useControllableState<string[]>({
    value: selectedIds,
    defaultValue: defaultSelectedIds ?? [],
  });
  const [allPages, setAllPages] = useState(false);
  const [sort, setSort] = useControllableState<DataTableSort | null>({
    value: sortProp,
    defaultValue: defaultSort ?? null,
    onChange: onSortChange,
  });

  /* edge shadows on pinned columns — only while the table is scrolled */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  /* click a sortable header: asc → desc → unsorted, back to page 1 */
  const cycleSort = (colId: string) => {
    const next: DataTableSort | null =
      !sort || sort.id !== colId
        ? { id: colId, dir: "asc" }
        : sort.dir === "asc"
          ? { id: colId, dir: "desc" }
          : null;
    setSort(next);
    setPage(1);
  };

  const sortedData = (() => {
    if (manualSort || !sort) return data;
    const col = columns.find((c) => c.id === sort.id);
    if (!col) return data;
    const read =
      col.sortAccessor ??
      col.accessor ??
      ((row: T) => (row as unknown as Record<string, unknown>)[col.id]);
    const factor = sort.dir === "asc" ? 1 : -1;
    return data
      .map((row, i) => [row, i] as const)
      .sort(([a, ai], [b, bi]) => {
        const c = compareValues(read(a), read(b));
        return c !== 0 ? c * factor : ai - bi;
      })
      .map(([row]) => row);
  })();

  const total = totalCount ?? data.length;
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const pageRows = manualPagination
    ? sortedData
    : sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const rowId = (row: T, i: number) => {
    const abs = manualPagination ? i : (currentPage - 1) * pageSize + i;
    if (getRowId) return getRowId(row, abs);
    const own = (row as unknown as { id?: unknown } | null)?.id;
    return own == null ? String(abs) : String(own);
  };

  const selectedSet = new Set(selected);
  const pageIds = pageRows.map(rowId);
  const allOnPage = pageIds.length > 0 && pageIds.every((x) => selectedSet.has(x));
  const someOnPage = !allOnPage && pageIds.some((x) => selectedSet.has(x));

  const emit = (ids: string[], meta = { allPages: false }) => {
    setSelected(ids);
    onSelectionChange?.(ids, meta);
  };
  const toggleRow = (rid: string) => {
    setAllPages(false);
    emit(selectedSet.has(rid) ? selected.filter((x) => x !== rid) : [...selected, rid]);
  };
  const togglePage = () => {
    setAllPages(false);
    emit(
      allOnPage
        ? selected.filter((x) => !pageIds.includes(x))
        : Array.from(new Set([...selected, ...pageIds])),
    );
  };
  const selectAllPages = () => {
    setAllPages(true);
    emit(Array.from(new Set([...selected, ...pageIds])), { allPages: true });
  };
  const clearSelection = () => {
    setAllPages(false);
    emit([]);
  };

  const totalCols = (selectable ? 1 : 0) + columns.length + (actions ? 1 : 0);
  const showFooter = pagination;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setEdge({
        left: scrollLeft > 1,
        right: scrollLeft + clientWidth < scrollWidth - 1,
      });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [columns.length, pageRows.length, selectable, actions, loading, error]);

  /* ---- sticky helpers ---- */
  // Exactly one column pins to the left, at `left-0` (no fixed widths needed):
  // the selection checkbox when `selectable`, otherwise the first data column.
  const pinCheckbox = stickyFirstColumn && selectable;
  const pinFirstData = stickyFirstColumn && !selectable;
  // Pinned cells need an opaque background so the scrolled columns don't show
  // through; `bg` lets a body row pass its hover / selected / striped tint so the
  // sticky column tracks the rest of the row.
  const stickyBase = "sticky z-20";
  const leftPinned = (on: boolean, bg = "bg-canvas") =>
    on ? cn(stickyBase, "left-0", bg, edge.left && leftShadow) : undefined;
  const rightPinned = (bg = "bg-canvas") =>
    stickyActions ? cn(stickyBase, "right-0", bg, edge.right && rightShadow) : undefined;
  const leftShadow =
    "after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-3 after:translate-x-full after:bg-gradient-to-r after:from-ink/10 after:to-transparent";
  const rightShadow =
    "after:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:w-3 after:-translate-x-full after:bg-gradient-to-l after:from-ink/10 after:to-transparent";

  const headStickyTop = stickyHeader ? "sticky top-0 z-10 bg-mint" : "";
  const thBase = cn(
    "whitespace-nowrap align-middle font-semibold text-muted",
    PAD[size],
    ROW_H[size],
    headStickyTop,
  );
  // Cells size to their content and the table scrolls — no wrapping by default.
  // A column that wants to wrap can pass `cellClassName="whitespace-normal"`.
  const tdBase = cn("whitespace-nowrap align-middle", PAD[size]);

  /* ---- rows ---- */
  const bodyRows = pageRows.map((row, i) => {
    const rid = rowId(row, i);
    const isSel = selectedSet.has(rid) || allPages;
    const striped = variant === "striped" && i % 2 === 1;
    // Opaque tints (no alpha) so the pinned columns can reuse them without the
    // scrolled content ghosting through. Hover is the light `mint`; on striped
    // rows (already `mint`) it steps up to `art` so the hover still reads.
    const rowTint = isSel
      ? "bg-art"
      : striped
        ? "bg-mint group-hover:bg-art"
        : "bg-canvas group-hover:bg-mint";
    const highlight =
      typeof highlightBackgroundColor === "function"
        ? highlightBackgroundColor(row, i) || undefined
        : highlightBackgroundColor;
    const highlightStyle: CSSProperties | undefined = highlight
      ? { background: highlight }
      : undefined;
    return (
      <tr
        key={rid}
        data-selected={isSel || undefined}
        data-highlighted={highlight ? true : undefined}
        style={highlightStyle}
        className={cn(
          "group",
          ROW_H[size],
          "transition-colors",
          isSel ? "bg-art" : striped ? "bg-mint hover:bg-art" : "hover:bg-mint",
        )}
      >
        {selectable ? (
          <td
            className={cn(tdBase, "w-0", leftPinned(pinCheckbox, rowTint))}
            style={highlightStyle}
          >
            <Checkbox
              size="md"
              aria-label={`Select row ${i + 1}`}
              checked={isSel}
              onChange={() => toggleRow(rid)}
            />
          </td>
        ) : null}

        {columns.map((col, ci) => {
          const value = col.cell
            ? col.cell(row, i)
            : col.accessor
              ? col.accessor(row)
              : (row as unknown as Record<string, unknown>)[col.id];
          const pinned = pinFirstData && ci === 0;
          return (
            <td
              key={col.id}
              className={cn(
                tdBase,
                alignClass(col.align),
                leftPinned(pinned, rowTint),
                col.cellClassName,
              )}
              style={pinned ? highlightStyle : undefined}
            >
              {col.cell ? (value as ReactNode) : <CellBody value={value} />}
            </td>
          );
        })}

        {actions ? (
          <td className={cn(tdBase, "w-0 text-right", rightPinned(rowTint))} style={highlightStyle}>
            {actions(row)}
          </td>
        ) : null}
      </tr>
    );
  });

  const skeletonRows = Array.from({ length: loadingRows ?? Math.min(pageSize, 8) }, (_, i) => (
    <tr key={`sk-${i}`} className={cn(ROW_H[size])}>
      {selectable ? (
        <td className={cn(tdBase, "w-0", leftPinned(pinCheckbox))}>
          <span className="flex items-center">
            <Skeleton variant="rounded" width={16} height={16} />
          </span>
        </td>
      ) : null}
      {columns.map((col, ci) => (
        <td
          key={col.id}
          className={cn(tdBase, alignClass(col.align), leftPinned(pinFirstData && ci === 0))}
        >
          <span
            className={cn(
              "flex items-center",
              col.align === "right" && "justify-end",
              col.align === "center" && "justify-center",
            )}
          >
            <Skeleton width={90 + ((i * 13) % 60)} />
          </span>
        </td>
      ))}
      {actions ? (
        <td className={cn(tdBase, "w-0 text-right", rightPinned())}>
          <span className="flex items-center justify-end">
            <Skeleton width={64} />
          </span>
        </td>
      ) : null}
    </tr>
  ));

  const stateRow = (node: ReactNode) => (
    <tr>
      <td colSpan={totalCols} className="p-0">
        {node}
      </td>
    </tr>
  );

  /* ---- header select control ---- */
  const headerSelect = selectable ? (
    <div className="flex items-center gap-1">
      <Checkbox
        size="md"
        aria-label="Select all rows on this page"
        checked={allOnPage || allPages}
        indeterminate={someOnPage && !allPages}
        onChange={togglePage}
      />
      {selectionMode === "menu" ? (
        <SelectionMenu
          pageLabel={`Select this page (${pageIds.length})`}
          totalLabel={`Select all (${total})`}
          onSelectPage={() => {
            setAllPages(false);
            emit(Array.from(new Set([...selected, ...pageIds])));
          }}
          onSelectAll={selectAllPages}
          onClear={clearSelection}
        />
      ) : null}
    </div>
  ) : null;

  /* ---- banner ---- */
  const showBanner =
    selectable &&
    !loading &&
    !error &&
    pageRows.length > 0 &&
    (allOnPage || allPages) &&
    total > pageIds.length;
  const banner = showBanner ? (
    <div className="flex flex-wrap items-center justify-center gap-1.5 border-b border-line bg-mint/40 px-3 py-2 text-center text-xs text-ink">
      {allPages ? (
        <>
          <span>All {total} rows are selected.</span>
          <button
            type="button"
            onClick={clearSelection}
            className="cursor-pointer font-semibold text-leaf hover:underline"
          >
            Clear selection
          </button>
        </>
      ) : (
        <>
          <span>All {pageIds.length} rows on this page are selected.</span>
          <button
            type="button"
            onClick={selectAllPages}
            className="cursor-pointer font-semibold text-leaf hover:underline"
          >
            Select all {total}
          </button>
        </>
      )}
    </div>
  ) : null;

  /* ---- footer ---- */
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = manualPagination
    ? from + pageRows.length - 1
    : Math.min(currentPage * pageSize, total);
  const goto = (p: number) => setPage(Math.min(Math.max(1, p), pageCount));

  const navBtn =
    "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-gk-sm border border-line text-muted transition-colors hover:bg-mint hover:text-ink disabled:pointer-events-none disabled:opacity-40";

  const footer = showFooter ? (
    <div className="flex flex-col gap-3 border-t border-line px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-1.5 sm:gap-x-3">
        <span className="hidden text-xs font-medium text-muted sm:inline">Rows per page</span>
        <Dropdown
          size="sm"
          label={<span className="sr-only">Rows per page</span>}
          options={pageSizeOptions.map((n) => ({ value: String(n), label: `${n} / page` }))}
          value={String(pageSize)}
          onChange={(v) => {
            setPageSize(Number(v));
            setPage(1);
          }}
          clearable={false}
          containerClassName="w-[7rem] shrink-0"
        />
        <span className="text-xs text-muted sm:ml-1">
          {total === 0 ? "No rows" : `Showing ${from}–${to} of ${total}`}
        </span>
      </div>

      {/* Same numbered pager on every width — full-width and centred on mobile,
          right-aligned beside the limit row from `sm` up. */}
      <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
        <button
          type="button"
          aria-label="Previous page"
          disabled={currentPage <= 1}
          onClick={() => goto(currentPage - 1)}
          className={navBtn}
        >
          <Chevron className="size-3.5 rotate-180" />
        </button>
        {pageRange(currentPage, pageCount).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-muted">
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? "page" : undefined}
              onClick={() => goto(p)}
              className={cn(
                "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-gk-sm border text-sm transition-colors",
                p === currentPage
                  ? "border-leaf bg-leaf font-semibold text-white"
                  : "border-line text-ink hover:bg-mint",
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Next page"
          disabled={currentPage >= pageCount}
          onClick={() => goto(currentPage + 1)}
          className={navBtn}
        >
          <Chevron className="size-3.5" />
        </button>
      </div>
    </div>
  ) : null;

  const scrollStyle: CSSProperties | undefined = maxHeight
    ? { maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }
    : undefined;

  return (
    <div
      id={id}
      data-slot="data-table"
      className={cn(
        // A single `minmax(0,1fr)` grid track pins every child (header, body, footer)
        // to the card width, so a wide table scrolls *inside* the scroll region
        // instead of stretching the card — even in a flex / grid / inline parent.
        "grid w-full min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden rounded-gk-lg border border-line bg-canvas",
        className,
      )}
    >
      {banner}
      <div
        ref={scrollRef}
        data-slot="data-table-scroll"
        data-scrolled-x={edge.left || undefined}
        className={cn("min-w-0 overflow-x-auto", maxHeight && "overflow-y-auto")}
        style={scrollStyle}
      >
        <table aria-label={ariaLabel} className={cn(dataTableVariants({ variant, size }))}>
          {columns.some((c) => c.width != null) ? (
            <colgroup>
              {selectable ? <col className="w-0" /> : null}
              {columns.map((col) => (
                <col
                  key={col.id}
                  style={
                    col.width != null
                      ? { width: typeof col.width === "number" ? `${col.width}px` : col.width }
                      : undefined
                  }
                />
              ))}
              {actions ? <col className="w-0" /> : null}
            </colgroup>
          ) : null}

          <thead className="border-b-2 border-line bg-mint">
            <tr>
              {selectable ? (
                <th
                  scope="col"
                  className={cn(
                    thBase,
                    "w-0",
                    leftPinned(pinCheckbox, "bg-mint"),
                    stickyHeader && pinCheckbox && "z-30",
                  )}
                >
                  {headerSelect}
                </th>
              ) : null}
              {columns.map((col, ci) => {
                const pinned = pinFirstData && ci === 0;
                const activeDir = sort?.id === col.id ? sort.dir : null;
                return (
                  <th
                    key={col.id}
                    scope="col"
                    aria-sort={
                      col.sortable
                        ? activeDir === "asc"
                          ? "ascending"
                          : activeDir === "desc"
                            ? "descending"
                            : "none"
                        : undefined
                    }
                    className={cn(
                      thBase,
                      alignClass(col.align),
                      leftPinned(pinned, "bg-mint"),
                      pinned && stickyHeader && "z-30",
                      col.headerClassName,
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => cycleSort(col.id)}
                        className={cn(
                          "-mx-1 inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded px-1 py-0.5 align-middle font-semibold transition-colors hover:text-ink",
                          activeDir && "text-ink",
                        )}
                      >
                        <span>{col.header}</span>
                        <SortIcon dir={activeDir} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {actions ? (
                <th
                  scope="col"
                  className={cn(
                    thBase,
                    "w-0 text-right",
                    rightPinned("bg-mint"),
                    stickyActions && stickyHeader && "z-30",
                  )}
                >
                  {actionsHeader ?? <span className="sr-only">Actions</span>}
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {loading
              ? loadingState != null
                ? stateRow(loadingState)
                : skeletonRows
              : error
                ? stateRow(
                    errorState ?? (
                      <EmptyState
                        variant="error"
                        size={size === "lg" ? "md" : "sm"}
                        title="Couldn't load data"
                        description={error}
                      />
                    ),
                  )
                : pageRows.length === 0
                  ? stateRow(
                      emptyState ?? (
                        <EmptyState
                          size={size === "lg" ? "md" : "sm"}
                          title={emptyTitle}
                          description={emptyDescription}
                        />
                      ),
                    )
                  : bodyRows}
          </tbody>
        </table>
      </div>

      {footer}
    </div>
  );
}
