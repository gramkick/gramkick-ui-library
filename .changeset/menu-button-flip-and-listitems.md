---
"@gramkick/ui": minor
---

`MenuButton` now **flips upward** when the menu would overflow the bottom of the
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
