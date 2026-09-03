---
"@gramkick/ui": minor
---

`Carousel` navigation is now modern-carousel shaped:

- `thumbnails` prop (image srcs, one per slide) swaps the dots for a compact,
  scrollable thumbnail strip — capped to a ~4-thumb window (`max-w-[15rem]`,
  overridable via `thumbnailsClassName`) that auto-scrolls to keep the active
  thumb centred, instead of a long row of every thumbnail. When the strip
  overflows, its edges soft-fade (mask gradient) so a thumbnail eases out of
  view as it scrolls past the window rather than clipping hard — the fade is
  dropped on whichever end the active thumb has reached, so a selected first /
  last thumbnail stays crisp. Per-button classes via `thumbnailClassName`.
- Dots are windowed — at most 7 render at once; the window slides with the
  active page and the outermost dots on a truncated side shrink.
- Fixed: a last page holding fewer slides than `slidesPerView` now activates its
  dot / thumbnail (scroll-to-end snaps to the final page; "Next" lands exactly
  on the last slide).
- Fixed: the prev / next buttons are now vertically centred on the slides, not
  on the slides-plus-dots box (they only position against the viewport).
