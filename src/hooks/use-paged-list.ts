import { useCallback, useEffect, useRef, useState } from "react";

/** One page from the server: its rows plus the total across all pages. */
export interface PagedListPage<T> {
  items: T[];
  total: number;
}

/** The row type of a page type. */
export type PagedListItem<P> = P extends PagedListPage<infer T> ? T : never;

// Any row type — the rows' type is read back with PagedListItem.
type AnyPage = PagedListPage<any>;

export interface UsePagedListOptions<P extends AnyPage> {
  /**
   * Loads one page (1-based). Memoise it (`useCallback`) with the filters it reads: when it changes, the list starts
   * over from page 1.
   */
  fetchPage: (page: number) => Promise<P>;
  /** `false` keeps the list idle (no requests), e.g. while another layout shows the data. Default `true`. */
  enabled?: boolean;
  /** Change it to start over without new filters (e.g. a refresh counter). */
  resetKey?: unknown;
  /** Called with every page that arrives — e.g. to read extra fields of the first page's response. */
  onPage?: (result: P, page: number) => void;
  /** Turns a failed request into the `error` text. Default: the error's message. */
  errorMessage?: (error: unknown) => string;
}

export interface UsePagedListResult<T> {
  /** Every row loaded so far, in order. */
  items: T[];
  total: number;
  hasMore: boolean;
  /** True while page 1 is loading (the first load and every start-over). */
  loading: boolean;
  /** The last failed request's message, cleared by the next success. */
  error: string | null;
  /** Appends the next page — ignored while a request is already on its way. Returns that request's promise. */
  loadMore: () => Promise<void>;
  /** Starts over from page 1 (replaces the rows once it arrives). */
  reload: () => Promise<void>;
  /** For local edits to the loaded rows (e.g. after saving one). */
  setItems: (update: T[] | ((items: T[]) => T[])) => void;
}

const defaultErrorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "Couldn't load the list.";

/**
 * Page-by-page data for an infinite list / table: loads page 1, appends the next page on `loadMore`, and starts over
 * when `fetchPage` (its filters) or `resetKey` changes. One request at a time; a start-over supersedes a request still
 * on its way, so a late answer for old filters is dropped.
 *
 * @example
 * const fetchPage = useCallback((page: number) => api.orders({ status, page, limit: 15 }), [status]);
 * const list = usePagedList({ fetchPage, resetKey: refreshTick });
 * <DataTable data={list.items} loading={list.loading} infiniteScroll={{ hasMore: list.hasMore, onLoadMore: list.loadMore }} … />
 */
export function usePagedList<P extends AnyPage>({
  fetchPage,
  enabled = true,
  resetKey,
  onPage,
  errorMessage,
}: UsePagedListOptions<P>): UsePagedListResult<PagedListItem<P>> {
  type T = PagedListItem<P>;
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  // Starts true so a list never flashes "empty" before its first request begins.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const page = useRef(1);
  const inFlight = useRef(false);
  const requestId = useRef(0);
  const callbacks = useRef({ onPage, errorMessage });
  useEffect(() => {
    callbacks.current = { onPage, errorMessage };
  });

  const run = useCallback(
    async (reset: boolean) => {
      if (!reset && inFlight.current) return;
      const id = ++requestId.current;
      inFlight.current = true;
      const target = reset ? 1 : page.current + 1;
      if (reset) setLoading(true);
      try {
        const result = await fetchPage(target);
        if (id !== requestId.current) return; // superseded by a start-over
        page.current = target;
        const rows = result.items as T[];
        setItems((current) => (reset ? rows : [...current, ...rows]));
        setTotal(result.total);
        setError(null);
        callbacks.current.onPage?.(result, target);
      } catch (err) {
        if (id !== requestId.current) return;
        setError((callbacks.current.errorMessage ?? defaultErrorMessage)(err));
      } finally {
        if (id === requestId.current) {
          inFlight.current = false;
          if (reset) setLoading(false);
        }
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    if (!enabled) return;
    void run(true);
  }, [enabled, run, resetKey]);

  const loadMore = useCallback(() => run(false), [run]);
  const reload = useCallback(() => run(true), [run]);

  return { items, total, hasMore: items.length < total, loading, error, loadMore, reload, setItems };
}
