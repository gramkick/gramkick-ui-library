---
"@gramkick/ui": minor
---

New `Carousel` component — a horizontal, one-slide-at-a-time gallery built on
native CSS scroll-snap (no external dependency). Touch / trackpad swipe work by
default; arrow keys and the prev / next overlay buttons drive `scrollTo`; the
active slide is derived from scroll position and surfaced via dot indicators and
an `aria-live` count. One child per slide, height set through `viewportClassName`.
Built for customer-facing product image galleries.
