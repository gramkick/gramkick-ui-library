# @gramkick/ui

## 0.3.0

### Minor Changes

- 9cefef4: New `Accordion` component — a data-driven disclosure list (`items` of
  `value` / `title` / `content`, optional `icon` / `disabled`). `type`
  (`single` | `multiple`), `variant` (`separated` | `contained` | `ghost`) and
  `size` (`sm` | `md` | `lg`) follow the same cva pattern as the rest of the kit;
  open state is controllable via `value` / `defaultValue` / `onValueChange`, and
  `collapsible` (single mode) lets the open item close on re-click. Panels animate
  open with a `grid-template-rows` transition — no height measuring, no
  dependency. Full ARIA wiring (`aria-expanded` / `aria-controls` /
  `role="region"`).
- 9aa013c: `Autosuggest` gains a `leftIcon` prop — a node (typically a search icon) rendered
  inside the field, before the input. Matches `Input` / `Dropdown`.
- 9cefef4: `Button` gains an `outline-brand` variant — an outlined button in the brand
  leaf colour (`border-leaf` + `text-leaf`, `hover:bg-mint`). Pairs with the
  filled `primary` for secondary calls-to-action that still need to read as
  on-brand, e.g. an "Add" button that sits beside a leaf-coloured quantity
  stepper.
- 9cefef4: `Button` gains an `outline-danger` variant — an outlined destructive button
  (`border-danger` + `text-danger` on a plain background, `hover:bg-danger/10`),
  the danger counterpart of `outline` / `outline-brand`. For destructive-but-not-
  primary actions like "Log out" and a "Delete account" trigger, where the solid
  `danger` variant is reserved for the final confirm.
- 9cefef4: New `Carousel` component — a horizontal, one-slide-at-a-time gallery built on
  native CSS scroll-snap (no external dependency). Touch / trackpad swipe work by
  default; arrow keys and the prev / next overlay buttons drive `scrollTo`; the
  active slide is derived from scroll position and surfaced via dot indicators and
  an `aria-live` count. One child per slide, height set through `viewportClassName`.
  Built for customer-facing product image galleries.
- 9cefef4: `Carousel` gains `slidesPerView`, `gap`, and `align` props. `slidesPerView={1}`
  (default) keeps the full-bleed, one-at-a-time mobile carousel; `slidesPerView`
  of 2–5 with a `gap` turns it into a desktop "row of cards" that pages a full
  view at a time — dots are now one per page, and the live region reads a slide
  range. Fully backward compatible.
- 9cefef4: `Carousel` navigation is now modern-carousel shaped:

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

- d805a03: `Dropdown` gains a `leftIcon` prop — a node rendered inside the trigger before
  the value (mirrors `Input`'s `leftIcon`). Used for compact selects like a
  language switcher where the icon belongs in the field, not beside it.
- 8c9e326: Four new icons: `FileTextIcon` (document), `UploadCloudIcon` (cloud upload),
  `CameraIcon`, `BriefcaseIcon`. Brings the set to 105. Covers the merchant
  onboarding / document glyphs so consumers can drop their bespoke icon sets.
- d805a03: Add `GlobeIcon` and `TrendUpIcon` to the icon set (97 total). Both were
  hand-duplicated across the GramKick front-ends (language switcher, landing
  footer, dashboard growth stats) and now ship from `@gramkick/ui` /
  `@gramkick/ui/icons` with the shared `createIcon` prop contract.
- d805a03: Add `GramKickIcon` — the GramKick brand mark (a "G" ring open at the lower right
  with an inward crossbar), 100 icons total. Monochrome / `currentColor` like every
  other icon, so it works inline anywhere and, set in white on a `leaf` →
  `leaf-dark` square, as an app-icon / favicon.
- 9aa013c: `Input` gains a `multiline` prop — it renders a vertically-resizable
  `<textarea>` instead of an `<input>`, keeping the same label / hint / error
  chrome, `allowPattern` filtering and `size` / `variant` styling. `rows` sets the
  height; the icon slots and `left` / `rightSelect` addons are ignored in this
  mode. `onChange`'s event target is now typed `HTMLInputElement | HTMLTextAreaElement`.
- d805a03: Add `LeafIcon` and `BarChartIcon` (99 icons total). These replace the last
  hand-drawn glyphs in the webapp's landing `FeatureIcon` composite — `leaf`
  (fresh / local produce) and `analytics` — so every landing-page icon now comes
  from `@gramkick/ui/icons`.
- 9aa013c: `MenuButton` now **flips upward** when the menu would overflow the bottom of the
  viewport (it measures the menu after it mounts and re-places above the trigger
  when there's more room there), and it caps its own height with a scroll so it
  never runs off-screen. `data-placement="top" | "bottom"` is exposed on the
  portalled menu.

  `MenuButton` also renders its rows through `ListItems` (`role="menu"`) instead of
  a hand-rolled list, so an action menu and a `Dropdown`/`ListItems` list now look
  identical.

  `ListItems` gains:

  - `role` — `"listbox"` (default) or `"menu"` (rows become `role="menuitem"`, no
    selected state / `aria-multiselectable`).
  - `destructive` per option — red row styling for "Delete"-type actions.
  - `separated` per option — a divider above the row.

  `DropdownOption` carries the new optional `destructive` / `separated` flags
  (ignored by `Dropdown` itself; honoured by `ListItems` and `MenuButton`).

- c54c708: New `PauseIcon` — two vertical bars, the outline counterpart to a play glyph.
  Added for "pause / put on hold" actions (the admin console uses it on account
  moderation controls). Registered in `icons/index.ts` like every other icon.
- 76ce6e5: New icon: `ReplaceIcon` — a two-arrow swap glyph for "replace this / swap out"
  actions (e.g. replacing an uploaded image). Brings the set to 101 icons.
- 6cd90db: The hooks (`useMediaQuery`, `useControllableState`, `useDebouncedValue`) are now
  re-exported from the package root, so `import { useMediaQuery } from "@gramkick/ui"`
  works alongside the existing `@gramkick/ui/hooks` subpath.
- d805a03: `TabsTrigger` gains `asChild` — render the child element (typically a router
  `<Link>`) instead of a `<button>`, so `Tabs` can style a real navigation: each
  tab stays a proper `<a href>` (middle-click, SEO, `aria-current`) while keeping
  the tablist look, roving tabindex and arrow-key movement. `icon` / `badge` are
  not injected in `asChild` mode.

### Patch Changes

- 6cd90db: `Button` with `asChild` now reflects `loading`: the slotted element gets
  `aria-busy` / `aria-disabled` / `data-loading` and becomes non-interactive
  (`pointer-events-none`, dimmed). No spinner is injected (Radix `Slot` renders the
  child as-is) — render one in the child if you need the visual.
- 9aa013c: `DataTable` no longer clips its footer. The rounded-corner `overflow-hidden` was
  on the outer card, which cut off the footer's page-size menu when the table had
  only a row or two. Corner-clipping now lives on an inner wrapper that stops above
  the footer, so the "rows per page" dropdown can open past the card edge.
- 25fde58: `Steps` (horizontal): the connector track now spans the full component width.
  The first and last steps get half-width columns aligned to the outer edges
  (circle + label hug the start / end), so there's no dead space on the ends of
  the progress line. Vertical orientation and the strength-track mode are
  unchanged.

## 0.2.0

### Minor Changes

- 75c43ea: Initial release: design tokens (`theme.css` / prebuilt `styles.css`), `cn` helper,
  `useMediaQuery` / `useControllableState` hooks, and the first components —
  `Button`, `Badge`, `Card`, `Input`, `Spinner`, and a Radix-based `Dialog`.
- dd44b45: Add a shared typography system and round out the design tokens.

  **Typography** — new `Text` and `Heading` components plus a `textVariants` cva
  covering every text role (`display`, `h1`–`h6`, `body` / `body-lg` / `body-sm`,
  `caption`, `overline`, `label`, and `price` / `price-original` for e-commerce),
  with `as` / `asChild`, `weight`, `tone`, `align`, `truncate` and `lineClamp`. The
  scale ships as Tailwind tokens (`text-display`, `text-h1` … `text-h6`,
  `text-body`, `text-caption`, `text-overline`, `text-label`, `text-price`); `h1`–
  `h3` and `display` are fluid (`clamp`). The default font family is now **Inter**
  (`--font-sans`, with a system fallback stack), and `--font-display` tracks
  `--font-sans`. Apps load the Inter webfont themselves.

  **Tokens** — expanded and documented for reuse across the portals:

  - Radius: added `rounded-gk-xs`, `rounded-gk-2xl`, `rounded-gk-full` to the
    existing `sm`–`xl` scale.
  - Border: new `--color-line-strong` (`border-line-strong`) for emphasised
    rules/outlines, plus `--gk-border` / `--gk-border-strong` shorthands for
    hand-written CSS.
  - Elevation: new neutral ladder `shadow-gk-xs` … `shadow-gk-xl`; the semantic
    `shadow-card` / `shadow-art` / `shadow-modal` are unchanged.

  The prebuilt `styles.css` now force-includes the full token surface, so apps
  without their own Tailwind build get every token as a utility.

### Patch Changes

- 3524f3c: publish first npm package
- 812f365: Shrink the published package. Source maps are no longer shipped, the runtime
  bundle is minified, and the long component reference moved from `README.md` to
  `docs/COMPONENTS.md` (not in the tarball) — leaving a short README. Tarball drops
  from ~257 kB to ~75 kB (unpacked 1.2 MB → ~330 kB). No API or behaviour change;
  `.d.ts` types with JSDoc are unchanged.
