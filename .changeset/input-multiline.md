---
"@gramkick/ui": minor
---

`Input` gains a `multiline` prop — it renders a vertically-resizable
`<textarea>` instead of an `<input>`, keeping the same label / hint / error
chrome, `allowPattern` filtering and `size` / `variant` styling. `rows` sets the
height; the icon slots and `left` / `rightSelect` addons are ignored in this
mode. `onChange`'s event target is now typed `HTMLInputElement | HTMLTextAreaElement`.
