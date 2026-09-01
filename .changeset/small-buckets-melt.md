---
"@gramkick/ui": patch
---

Shrink the published package. Source maps are no longer shipped, the runtime
bundle is minified, and the long component reference moved from `README.md` to
`docs/COMPONENTS.md` (not in the tarball) — leaving a short README. Tarball drops
from ~257 kB to ~75 kB (unpacked 1.2 MB → ~330 kB). No API or behaviour change;
`.d.ts` types with JSDoc are unchanged.
