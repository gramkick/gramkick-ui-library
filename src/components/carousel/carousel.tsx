"use client";

import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import { ChevronRightIcon } from "../icon";

export interface CarouselProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** One slide per child. */
  children: ReactNode;
  /**
   * How many slides fill the viewport at once. `1` (default) is the full-bleed,
   * one-at-a-time mobile carousel; `2`–`5` gives a desktop "row of cards" that
   * pages by a full view. Combine with `gap`.
   */
  slidesPerView?: number;
  /** Pixel gap between slides. Default `0` (single view) — use `12`–`24` for a card row. */
  gap?: number;
  /** Snap alignment of each slide. Defaults to `center` for a single view, `start` for multi. */
  align?: "start" | "center";
  /** Slide to reveal first (clamped); the carousel opens on the page that contains it. */
  initialIndex?: number;
  /** Fires with the index of the first visible slide whenever the page changes. */
  onIndexChange?: (index: number) => void;
  /** Prev / next overlay buttons — auto-hidden when everything fits. Default `true`. */
  showArrows?: boolean;
  /** Dot indicators (one per page) below the viewport — auto-hidden when everything fits. Default `true`. */
  showDots?: boolean;
  /**
   * Thumbnail image srcs, one per slide. When given (and there is more than
   * one), a scrollable thumbnail strip replaces the dots — the "gallery" look.
   */
  thumbnails?: string[];
  /** Extra classes for each thumbnail button. */
  thumbnailClassName?: string;
  /** Extra classes for the thumbnail strip container (e.g. widen the window on desktop). */
  thumbnailsClassName?: string;
  /** Accessible name for the carousel region. */
  "aria-label"?: string;
  /** Extra classes for the scroll viewport (put the height here). */
  viewportClassName?: string;
  /** Extra classes for each slide wrapper. */
  slideClassName?: string;
}

function clampInt(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(Math.max(Math.trunc(value) || 0, 0), max);
}

/**
 * A horizontal carousel built on native CSS scroll-snap — touch / trackpad
 * swipe come for free, arrow keys and the prev / next buttons drive `scrollTo`,
 * and the active page is derived from scroll position. No external dependency,
 * no autoplay, no looping (the arrows disable at the ends).
 *
 * `slidesPerView` + `gap` switch it from the full-bleed mobile carousel
 * (`slidesPerView={1}`) to a desktop row of cards that pages a view at a time.
 * Each child is one slide; give the viewport a height via `viewportClassName`.
 */
export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(function Carousel(
  {
    children,
    slidesPerView = 1,
    gap = 0,
    align,
    initialIndex = 0,
    onIndexChange,
    showArrows = true,
    showDots = true,
    thumbnails,
    thumbnailClassName,
    thumbnailsClassName,
    "aria-label": ariaLabel,
    className,
    viewportClassName,
    slideClassName,
    ...rest
  },
  ref,
) {
  const slides = Children.toArray(children).filter(isValidElement);
  const count = slides.length;
  const perView = Math.max(1, Math.floor(slidesPerView) || 1);
  const gapPx = Math.max(0, gap);
  const pageCount = Math.max(1, Math.ceil(count / perView));
  const snapAlign = align ?? (perView === 1 ? "center" : "start");

  const viewportRef = useRef<HTMLDivElement>(null);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(() => clampInt(Math.floor(clampInt(initialIndex, count - 1) / perView), pageCount - 1));
  const firstVisible = page * perView;

  const goToPage = useCallback(
    (next: number) => {
      const vp = viewportRef.current;
      if (!vp) return;
      const target = clampInt(next, pageCount - 1);
      // The last page may hold fewer slides than a full view, so aim past the
      // end and let the browser clamp — this lands exactly on the final slide.
      const left = target >= pageCount - 1 ? vp.scrollWidth : target * vp.clientWidth;
      vp.scrollTo({ left, behavior: "smooth" });
    },
    [pageCount],
  );

  // Derive the active page from scroll position (rAF-coalesced).
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!vp.clientWidth) return;
        // A short last page never reaches `(pageCount-1) * clientWidth`, so treat
        // "scrolled to the end" as the last page explicitly.
        const atEnd = vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 1;
        const next = atEnd
          ? pageCount - 1
          : clampInt(Math.round(vp.scrollLeft / vp.clientWidth), pageCount - 1);
        setPage((prev) => (prev === next ? prev : next));
      });
    };
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      vp.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pageCount]);

  useEffect(() => {
    onIndexChange?.(page * perView);
  }, [page, perView, onIndexChange]);

  // Keep the active thumbnail scrolled into view so the strip stays a compact
  // window (a few thumbs) that follows the selection instead of a long row.
  const hasThumbs = Boolean(thumbnails && thumbnails.length > 1);
  useEffect(() => {
    if (!hasThumbs) return;
    const active = thumbStripRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [firstVisible, hasThumbs]);

  // Jump to the requested first page once, without animating.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    vp.scrollLeft = clampInt(Math.floor(clampInt(initialIndex, count - 1) / perView), pageCount - 1) * vp.clientWidth;
    // Mount-only: later prop changes are intentionally ignored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPage(page - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goToPage(page + 1);
    }
  };

  if (count === 0) return null;

  const paged = pageCount > 1;
  const lastVisible = Math.min(firstVisible + perView, count) - 1;
  const thumbs = hasThumbs ? thumbnails!.slice(0, count) : null;

  // Soft-fade the thumbnail-strip edges so a thumb eases out of view as it
  // scrolls past the window — but drop the fade on whichever end the active
  // thumb has reached, so a selected first / last thumb stays crisp.
  const thumbMask: CSSProperties = {};
  if (thumbs && thumbs.length > 4) {
    const fadeL = firstVisible === 0 ? 0 : 18;
    const fadeR = lastVisible === count - 1 ? 0 : 18;
    const gradient = `linear-gradient(to right, transparent 0, #000 ${fadeL}px, #000 calc(100% - ${fadeR}px), transparent 100%)`;
    thumbMask.WebkitMaskImage = gradient;
    thumbMask.maskImage = gradient;
  }

  // Windowed dots — never render more than MAX_DOTS; the window slides with the
  // active page and the outermost dots on a truncated side shrink.
  const MAX_DOTS = 7;
  const dotWindow = Math.min(pageCount, MAX_DOTS);
  const dotStart = clampInt(page - Math.floor(MAX_DOTS / 2), Math.max(0, pageCount - dotWindow));
  const truncLeft = dotStart > 0;
  const truncRight = dotStart + dotWindow < pageCount;
  const trackStyle: CSSProperties | undefined = gapPx ? { columnGap: `${gapPx}px` } : undefined;
  const slideStyle: CSSProperties =
    perView === 1
      ? { flex: "0 0 100%" }
      : { flex: `0 0 calc((100% - ${(perView - 1) * gapPx}px) / ${perView})` };

  const arrowClass = cn(
    "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full",
    "border border-line bg-surface/90 text-ink shadow-sm backdrop-blur-sm transition-colors",
    "hover:text-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40",
    "disabled:cursor-not-allowed disabled:opacity-40",
  );

  return (
    <div ref={ref} className={cn("relative", className)} {...rest}>
      {/* Only the viewport is the positioning context for the arrows, so they
          sit at the vertical centre of the slides — not of viewport + dots. */}
      <div className="relative">
        <div
          ref={viewportRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={ariaLabel}
          tabIndex={0}
          onKeyDown={onKeyDown}
          style={trackStyle}
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "focus-visible:ring-2 focus-visible:ring-leaf/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            viewportClassName,
          )}
        >
          {slides.map((slide, i) => (
            <div
              // Slide order is stable; index keys are fine here.
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={(i < firstVisible || i > lastVisible) || undefined}
              style={slideStyle}
              className={cn(
                "min-w-0",
                snapAlign === "center" ? "snap-center" : "snap-start",
                slideClassName,
              )}
            >
              {slide}
            </div>
          ))}
        </div>

        {showArrows && paged ? (
          <>
            <button
              type="button"
              aria-label="Previous"
              disabled={page === 0}
              onClick={() => goToPage(page - 1)}
              className={cn(arrowClass, "left-2")}
            >
              <ChevronRightIcon className="size-5 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next"
              disabled={page >= pageCount - 1}
              onClick={() => goToPage(page + 1)}
              className={cn(arrowClass, "right-2")}
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </>
        ) : null}
      </div>

      {thumbs ? (
        <div
          ref={thumbStripRef}
          aria-label="Choose slide"
          style={thumbMask}
          className={cn(
            "mx-auto mt-3 flex w-fit max-w-[15rem] snap-x scroll-smooth gap-2 overflow-x-auto px-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            thumbnailsClassName,
          )}
        >
          {thumbs.map((src, i) => {
            const active = i >= firstVisible && i <= lastVisible;
            return (
              <button
                key={i}
                type="button"
                data-active={active || undefined}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={active || undefined}
                onClick={() => goToPage(Math.floor(i / perView))}
                className={cn(
                  "relative size-12 shrink-0 snap-center overflow-hidden rounded-gk-sm border-2 transition",
                  active ? "border-leaf opacity-100" : "border-transparent opacity-55 hover:opacity-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/40",
                  thumbnailClassName,
                )}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            );
          })}
        </div>
      ) : showDots && paged ? (
        <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="Choose page">
          {Array.from({ length: dotWindow }, (_, w) => {
            const i = dotStart + w;
            const fromLeftEdge = w;
            const fromRightEdge = dotWindow - 1 - w;
            const shrink =
              (truncLeft && fromLeftEdge === 0) || (truncRight && fromRightEdge === 0)
                ? "scale-[0.5]"
                : (truncLeft && fromLeftEdge === 1) || (truncRight && fromRightEdge === 1)
                  ? "scale-75"
                  : "";
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === page}
                aria-label={`Go to page ${i + 1}`}
                onClick={() => goToPage(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === page ? "w-4 bg-leaf" : "w-1.5 bg-line hover:bg-muted",
                  shrink,
                )}
              />
            );
          })}
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {perView === 1
          ? `Slide ${firstVisible + 1} of ${count}`
          : `Slides ${firstVisible + 1}–${lastVisible + 1} of ${count}`}
      </p>
    </div>
  );
});
