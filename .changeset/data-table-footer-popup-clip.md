---
"@gramkick/ui": patch
---

`DataTable` no longer clips its footer. The rounded-corner `overflow-hidden` was
on the outer card, which cut off the footer's page-size menu when the table had
only a row or two. Corner-clipping now lives on an inner wrapper that stops above
the footer, so the "rows per page" dropdown can open past the card edge.
