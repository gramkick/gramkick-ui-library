# `DataTable` — plan

A dynamic, responsive table for `@gramkick/ui`. Same conventions as the rest of the
library: one `dataTableVariants` cva (`variant` × `size`), typed props, tests +
stories, composed from existing primitives (`Checkbox`, `Skeleton`, `EmptyState`,
`Button`).

## Public API

```ts
DataTable<T>({
  columns, data, getRowId,
  variant, size,                         // "default" | "bordered" | "striped"  ×  sm | md | lg
  loading, loadingRows,                  // skeleton rows, height == pageSize -> no layout shift
  error,                                 // ReactNode -> EmptyState variant="error"
  emptyState | emptyTitle emptyDescription,
  stickyHeader,                          // <thead> sticky on vertical scroll
  stickyFirstColumn,                     // pin column[0] (and the checkbox col) to the left
  actions, actionsHeader, stickyActions, // auto right column; pin to the right
  selectable, selectionMode,             // "checkbox" | "menu"
  selectedIds / defaultSelectedIds / onSelectionChange(ids, { allPages }),
  pagination,
  page / defaultPage / onPageChange,     // 1-based
  pageSize / defaultPageSize / onPageSizeChange, pageSizeOptions,
  totalCount, manualPagination,          // manual = `data` is already the page
})
```

### Column def

```ts
DataTableColumn<T> = {
  id: string
  header: ReactNode
  cell?: (row, i) => ReactNode                    // full custom
  accessor?: (row) => CellValue | ReactNode       // else table reads row[id]
  align?: "left" | "center" | "right"
  width?: number | string                          // -> <colgroup>
  sticky?: "left" | "right"                         // sugar handled via stickyFirstColumn/stickyActions
  headerClassName? / cellClassName?
}
```

### Rich cell value

A cell value that is an object is rendered as **[avatar/leftIcon] text / subtext [rightIcon]**.
Normalised keys: `text|title|name` → text, `subtext|description|email|caption` → subtext,
`iconUrl|avatarUrl|image` → round avatar, `leftIcon|icon` / `rightIcon` → nodes.
So a user cell can just be `{ name, email, iconUrl }`.

## Responsive

- Table lives in `overflow-x-auto` → horizontal scroll on mobile.
- `<colgroup>` fixes widths (loading + loaded match → minimal shift).
- Sticky: checkbox col `left-0`; if `stickyFirstColumn`, col[0] at `left-12` (checkbox col is `w-12`);
  actions col `right-0`; each has a solid bg + edge shadow. `stickyHeader` → `<thead>` `sticky top-0`.
- Footer: `flex-col` on mobile, `sm:flex-row justify-between`.
  Left = page-size `Dropdown` (sm) + "Showing X–Y of Z". Right = `« ‹ 1 … 4 5 6 … 20 › »`,
  collapsing to `‹ Page 5 / 20 ›` under `sm` (`useMediaQuery`).

## Selection

- Row: leading `Checkbox`. Header (`checkbox` mode): tri-state select-all for the current page.
- `menu` mode: checkbox **+ caret**; menu = _Select this page_ / _Select all N_ / _Clear_.
- Picking "all pages" sets `allPagesSelected`; `onSelectionChange` reports `{ allPages: true }` and a
  banner appears above the table: _All N on this page selected — Select all {total}_ /
  _All {total} selected — Clear_.

## States

`loading` → skeleton rows · `error` → `EmptyState variant="error"` in a full-width row ·
no rows → `EmptyState` (or `emptyState` prop) in a full-width row · otherwise the data rows.

## Files

`src/components/data-table/{data-table.tsx,index.ts,data-table.stories.tsx,data-table.test.tsx}`

- barrel export + README row.
