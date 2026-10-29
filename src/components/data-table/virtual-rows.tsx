import { useRef, type CSSProperties, type ReactNode, type Ref } from "react";
import { List, type RowComponentProps } from "react-window";
import { cn } from "../../lib/cn";
import { Checkbox } from "../selection/selection";
import { Spinner } from "../spinner/spinner";
import type { DataTableColumn, DataTableSize, DataTableVariant } from "./data-table";

// The body of a DataTable in `infiniteScroll` mode: a react-window list, so only the rows on screen are rendered no
// matter how many have loaded. A <table> can't hold absolutely-positioned rows, so this view lays the header and every
// row out as CSS grids sharing one column template (with ARIA table roles); paged tables keep the real <table>.

export const VIRTUAL_ROW_HEIGHT: Record<DataTableSize, number> = { sm: 36, md: 48, lg: 56 };
const PAD_X: Record<DataTableSize, string> = { sm: "px-2.5", md: "px-3", lg: "px-4" };
const SELECT_WIDTH = 48;
const MIN_COLUMN_WIDTH = 120;

const justify = (align?: "left" | "center" | "right") =>
  align === "right" ? "justify-end text-right" : align === "center" ? "justify-center text-center" : "justify-start";

const px = (width: number | string) => (typeof width === "number" ? `${width}px` : width);

export interface VirtualRowsProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowId: (row: T, index: number) => string;
  size: DataTableSize;
  variant: DataTableVariant;
  hasMore: boolean;
  sentinelRef: Ref<HTMLDivElement>;
  height: number | string;
  rowHeight: number;
  actionsWidth: number;
  headerLabel: (col: DataTableColumn<T>) => ReactNode;
  cellContent: (row: T, index: number, col: DataTableColumn<T>) => ReactNode;
  selectable: boolean;
  headerSelect: ReactNode;
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
  actions?: (row: T) => ReactNode;
  actionsHeader?: ReactNode;
  stickyFirstColumn: boolean;
  stickyActions: boolean;
  highlight?: (row: T, index: number) => string | undefined;
  isRowDisabled?: (row: T, index: number) => boolean;
  ariaLabel: string;
  total: number;
}

type RowData<T> = Omit<VirtualRowsProps<T>, "height" | "headerLabel" | "headerSelect" | "actionsHeader" | "ariaLabel" | "total"> & {
  template: string;
  minWidth: number;
};

function VirtualRow<T>({ index, style, ...p }: RowComponentProps<RowData<T>>) {
  // The trailing row while more is left: the infinite-scroll sentinel.
  if (index >= p.rows.length) {
    return (
      <div style={{ ...style, width: `max(100%, ${p.minWidth}px)` }} className="flex items-center justify-center">
        <div ref={p.sentinelRef} role="status" aria-label="Loading more rows" className="flex justify-center">
          <Spinner size="sm" />
        </div>
      </div>
    );
  }
  const row = p.rows[index]!;
  const rid = p.rowId(row, index);
  const selected = p.isSelected(rid);
  const disabled = p.isRowDisabled?.(row, index) ?? false;
  const striped = p.variant === "striped" && index % 2 === 1;
  const tint = selected ? "bg-art" : striped ? "bg-mint group-hover:bg-art" : "bg-canvas group-hover:bg-mint";
  const highlight = p.highlight?.(row, index);
  const tone: CSSProperties | undefined = highlight ? { background: highlight } : undefined;
  const pinLeft = (on: boolean) => (on ? cn("sticky left-0 z-10", tint) : undefined);
  const cell = cn("flex min-w-0 items-center overflow-hidden whitespace-nowrap", PAD_X[p.size], p.variant === "bordered" && "border-r border-line last:border-r-0");
  return (
    <div
      role="row"
      aria-rowindex={index + 2}
      aria-selected={p.selectable ? selected : undefined}
      data-selected={selected || undefined}
      style={{ ...style, ...tone, width: `max(100%, ${p.minWidth}px)`, gridTemplateColumns: p.template }}
      className={cn(
        "group grid border-b border-line text-sm transition-colors",
        p.size === "sm" && "text-xs",
        disabled ? "bg-gray-100 opacity-60 grayscale" : selected ? "bg-art" : striped ? "bg-mint hover:bg-art" : "bg-canvas hover:bg-mint",
      )}
    >
      {p.selectable ? (
        <div role="gridcell" className={cn(cell, pinLeft(p.stickyFirstColumn))} style={tone}>
          <Checkbox size="md" aria-label={`Select row ${index + 1}`} checked={selected} disabled={disabled} onChange={() => p.onToggle(rid)} />
        </div>
      ) : null}
      {p.columns.map((col, ci) => {
        const pinned = p.stickyFirstColumn && !p.selectable && ci === 0;
        return (
          <div
            key={col.id}
            role="cell"
            className={cn(cell, justify(col.align), pinLeft(pinned), col.cellClassName)}
            style={pinned ? tone : undefined}
          >
            {p.cellContent(row, index, col)}
          </div>
        );
      })}
      {p.actions ? (
        <div role="cell" className={cn(cell, "justify-end", p.stickyActions && cn("sticky right-0 z-10", tint))} style={tone}>
          {p.actions(row)}
        </div>
      ) : null}
    </div>
  );
}

export function VirtualRows<T>(props: VirtualRowsProps<T>) {
  const { columns, size, selectable, actions, height, headerLabel, headerSelect, actionsHeader, ariaLabel, total, hasMore, rows } = props;
  const template = [
    selectable ? `${SELECT_WIDTH}px` : null,
    ...columns.map((col) => (col.width != null ? px(col.width) : `minmax(${MIN_COLUMN_WIDTH}px, 1fr)`)),
    actions ? `${props.actionsWidth}px` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const minWidth =
    (selectable ? SELECT_WIDTH : 0) +
    columns.reduce((sum, col) => sum + (typeof col.width === "number" ? col.width : MIN_COLUMN_WIDTH), 0) +
    (actions ? props.actionsWidth : 0);

  // The header sits outside the list (it doesn't scroll away) and follows the list's horizontal scroll.
  const head = useRef<HTMLDivElement>(null);
  const th = cn("flex min-w-0 items-center whitespace-nowrap font-semibold text-muted", PAD_X[size]);

  const rowProps: RowData<T> = { ...props, template, minWidth };
  return (
    <div role="table" aria-label={ariaLabel} aria-rowcount={total + 1} className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
      <div
        ref={head}
        role="rowgroup"
        className="overflow-hidden border-b-2 border-line bg-mint"
        // Same gutter as the list's scrollbar, so the header columns line up with the rows.
        style={{ scrollbarGutter: "stable" }}
      >
        <div
          role="row"
          aria-rowindex={1}
          className={cn("grid text-sm", size === "sm" && "text-xs")}
          style={{ gridTemplateColumns: template, minWidth, height: VIRTUAL_ROW_HEIGHT[size] }}
        >
          {selectable ? <div role="columnheader" className={cn(th, props.stickyFirstColumn && "sticky left-0 z-10 bg-mint")}>{headerSelect}</div> : null}
          {columns.map((col, ci) => (
            <div
              key={col.id}
              role="columnheader"
              className={cn(th, justify(col.align), props.stickyFirstColumn && !selectable && ci === 0 && "sticky left-0 z-10 bg-mint", col.headerClassName)}
            >
              {headerLabel(col)}
            </div>
          ))}
          {actions ? (
            <div role="columnheader" className={cn(th, "justify-end", props.stickyActions && "sticky right-0 z-10 bg-mint")}>
              {actionsHeader ?? <span className="sr-only">Actions</span>}
            </div>
          ) : null}
        </div>
      </div>
      <List
        role="rowgroup"
        rowComponent={VirtualRow<T>}
        rowCount={rows.length + (hasMore ? 1 : 0)}
        rowHeight={props.rowHeight}
        rowProps={rowProps}
        overscanCount={4}
        style={{ height: px(height), scrollbarGutter: "stable" }}
        onScroll={(event) => {
          if (head.current) head.current.scrollLeft = event.currentTarget.scrollLeft;
        }}
      />
    </div>
  );
}
