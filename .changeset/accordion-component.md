---
"@gramkick/ui": minor
---

New `Accordion` component — a data-driven disclosure list (`items` of
`value` / `title` / `content`, optional `icon` / `disabled`). `type`
(`single` | `multiple`), `variant` (`separated` | `contained` | `ghost`) and
`size` (`sm` | `md` | `lg`) follow the same cva pattern as the rest of the kit;
open state is controllable via `value` / `defaultValue` / `onValueChange`, and
`collapsible` (single mode) lets the open item close on re-click. Panels animate
open with a `grid-template-rows` transition — no height measuring, no
dependency. Full ARIA wiring (`aria-expanded` / `aria-controls` /
`role="region"`).
