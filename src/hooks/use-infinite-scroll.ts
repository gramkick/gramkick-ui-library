import { useEffect, useRef, useState, type RefObject } from "react";

// Infinite scroll with an IntersectionObserver — the next page is requested only when the end of the list is on screen.
//
// Put the returned callback ref on a sentinel at the end of the list (for react-window lists: inside the trailing
// "loading" row, which is only rendered while there are more pages). Then:
//   - the sentinel comes into view            → one request (never two at once);
//   - the page has landed                     → if the user is still scrolling (a fling carrying on), nothing more
//                                               happens until that scroll ends — so one scroll never chains requests;
//   - the new rows render / the scroll ends   → the sentinel is observed afresh: if it's STILL in view (the user is at
//                                               the end, or the list doesn't fill the screen yet) the next page loads,
//                                               otherwise nothing happens until the user scrolls down to it again.
// No offsets or timers — the browser reports visibility (and when a scroll has ended).

/** Whether a scroll (incl. momentum) is under way anywhere on the page — tracked once for all lists. */
const scrollState = { scrolling: false, onEnd: new Set<() => void>() };
let tracking = false;
function trackScrolling() {
  // Browsers without `scrollend` simply skip the wait (loads then follow visibility alone).
  if (tracking || typeof window === "undefined" || !("onscrollend" in window)) return;
  tracking = true;
  // Capture phase: scroll / scrollend don't bubble, and inner scroll boxes (react-window lists) count too.
  document.addEventListener("scroll", () => { scrollState.scrolling = true; }, { capture: true, passive: true });
  document.addEventListener("scrollend", () => {
    scrollState.scrolling = false;
    for (const callback of [...scrollState.onEnd]) callback();
  }, { capture: true, passive: true });
}

export interface UseInfiniteScrollOptions {
  hasMore: boolean;
  /** e.g. while the first page is loading, or after a failed page (so it can't retry in a loop). */
  disabled?: boolean;
  /** Return the request's promise so the hook knows when it's done. */
  onLoadMore: () => unknown;
  /** Something that changes when rows are added (e.g. `items.length`), so the sentinel is re-checked after they render. */
  version?: unknown;
  /** How early to load, e.g. "0px 0px 200px 0px" — default: when the sentinel itself shows. */
  rootMargin?: string;
  /** The scroll container to observe within (e.g. a horizontal strip); omit for the page / any scroll box. */
  rootRef?: RefObject<HTMLElement | null>;
}

/**
 * Calls `onLoadMore` when the returned callback ref's element (a sentinel after the last row) scrolls into view —
 * one request at a time, and at most one per scroll gesture.
 *
 * @example
 * const sentinelRef = useInfiniteScroll({ hasMore, onLoadMore: loadMore, version: items.length });
 * …rows… {hasMore ? <div ref={sentinelRef}><Spinner size="sm" /></div> : null}
 */
export function useInfiniteScroll<E extends HTMLElement = HTMLDivElement>({
  hasMore,
  disabled = false,
  onLoadMore,
  version,
  rootMargin = "0px",
  rootRef,
}: UseInfiniteScrollOptions) {
  const [node, setNode] = useState<E | null>(null);
  // Bumped when a held-back recheck is due (the scroll that carried on after a page landed has ended).
  const [recheck, setRecheck] = useState(0);
  const loadRef = useRef(onLoadMore);
  useEffect(() => { loadRef.current = onLoadMore; });
  const busy = useRef(false);
  const enabled = hasMore && !disabled;

  useEffect(() => {
    trackScrolling();
  }, []);

  useEffect(() => {
    if (!node || !enabled || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || busy.current) return;
        busy.current = true;
        Promise.resolve(loadRef.current())
          .catch(() => undefined)
          .finally(() => {
            if (!scrollState.scrolling) {
              busy.current = false;
              return; // the new rows re-check the sentinel (`version`)
            }
            // Still scrolling: wait for that scroll to end, then look again.
            const release = () => {
              scrollState.onEnd.delete(release);
              busy.current = false;
              setRecheck((tick) => tick + 1);
            };
            scrollState.onEnd.add(release);
          });
      },
      { root: rootRef?.current ?? null, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, enabled, version, recheck, rootMargin, rootRef]);

  return setNode;
}
