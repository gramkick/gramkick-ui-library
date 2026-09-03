---
"@gramkick/ui": minor
---

`Carousel` gains `slidesPerView`, `gap`, and `align` props. `slidesPerView={1}`
(default) keeps the full-bleed, one-at-a-time mobile carousel; `slidesPerView`
of 2–5 with a `gap` turns it into a desktop "row of cards" that pages a full
view at a time — dots are now one per page, and the live region reads a slide
range. Fully backward compatible.
