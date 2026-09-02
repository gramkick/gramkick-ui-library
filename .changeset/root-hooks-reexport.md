---
"@gramkick/ui": minor
---

The hooks (`useMediaQuery`, `useControllableState`, `useDebouncedValue`) are now
re-exported from the package root, so `import { useMediaQuery } from "@gramkick/ui"`
works alongside the existing `@gramkick/ui/hooks` subpath.
