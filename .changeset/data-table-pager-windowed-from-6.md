---
"@gramkick/ui": patch
---

`DataTable` pagination: the windowed page list (`1 2 … 4 … 5 6`) now kicks in
from **6** pages instead of 8. Up to 5 pages every number is still shown in
full; `pageRange(current, count)` is the only change.
