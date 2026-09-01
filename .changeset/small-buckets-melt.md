---
"@gramkick/ui": patch
---

Shrink the published package. Source maps are no longer shipped and the runtime
bundle is minified, cutting the tarball from ~257 kB to ~103 kB (unpacked 1.2 MB
→ ~409 kB). No API or behaviour change; `.d.ts` types (with JSDoc) are unchanged.
