---
"@gramkick/ui": minor
---

Add a shared typography system and round out the design tokens.

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
