---
"@gramkick/ui": minor
---

`TabsTrigger` gains `asChild` — render the child element (typically a router
`<Link>`) instead of a `<button>`, so `Tabs` can style a real navigation: each
tab stays a proper `<a href>` (middle-click, SEO, `aria-current`) while keeping
the tablist look, roving tabindex and arrow-key movement. `icon` / `badge` are
not injected in `asChild` mode.
