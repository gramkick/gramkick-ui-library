# @gramkick/ui

Reusable React component library for the GramKick front-ends — design tokens,
accessible primitives, and styled components shared by the shell
(`gram-kick-web`) and the merchant / customer / dealer / admin SPAs.

- **React 19** (peer `^18 || ^19`), TypeScript, ESM-only
- **Tailwind CSS v4** tokens shipped as `@gramkick/ui/theme.css` (or a prebuilt
  `@gramkick/ui/styles.css` for apps without Tailwind)
- **Radix UI** primitives for behaviour + accessibility
- `class-variance-authority` + `tailwind-merge` for variants
- Built with **tsup**, documented with **Storybook**, tested with **Vitest +
  Testing Library**, released with **Changesets**

---

## Install

```bash
npm install @gramkick/ui
# peers, already present in every GramKick front-end:
npm install react react-dom
```

## Use it

### 1. Load the tokens once, at your app's CSS entry

**Tailwind v4 app** (merchant / customer / dealer / admin SPAs, the shell) — replace
the hand-copied `@theme { … }` block with:

```css
@import "tailwindcss";
@import "@gramkick/ui/theme.css";

/* let Tailwind see the utility classes the library ships */
@source "../node_modules/@gramkick/ui/dist";
```

**App without Tailwind** — import the prebuilt stylesheet instead:

```ts
import "@gramkick/ui/styles.css";
```

### 2. Import components

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@gramkick/ui";
import { useMediaQuery } from "@gramkick/ui/hooks";

export function MerchantRow() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sharma Kirana Store</CardTitle>
        <Badge variant="info">Pending</Badge>
      </CardHeader>
    </Card>
  );
}
```

`cn` (the `clsx` + `tailwind-merge` helper) is exported too:

```tsx
import { cn } from "@gramkick/ui";
```

## Components (initial set)

| Component                                              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                               | 6 variants × 4 sizes, `label` or `children`, `asChild`, `leftIcon` / `rightIcon`, `loading` + `loadingText` + `spinnerPlacement`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `Badge`                                                | status pills — 6 variants × 3 sizes (`sm \| md \| lg`), `label` or `children`, `leftIcon` / `rightIcon`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `Card` + `CardHeader/Title/Description/Content/Footer` | `variant` (`elevated \| raised \| outline \| ghost`) × `radius` (`none \| sm \| md \| lg \| xl`), `interactive`, `asChild`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `Input`                                                | `variant` (`outline \| filled`) × `size` (`sm \| md \| lg`), `label` / `hint` / `error` (node or text, `aria-describedby` + `aria-invalid` wired), `leftIcon` / `rightIcon` (right may be interactive), `invalid`, `disabled` + `readOnly` with hover suppressed, `containerClassName`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `Dropdown`                                             | from-scratch single / `multiple` select. Field API matches `Input` (`label` / `placeholder` / `hint` / `error` / `disabled` / `readOnly` / `invalid` / `variant` / `size`); single value is vertically centred. Options carry `label` / `subtext` / `tertiary` (right) / `icon` (left) — each a node — plus `disabled`; multi shows a checkbox per row, and `selectAll` adds a select-all row (acts on the filtered subset). `searchable` + `searchKeys` filter via an in-menu query box that moves below the list when the menu flips upward. Multi selections render as removable chips (`removable`) on one horizontally-scrollable, non-wrapping row, vertically centred; `clearable` ✕ on the field. Menu auto-flips upward when there's no room below. Full keyboard + ARIA combobox/listbox. `dropdownTriggerVariants` exported. |
| `Autosuggest`                                          | from-scratch typeahead, single / `multiple`. Same field API as `Dropdown`; type to get suggestions — local filter of `options` (`searchKeys` / `filterOption`) or async via `loadOptions` (race-safe) / `onSearch`. **Debounced** query, `debounce` ms configurable (default 250 async / 0 local); `minChars`, `loading` / `loadingMessage` / `emptyMessage` / `minCharsMessage`. Multi selections render as removable chips — **inside the field while blurred**, and in a row **at the bottom of the menu** while focused; input clears after each pick; Backspace on an empty input drops the last chip. `creatable` adds a bottom-of-menu row (own input + `createLabel` button, `onCreate` mapper) to add free-text entries not in the options. Menu auto-flips upward. `autosuggestFieldVariants` exported.                       |
| `Spinner`                                              | `sm \| md \| lg`, `role="status"`, respects reduced motion                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `Dialog`                                               | prop-driven (all optional): `trigger`, `icon` + `variant`, `title` / `subtext` / `description` (node or text), `titleStartIcon`, `actions` (list of `Button` props), `size` (`sm \| md \| lg \| xl \| full`), `showClose`, controlled `open`. **Responsive**: bottom sheet on phones (drag the handle down to dismiss — `dismissibleByDrag={false}` to disable), centered modal from `sm` up (`placement="center"` to force centered). Primitives still exported: `DialogRoot/Trigger/Content/Header/Footer/Title/Description/Close/Overlay`                                                                                                                                                                                                                                                                                            |

Hooks (`@gramkick/ui/hooks`): `useMediaQuery`, `useControllableState`, `useDebouncedValue`.

Roadmap: `Label`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Tabs`,
`Tooltip`, `Popover`, `DropdownMenu`, `Toast`, `Skeleton`, `Table`, `Pagination`,
`Breadcrumb`, `Sheet/Drawer`, `Avatar`, `Alert`.

---

## Develop

```bash
nvm use                 # Node 20
npm install

npm run storybook       # component workbench at http://localhost:6006
npm run dev             # tsup watch build into dist/
npm test                # vitest run   (npm run test:watch to iterate)
npm run lint
npm run typecheck
npm run build           # dist/index.js + dist/hooks/index.js + .d.ts + styles.css + theme.css
```

### Add a component

1. `src/components/<name>/` with `<name>.tsx`, `<name>.stories.tsx`,
   `<name>.test.tsx`, `index.ts`.
2. `forwardRef`, spread `...props`, merge incoming `className` last via `cn(...)`.
3. Variants via `cva`; export the `xxxVariants` fn and a `XxxProps` type.
4. Style with **token classes only** (`bg-leaf`, `text-ink`, `border-line`,
   `rounded-gk-md`, `shadow-card`, …) — no raw hex.
5. Re-export from `src/index.ts`.
6. `npm run changeset` to record the change.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full checklist.

## Release

Automated via Changesets. Every PR that changes shipped code adds a changeset;
merging to `main` opens a **Version Packages** PR, and merging that publishes
`@gramkick/ui` to npm (needs the `NPM_TOKEN` repo secret).

## Consuming before the first npm publish

Point a front-end at the local checkout:

```jsonc
// <frontend>/package.json
"dependencies": {
  "@gramkick/ui": "file:../gramkick-ui-library"
}
```

Run `npm run build` here first (the consumer reads `dist/`).
