---
"@gramkick/ui": minor
---

- `isRequired` on `Input`, `Dropdown`, `Autosuggest`, `FileUpload`, `DatePicker`, `DateRangePicker`, `TimePicker` and `DropdownRangePicker`: shows the required mark and sets `aria-required` without the browser's own required-field validation (`required` keeps doing both). New `RequiredMark` export for custom label compositions.
- New hooks: `useInfiniteScroll` (IntersectionObserver sentinel, one request at a time, at most one per scroll gesture) and `usePagedList` (page-by-page data with start-over on filter change; late answers for old filters are dropped).
- `DataTable`: new opt-in `infiniteScroll={{ hasMore, onLoadMore, height?, rowHeight?, actionsWidth? }}` — rows are virtualised with react-window (new dependency, `react-window@^2.3.0`, not bundled), the pager footer is dropped, and more rows load as the end scrolls into view. Loading / error / empty states match the paged table. Tables without it (incl. every paginated table) are unchanged.
