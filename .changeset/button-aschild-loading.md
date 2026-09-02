---
"@gramkick/ui": patch
---

`Button` with `asChild` now reflects `loading`: the slotted element gets
`aria-busy` / `aria-disabled` / `data-loading` and becomes non-interactive
(`pointer-events-none`, dimmed). No spinner is injected (Radix `Slot` renders the
child as-is) — render one in the child if you need the visual.
