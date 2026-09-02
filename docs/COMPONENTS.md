# @gramkick/ui — component reference

The full API for every component, plus icons, typography, and design tokens.
For install and setup see the [README](../README.md); run `npm run storybook`
for the interactive version.

---

## Contents

- [Install](#install)
- [Use it](#use-it)
- [Component index](#component-index)
- [Icons](#icons)
- [Typography](#typography)
- [Design tokens](#design-tokens)
- [Components](#components)
  - Layout & content: [Card](#card) · [Badge](#badge) · [EmptyState](#emptystate)
    · [Skeleton](#skeleton) · [Spinner](#spinner) · [Steps](#steps)
  - Actions & navigation: [Button](#button) · [MenuButton](#menubutton) ·
    [Tabs](#tabs) · [ListItems](#listitems)
  - Forms & inputs: [Input](#input) · [Dropdown](#dropdown) ·
    [Autosuggest](#autosuggest) · [Checkbox / Radio / groups](#checkbox--radio--groups)
    · [Switch](#switch) · [FileUpload](#fileupload)
  - Date & time: [Calendar](#calendar) · [DatePicker](#datepicker) ·
    [DateRangePicker](#daterangepicker) · [TimePicker](#timepicker) ·
    [DropdownRangePicker](#dropdownrangepicker)
  - Overlays & feedback: [Dialog](#dialog) · [Tooltip](#tooltip) · [Toast](#toast)
  - Data: [DataTable](#datatable)
- [Hooks](#hooks)
- [Develop](#develop)
- [Release](#release)

---

## Install

```bash
npm install @gramkick/ui
# peers, already present in every GramKick front-end:
npm install react react-dom
```

## Use it

### 1. Load the tokens once, at your app's CSS entry

**Tailwind v4 app** (merchant / customer / dealer / admin SPAs, the shell) —
replace the hand-copied `@theme { … }` block with:

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

### 2. Load the Inter webfont

The library sets `--font-sans` to Inter with a system fallback stack, but each app
loads the font file itself — Google Fonts, a self-hosted `@font-face`, or
`next/font`. Until it is loaded, text falls back to the system UI font.

### 3. Import components

```tsx
import { Button, Card, CardHeader, CardTitle, Badge, DataTable, Text } from "@gramkick/ui";
import { useMediaQuery } from "@gramkick/ui/hooks";
// icons ship from the root and from a dedicated entry:
import { ShoppingCartIcon, TruckIcon } from "@gramkick/ui/icons";

export function MerchantRow() {
  return (
    <Card interactive>
      <CardHeader>
        <CardTitle>Sharma Kirana Store</CardTitle>
        <Badge variant="info">Pending</Badge>
      </CardHeader>
    </Card>
  );
}
```

The `cn` helper (`clsx` + `tailwind-merge`) and the `DateRange` type are exported
from the root too:

```tsx
import { cn, type DateRange } from "@gramkick/ui";
```

### Conventions shared by every component

- **`variant` × `size`** — most components take a `variant` (visual style) and a
  `size` (`sm` | `md` | `lg`). The `xxxVariants` cva function is exported so you
  can reuse the classes on your own elements.
- **`className` always wins** — your classes are merged last, so
  `className="rounded-none"` overrides the component's own radius.
- **`forwardRef`** — refs reach the underlying DOM node.
- **Controlled or uncontrolled** — anything stateful accepts both
  `value` + `onChange` (controlled) and `defaultValue` (uncontrolled).
- **Field pattern** — form controls (`Input`, `Dropdown`, `Autosuggest`,
  `FileUpload`, the date/time pickers) share `label` / `hint` / `error` /
  `invalid` / `disabled` / `readOnly` / `required`, with `aria-describedby` and
  `aria-invalid` wired up for you.

---

## Component index

| Component                                                                         | What it is                                                                         |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`Button`](#button)                                                               | Primary action. 6 variants, icon slots, loading state, `asChild`.                  |
| [`MenuButton`](#menubutton)                                                       | A `Button` that opens a keyboard-navigable action menu.                            |
| [`Badge`](#badge)                                                                 | Status pill — 6 tones × 3 sizes, optional icons.                                   |
| [`Card`](#card) + parts                                                           | Surface container + `CardHeader` / `Title` / `Description` / `Content` / `Footer`. |
| [`EmptyState`](#emptystate)                                                       | Placeholder for empty / error / no-results regions.                                |
| [`Skeleton`](#skeleton)                                                           | Loading placeholder — text / rounded / rect / circle, pulse or shimmer.            |
| [`Spinner`](#spinner)                                                             | Indeterminate loading indicator.                                                   |
| [`Steps`](#steps)                                                                 | Progress stepper, or a segmented strength / completion track.                      |
| [`Text` / `Heading`](#typography)                                                 | One primitive for every text role (see [Typography](#typography)).                 |
| [`Input`](#input)                                                                 | Text field with icons, edge selects, keystroke filtering.                          |
| [`Dropdown`](#dropdown)                                                           | From-scratch single / multi select, searchable, groupable.                         |
| [`ListItems`](#listitems)                                                         | The `Dropdown` option list on its own, in a card.                                  |
| [`Autosuggest`](#autosuggest)                                                     | Typeahead with async loading, multi-select, create-new.                            |
| [`Checkbox` / `Radio`](#checkbox--radio--groups) + `CheckboxGroup` / `RadioGroup` | Selection controls, 4 tones × 3 sizes.                                             |
| [`Switch`](#switch)                                                               | On/off toggle, native `<input role="switch">`.                                     |
| [`FileUpload`](#fileupload)                                                       | File picker + drop zone, 3 variants, preview + reject rules.                       |
| [`Calendar`](#calendar)                                                           | Month grid — the primitive behind the date pickers.                                |
| [`DatePicker`](#datepicker)                                                       | Single-date field + calendar popover.                                              |
| [`DateRangePicker`](#daterangepicker)                                             | Start/end field + two-month range calendar, presets.                               |
| [`TimePicker`](#timepicker)                                                       | Time field + column picker popover.                                                |
| [`DropdownRangePicker`](#dropdownrangepicker)                                     | Range field whose popover is a preset list + custom range.                         |
| [`Tabs`](#tabs) + parts                                                           | Tabbed navigation — 4 variants, data or composed API.                              |
| [`Dialog`](#dialog) + primitives                                                  | Prop-driven dialog (responsive sheet/modal) + Radix primitives.                    |
| [`Tooltip`](#tooltip)                                                             | Hover / focus / click tooltip, auto-flipping, rich content.                        |
| [`Toast`](#toast) (`ToastMessenger` / `useToast` / `ToastProvider`)               | Imperative toasts, callable anywhere.                                              |
| [`DataTable`](#datatable)                                                         | Sortable, selectable, paginated, responsive table.                                 |
| [Icons](#icons)                                                                   | 100 tree-shakeable SVG icons + `createIcon` (incl. the `GramKickIcon` brand mark).                                        |

---

## Icons

100 SVG icons, each built with `createIcon` so they share one prop contract.
Colour flows from `currentColor`, so `text-*` utilities tint them.

```tsx
import { ShoppingCartIcon, TruckIcon, RupeeIcon } from "@gramkick/ui/icons";
// also available from the root: import { ShoppingCartIcon } from "@gramkick/ui";

<ShoppingCartIcon />                       {/* 24px, inherits text colour */}
<TruckIcon size={20} />                    {/* pixel size (number or CSS length) */}
<RupeeIcon className="text-leaf" />        {/* tint with a token class */}
<TruckIcon size={32} strokeWidth={1.5} /> {/* thinner stroke */}
<ShoppingCartIcon color="#b42318" />      {/* explicit colour */}
```

### Icon props

| Prop            | Type               | Notes                                                              |
| --------------- | ------------------ | ------------------------------------------------------------------ |
| `size`          | `number \| string` | Width **and** height. Number → px. Default `24`.                   |
| `color`         | `string`           | Sets `currentColor`. Prefer a `text-*` class instead.              |
| `strokeWidth`   | `number \| string` | Stroke-based icons only. Default `2`.                              |
| `title`         | `string`           | Adds `<title>` + `role="img"` for a labelled, non-decorative icon. |
| …any `SVGProps` |                    | `className`, `onClick`, `aria-hidden`, `focusable`, …              |

Decorative icons (most of them) need no label — they render `aria-hidden`. Only
pass `title` when the icon is the sole content of a control.

### Using them in components

Every component with an icon slot (`leftIcon`, `rightIcon`, `icon`, …) auto-sizes
the SVG, so pass the element without a `size`:

```tsx
<Button leftIcon={<PlusIcon />}>Add product</Button>
<Badge variant="success" leftIcon={<CheckIcon />}>Paid</Badge>
<Input leftIcon={<SearchIcon />} placeholder="Search orders" />
```

### The `icons` namespace

For icon pickers or dynamic lookups, import the whole set as one object plus the
`IconName` union:

```tsx
import { icons, type IconName } from "@gramkick/ui/icons";

const name: IconName = "TruckIcon";
const Icon = icons[name];
<Icon size={28} />;

// render a grid of every icon
Object.entries(icons).map(([id, Glyph]) => <Glyph key={id} />);
```

### Custom icons

```tsx
import { createIcon } from "@gramkick/ui/icons";

export const SprocketIcon = createIcon(
  "SprocketIcon",
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </>,
);
```

The children are raw SVG (`<path>`, `<circle>`, …) on a `0 0 24 24` viewBox;
`createIcon` supplies the `<svg>` wrapper and the shared props.

---

## Typography

One shared type scale across every portal. `Text` is the primitive for every
piece of text; `Heading` is semantic sugar over it.

```tsx
import { Text, Heading } from "@gramkick/ui";

<Text variant="overline" tone="brand">New in</Text>
<Heading level={1}>Fresh produce, delivered</Heading>
<Text variant="body-lg">Everything your kirana needs, restocked by tomorrow.</Text>
<Text as="h3" variant="h4" lineClamp={2}>{product.name}</Text>
<Text variant="price">₹1,299</Text> <Text variant="price-original">₹1,999</Text>
```

### `Text` props

| Prop        | Values                                                                                                                 | Notes                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `variant`   | `display` · `h1`–`h6` · `body-lg` · `body` · `body-sm` · `caption` · `overline` · `label` · `price` · `price-original` | Size + line-height + tracking + default weight. Default `body`.    |
| `as`        | any tag / component                                                                                                    | Change the element, keep the look. Default `p`.                    |
| `asChild`   | `boolean`                                                                                                              | Style an existing child element instead (a link, a Radix trigger). |
| `tone`      | `default` · `muted` · `brand` · `danger` · `inverted` · `inherit`                                                      | Colour. `inverted` = `text-canvas` for dark backgrounds.           |
| `weight`    | `normal` · `medium` · `semibold` · `bold`                                                                              | Overrides the variant's default weight.                            |
| `align`     | `left` · `center` · `right`                                                                                            |                                                                    |
| `truncate`  | `boolean`                                                                                                              | Single-line ellipsis.                                              |
| `lineClamp` | `number`                                                                                                               | Clamp to N lines with an ellipsis (product titles, descriptions).  |

### `Heading` props

| Prop                                                                      | Values                | Notes                                                                      |
| ------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| `level`                                                                   | `1`–`6`               | Renders `<h1>`–`<h6>` and the matching size. Default `2`.                  |
| `variant`                                                                 | `display` · `h1`–`h6` | Visual size, independent of `level` — e.g. an `<h2>` that looks like `h4`. |
| …plus `tone` / `weight` / `align` / `truncate` / `lineClamp` from `Text`. |                       |                                                                            |

### The scale

| Role             | Utility               | Use                                                            |
| ---------------- | --------------------- | -------------------------------------------------------------- |
| `display`        | `text-display`        | Campaign / hero headline (one per view, fluid)                 |
| `h1`–`h6`        | `text-h1` … `text-h6` | Document headings; `h1`–`h3` and `display` are fluid (`clamp`) |
| `body-lg`        | `text-body-lg`        | Lead paragraph, PDP intro                                      |
| `body`           | `text-body`           | Default running text                                           |
| `body-sm`        | `text-body-sm`        | Dense UI, list meta, table cells                               |
| `caption`        | `text-caption`        | Helper text, timestamps, fine print                            |
| `overline`       | `text-overline`       | Eyebrow / kicker label (uppercase, tracked)                    |
| `label`          | `text-label`          | Form labels, tabs, chips                                       |
| `price`          | `text-price`          | Current selling price (bold, tabular figures)                  |
| `price-original` | —                     | Struck-through was / MRP price beside `price`                  |

The utilities work on their own too — `<span className="text-h4">` — and
`textVariants({ variant, tone })` returns the class string for arbitrary markup.

### Recipes

**Product card heading + price**

```tsx
<Text variant="overline" tone="muted">Cold pressed oils</Text>
<Text as="h3" variant="h4" lineClamp={2}>Organic Groundnut Oil — 5 L Tin</Text>
<div className="flex items-baseline gap-2">
  <Text variant="price">₹1,120</Text>
  <Text variant="price-original">₹1,400</Text>
  <Text variant="label" tone="brand">20% off</Text>
</div>
```

**On a dark hero**

```tsx
<div className="bg-ink p-6">
  <Text variant="overline" tone="inverted">
    Limited time
  </Text>
  <Heading level={2} className="text-canvas">
    Monsoon sale — up to 50% off
  </Heading>
  <Text variant="body" tone="inverted" className="opacity-80">
    Ends Sunday.
  </Text>
</div>
```

**Correct outline, tighter look**

```tsx
{
  /* stays an <h2> in the document outline, renders at h4 size */
}
<Heading level={2} variant="h4">
  Payout summary
</Heading>;
```

---

## Design tokens

Every token is a Tailwind v4 `@theme` variable in `@gramkick/ui/theme.css` (also
baked into the prebuilt `styles.css`). Use the utility, the CSS variable, or both.

### Color

| Utility root                                    | Variable                               | Use                          |
| ----------------------------------------------- | -------------------------------------- | ---------------------------- |
| `ink`                                           | `--color-ink`                          | Primary text                 |
| `muted`                                         | `--color-muted`                        | Secondary text               |
| `line` / `line-strong`                          | `--color-line` / `--color-line-strong` | Default / emphasised borders |
| `canvas` / `surface`                            | `--color-canvas` / `--color-surface`   | Page / raised surface        |
| `mint` `leaf` `leaf-dark` `lime` `art` `sun`    | `--color-*`                            | Brand (warm saffron / green) |
| `danger` `brand-blue` `soft-blue` `soft-yellow` | `--color-*`                            | Accents / status             |

Every name works with `bg-`, `text-`, `border-`, `ring-`, … (`bg-leaf`,
`text-muted`, `border-line-strong`).

### Radius — `rounded-gk-*`

`gk-` prefixed so they never collide with a consumer's own `--radius-*` scale.

| Utility           | Variable           | Value         |
| ----------------- | ------------------ | ------------- |
| `rounded-gk-xs`   | `--radius-gk-xs`   | 4px           |
| `rounded-gk-sm`   | `--radius-gk-sm`   | 6px           |
| `rounded-gk-md`   | `--radius-gk-md`   | 10px          |
| `rounded-gk-lg`   | `--radius-gk-lg`   | 16px          |
| `rounded-gk-xl`   | `--radius-gk-xl`   | 24px          |
| `rounded-gk-2xl`  | `--radius-gk-2xl`  | 32px          |
| `rounded-gk-full` | `--radius-gk-full` | pill / circle |

### Border

Width stays on Tailwind's own `border` / `border-2`; the token is the colour.

| Utility              | Variable              | Use                                                  |
| -------------------- | --------------------- | ---------------------------------------------------- |
| `border-line`        | `--color-line`        | Default divider / control border                     |
| `border-line-strong` | `--color-line-strong` | Emphasised rule, input outline                       |
| —                    | `--gk-border`         | `1px solid var(--color-line)` — for hand-written CSS |
| —                    | `--gk-border-strong`  | `1px solid var(--color-line-strong)`                 |

### Elevation

| Utility                         | Variable                            | Use                        |
| ------------------------------- | ----------------------------------- | -------------------------- |
| `shadow-gk-xs` … `shadow-gk-xl` | `--shadow-gk-xs` … `--shadow-gk-xl` | General elevation, xs → xl |
| `shadow-card`                   | `--shadow-card`                     | Resting card               |
| `shadow-art`                    | `--shadow-art`                      | Raised / hover card        |
| `shadow-modal`                  | `--shadow-modal`                    | Dialogs, popovers, menus   |

```tsx
<div className="rounded-gk-2xl border border-line-strong shadow-gk-md">…</div>
```

---

## Components

Every example assumes `import { … } from "@gramkick/ui"`.

---

### Button

The primary action element. `variant` × `size`, icon slots, a built-in loading
state, and `asChild` for rendering a link/router element with button styling.

**Props**

- `variant` — `primary` (default) · `secondary` · `outline` · `ghost` · `danger` · `link`
- `size` — `sm` · `md` (default) · `lg` · `icon` (square, for an icon-only button)
- `label` — text alternative to `children` (`children` wins)
- `leftIcon` / `rightIcon` — decorative slots, SVGs auto-sized
- `loading` — swaps content for a spinner, disables the button, sets `aria-busy`
- `loadingText` — text shown next to the spinner while loading
- `spinnerPlacement` — `start` (default) · `end`, when `loadingText` is set
- `asChild` — render the child element instead (icon/loading props then no-op)
- …all native `<button>` attributes (`type` defaults to `"button"`)

**Examples**

```tsx
{/* variants */}
<Button>Save</Button>
<Button variant="secondary">Save draft</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Dismiss</Button>
<Button variant="danger">Delete store</Button>
<Button variant="link">Learn more</Button>
```

```tsx
{/* sizes + icons */}
<Button size="sm" leftIcon={<PlusIcon />}>Add</Button>
<Button size="lg" rightIcon={<ArrowRightIcon />}>Continue</Button>
<Button size="icon" aria-label="Filter"><FilterIcon /></Button>
```

```tsx
{
  /* loading — keeps its width, stays labelled for screen readers */
}
<Button loading>Save</Button>;
{
  /* loading with visible text */
}
<Button loading loadingText="Saving…">
  Save
</Button>;
```

```tsx
{
  /* as a link / router element */
}
<Button asChild>
  <a href="/merchants/new">New merchant</a>
</Button>;
```

---

### MenuButton

A `Button` that opens a list of actions in a `document.body` portal (escapes any
`overflow` container). Full keyboard support (↑/↓/Home/End/Enter/Esc).

**Props**

- `label` — trigger text (a trailing chevron flips while open)
- `items` — `MenuButtonItem[]`: `{ label, onSelect?, icon?, disabled?, destructive?, separated? }`
  - `destructive` — red styling for "Delete"-type rows
  - `separated` — draw a divider above the row
- `variant` / `size` — any `buttonVariants` value
- `leftIcon` — icon before the label
- `align` — `start` (default) · `end` — which trigger edge the menu lines up with
- `openOnHover` — also open on mouse hover
- `onOpenChange(open)` — open/close callback
- `menuClassName` — extra classes for the portalled list

**Examples**

```tsx
<MenuButton
  label="Actions"
  variant="outline"
  items={[
    { label: "Edit", icon: <PencilIcon />, onSelect: () => edit(order) },
    { label: "Duplicate", icon: <CopyIcon />, onSelect: () => duplicate(order) },
    { label: "Print invoice", icon: <PrinterIcon />, onSelect: () => print(order) },
    {
      label: "Cancel order",
      icon: <TrashIcon />,
      destructive: true,
      separated: true,
      onSelect: () => cancel(order),
    },
  ]}
/>
```

```tsx
{
  /* right-aligned, opens on hover, icon trigger */
}
<MenuButton
  label="Export"
  size="sm"
  align="end"
  openOnHover
  leftIcon={<DownloadIcon />}
  items={[
    { label: "Download CSV", onSelect: exportCsv },
    { label: "Download PDF", onSelect: exportPdf },
  ]}
/>;
```

For a menu attached to a table row or an arbitrary element, see
[`DataTable` actions](#datatable) or compose your own with the same pattern.

---

### Badge

Status pill. `variant` (tone) × `size`, optional leading/trailing icons.

**Props**

- `variant` — `neutral` (default) · `success` · `warning` · `danger` · `info` · `outline`
- `size` — `sm` · `md` (default) · `lg`
- `label` — text alternative to `children`
- `leftIcon` / `rightIcon` — auto-sized, hidden from assistive tech

**Examples**

```tsx
<Badge>Draft</Badge>
<Badge variant="success">Paid</Badge>
<Badge variant="warning">On hold</Badge>
<Badge variant="danger">Failed</Badge>
<Badge variant="info">Pending</Badge>
<Badge variant="outline">GST 18%</Badge>
```

```tsx
{/* with icons — status dot, removable filter chip */}
<Badge variant="success" leftIcon={<CheckIcon />}>Delivered</Badge>
<Badge variant="outline" rightIcon={<XIcon />}>Category: Rice</Badge>
<Badge size="sm" variant="info">3 new</Badge>
```

---

### Card

Surface container. Compose it with the header/body/footer parts; `variant` and
`radius` are independent axes.

**Props (`Card`)**

- `variant` — `elevated` (default) · `raised` · `outline` · `ghost`
- `radius` — `none` · `sm` · `md` · `lg` (default) · `xl`
- `interactive` — hover + focus-ring affordance for a clickable card
- `asChild` — render a single child element (an `<a>`, `<button>`) instead of `<div>`

**Parts** — `CardHeader`, `CardTitle` (`<h3>`), `CardDescription` (`<p>`),
`CardContent`, `CardFooter`. All are plain `forwardRef` wrappers with sensible
spacing; pass `className` to adjust.

**Examples**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Payout #4821</CardTitle>
    <CardDescription>Settled 12 Aug 2026</CardDescription>
  </CardHeader>
  <CardContent>
    <Text variant="price">₹48,200</Text>
  </CardContent>
  <CardFooter>
    <Button size="sm" variant="outline">
      View breakdown
    </Button>
  </CardFooter>
</Card>
```

```tsx
{
  /* a whole card that is a link */
}
<Card interactive asChild>
  <a href={`/orders/${order.id}`}>
    <CardHeader>
      <CardTitle>{order.customer}</CardTitle>
      <Badge variant="info">{order.status}</Badge>
    </CardHeader>
  </a>
</Card>;
```

```tsx
{/* variants + square corners */}
<Card variant="outline" radius="sm">…</Card>
<Card variant="ghost" radius="none">…</Card>
```

---

### EmptyState

Placeholder for a region with no data, a failed load, or no search results. A
centered icon → title → description → actions column.

**Props**

- `variant` — `empty` (default) · `error` · `search` — sets the tone + default icon
- `size` — `sm` · `md` (default) · `lg`
- `icon` — override the default icon; pass `null` to hide it
- `title` / `description` — nodes
- `actions` — buttons/links row under the text
- `bordered` — wrap it in a dashed border card
- `variant="error"` also sets `role="alert"`

**Examples**

```tsx
{
  /* no data yet */
}
<EmptyState
  title="No products yet"
  description="Add your first product to start selling."
  actions={<Button leftIcon={<PlusIcon />}>Add product</Button>}
/>;
```

```tsx
{
  /* failed to load */
}
<EmptyState
  variant="error"
  title="Couldn't load orders"
  description={err.message}
  actions={
    <Button variant="outline" onClick={retry}>
      Retry
    </Button>
  }
/>;
```

```tsx
{
  /* no search results, compact + bordered */
}
<EmptyState
  variant="search"
  size="sm"
  bordered
  title="No matches for “kirna”"
  description="Check the spelling or try fewer words."
/>;
```

Used automatically by [`DataTable`](#datatable) for its empty/error rows.

---

### Skeleton

A placeholder shown while content loads. Honours `prefers-reduced-motion`.

**Props**

- `variant` — `text` (default) · `rounded` · `rect` · `circle`
- `size` — `sm` · `md` (default) · `lg` (drives the default height/diameter)
- `animation` — `pulse` (default) · `shimmer` (a highlight sweeping L→R) · `none`
- `lines` — for `text`: render a multi-line block (last line 60% width)
- `width` / `height` — exact dimensions (number → px, or any CSS length)
- `label` — accessible name announced while loading (default `"Loading"`)

**Examples**

```tsx
<Skeleton width={180} />                          {/* one line */}
<Skeleton lines={3} />                            {/* paragraph */}
<Skeleton variant="circle" size="lg" />           {/* avatar */}
<Skeleton variant="rounded" height={160} />       {/* image / chart box */}
<Skeleton variant="text" animation="shimmer" width="40%" />
```

```tsx
{
  /* a loading list row */
}
<div className="flex items-center gap-3">
  <Skeleton variant="circle" size="md" />
  <div className="flex-1">
    <Skeleton width="60%" />
    <Skeleton width="30%" className="mt-2" />
  </div>
</div>;
```

---

### Spinner

Indeterminate loading indicator. Announces `role="status"`.

**Props** — `size` (`sm` · `md` (default) · `lg`), `label` (visually-hidden text,
default `"Loading"`), plus native span attributes.

```tsx
<Spinner />
<Spinner size="sm" />
<Spinner size="lg" label="Loading payouts" />
```

For a button's own busy state use `<Button loading>` instead.

---

### Steps

A progress stepper — **or**, in its alternate mode, a segmented strength /
completion track (password meters, profile completion).

**Stepper props**

- `steps` — `StepItem[]`: `{ label, description?, icon?, status?, disabled? }`
- `current` / `defaultCurrent` / `onCurrentChange` — zero-based active index
- `onStepClick(index, step)` — fires when a step is activated
- `clickable` — let completed / current steps be clicked (they become buttons)
- `variant` — `solid` (default) · `outline`
- `size` — `sm` · `md` (default) · `lg`
- `orientation` — `horizontal` (default) · `vertical`
- `status` per step — force `pending` · `current` · `complete` · `error`

**Strength-track props** (set `percent` and `steps` is ignored)

- `percent` — 0–100, how full the bar is
- `segments` — number of segments (default `4`)
- `thresholds` — `[weakMax, fairMax]` percentages (default `[34, 67]`)
- `showValue` — append the rounded `%`
- `label` — caption under the bar (falls back to the auto strength word)

**Examples**

```tsx
{
  /* checkout progress */
}
<Steps
  current={1}
  steps={[
    { label: "Cart" },
    { label: "Address", description: "Where to deliver" },
    { label: "Payment" },
    { label: "Done" },
  ]}
/>;
```

```tsx
{
  /* vertical, clickable, with an errored step */
}
<Steps
  orientation="vertical"
  clickable
  current={step}
  onStepClick={(i) => setStep(i)}
  steps={[
    { label: "Business details" },
    { label: "KYC documents", status: "error", description: "PAN rejected" },
    { label: "Bank account" },
  ]}
/>;
```

```tsx
{
  /* password strength */
}
<Steps percent={pwStrength} showValue />;
{
  /* profile completion */
}
<Steps percent={72} segments={5} label="Profile 72% complete" thresholds={[40, 80]} />;
```

---

### Input

Text field with the shared field pattern, in-field icon slots, optional docked
edge selects, and keystroke filtering.

**Props**

- `variant` — `outline` (default) · `filled`
- `size` — `sm` · `md` (default) · `lg`
- `label` / `hint` / `error` — `error` also forces invalid styling + `aria-invalid`
- `invalid` — force the error look without a message
- `leftIcon` / `rightIcon` — inside the field; `rightIcon` may be interactive
  (a clear button, a password reveal toggle)
- `leftSelect` / `rightSelect` — an `InputSelectConfig` docked flush to that edge
  (country code, unit): `{ options, value?, defaultValue?, onChange?, placeholder?, disabled?, menuWidth? }`;
  each option is `{ value, label, triggerLabel?, subtext?, icon?, disabled? }`
- `allowPattern` — a `RegExp` the whole value must match for an edit (type / paste
  / drop / autofill) to be accepted; empty is always allowed
- `containerClassName` — classes for the label + field + hint/error wrapper
- …all native `<input>` attributes (`value`, `onChange`, `placeholder`, `type`, …)

**Examples**

```tsx
{/* label + hint + error */}
<Input label="Store name" hint="Shown to customers" defaultValue="" />
<Input label="GSTIN" error="Enter a valid 15-character GSTIN" defaultValue="27ABC" />
```

```tsx
{/* icons — search field, password reveal */}
<Input leftIcon={<SearchIcon />} placeholder="Search orders" />

<Input
  type={show ? "text" : "password"}
  label="Password"
  rightIcon={
    <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle">
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  }
/>
```

```tsx
{
  /* digits only, up to 2 decimals */
}
<Input label="Price (₹)" inputMode="decimal" allowPattern={/^\d*\.?\d{0,2}$/} />;
```

```tsx
{
  /* docked select — country code on the left */
}
<Input
  label="Phone"
  type="tel"
  leftSelect={{
    defaultValue: "+91",
    options: [
      { value: "+91", label: "India (+91)", triggerLabel: "+91" },
      { value: "+1", label: "USA (+1)", triggerLabel: "+1" },
    ],
  }}
/>;
```

---

### Dropdown

From-scratch single / multi select (no native `<select>`). Same field API as
`Input`. The menu opens downward and flips up when short of room.

**Props**

- `options` — `DropdownOption[]` **or** grouped `{ "Group name": DropdownOption[] }`
  (set `isCategoriesList`). Option: `{ value, label, subtext?, tertiary?, icon?, disabled? }`
  — `tertiary` renders right-aligned, `icon` left; all are nodes.
- `multiple` — checkbox per option; `value` becomes `string[]`
- `value` / `defaultValue` / `onChange` — `string` (single) or `string[]` (multi)
- `label` / `placeholder` / `hint` / `error` / `invalid` / `disabled` / `readOnly` / `required`
- `leftIcon` — a node rendered inside the trigger, before the value (an icon)
- `variant` — `outline` (default) · `filled`; `size` — `sm` · `md` · `lg`
- `searchable` — adds a filter box in the menu; `searchKeys` picks which fields to
  match; `searchPlaceholder`; `onSearchChange(query)`
- `clearable` — an ✕ to reset (single); `removable` — chips get an ✕ (multi)
- `selectAll` + `selectAllLabel` — a select-all row (multi)
- `emptyMessage` — shown when the (filtered) list is empty
- `menuClassName` / `containerClassName`

**Examples**

```tsx
{
  /* single select */
}
<Dropdown
  label="Fulfilment status"
  placeholder="Choose…"
  value={status}
  onChange={setStatus}
  clearable
  options={[
    { value: "packing", label: "Packing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "rto", label: "Returned", disabled: true },
  ]}
/>;
```

```tsx
{
  /* multi-select, searchable, with select-all */
}
<Dropdown
  label="Categories"
  multiple
  searchable
  selectAll
  removable
  value={cats}
  onChange={setCats}
  options={products.map((p) => ({ value: p.id, label: p.name, subtext: p.sku }))}
/>;
```

```tsx
{
  /* grouped options with icons + right-aligned meta */
}
<Dropdown
  label="Move to warehouse"
  isCategoriesList
  options={{
    North: [{ value: "dl", label: "Delhi", icon: <WarehouseIcon />, tertiary: "128 units" }],
    South: [{ value: "blr", label: "Bengaluru", icon: <WarehouseIcon />, tertiary: "64 units" }],
  }}
/>;
```

For just the option list without a trigger, use [`ListItems`](#listitems).

---

### ListItems

The `Dropdown` option list on its own, rendered inside a card — when you need the
list without a trigger or popover (a sidebar filter, a picker panel).

**Props**

- `options` — same shape as `Dropdown` (flat or `isCategoriesList` groups)
- `multiple` — checkboxes instead of a single tick
- `value` / `defaultValue` / `onChange` — `string` or `string[]`
- `onItemClick(option, index)` — fires on every row click
- `selectable` — set `false` for a plain action list (no tick/checkbox)
- `selectAll` + `selectAllLabel` — select-all row (multi)
- `variant` — `outline` (default) · `filled` · `plain`; `size` — `sm` · `md` · `lg`
- `maxHeight` — px cap before the list scrolls
- `emptyMessage`, `listClassName`

**Examples**

```tsx
{
  /* filter panel */
}
<ListItems
  multiple
  value={selected}
  onChange={setSelected}
  options={[
    { value: "cod", label: "Cash on delivery", tertiary: "42" },
    { value: "upi", label: "UPI", tertiary: "310" },
    { value: "card", label: "Card", tertiary: "88" },
  ]}
/>;
```

```tsx
{
  /* plain action list */
}
<ListItems
  selectable={false}
  variant="plain"
  onItemClick={(o) => run(o.value)}
  options={[
    { value: "export", label: "Export CSV", icon: <DownloadIcon /> },
    { value: "print", label: "Print", icon: <PrinterIcon /> },
  ]}
/>;
```

---

### Autosuggest

Typeahead: type to get suggestions (debounced), pick one or many. Same field
pattern as `Dropdown`, plus async loading and create-new.

**Props**

- `options` — static `AutosuggestOption[]` (`{ value, label, subtext?, tertiary?, icon?, disabled? }`)
- `loadOptions(query)` — async source; return an array or a Promise; combine with `loading`
- `onSearch(query)` — raw query callback (for your own fetching)
- `debounce` — ms before `loadOptions` / `onSearch` fire (default sensible)
- `minChars` — don't search until N characters; `minCharsMessage`
- `multiple` — chips render at the **bottom of the menu**; the input clears after each pick
- `value` / `defaultValue` / `onChange` — `string` or `string[]`
- `filterOption(option, query)` / `searchKeys` — client-side filtering of static options
- `getInputValue(option)` — text put in the field when a single value is chosen
- `onInputChange(raw)` — every keystroke
- `creatable` + `onCreate(text)` — add a new option from free text; `createLabel`
- `emptyMessage` / `loadingMessage`
- field props: `label` / `placeholder` / `hint` / `error` / `invalid` / `disabled` / `readOnly` / `variant` / `size`

**Examples**

```tsx
{
  /* async product search */
}
<Autosuggest
  label="Add product to order"
  placeholder="Search by name or SKU"
  loading={isFetching}
  loadOptions={async (q) => {
    const rows = await api.searchProducts(q);
    return rows.map((r) => ({ value: r.id, label: r.name, subtext: r.sku, tertiary: `₹${r.mrp}` }));
  }}
  minChars={2}
  debounce={250}
  onChange={(id) => addLine(id)}
/>;
```

```tsx
{
  /* multi-select tags from a static list, with create-new */
}
<Autosuggest
  label="Tags"
  multiple
  creatable
  options={allTags.map((t) => ({ value: t, label: t }))}
  value={tags}
  onChange={setTags}
  onCreate={(text) => text.trim().toLowerCase()}
/>;
```

---

### Checkbox / Radio / groups

Selection controls with the `Button`-shaped variant API. Use the group
components to wire shared state; use a bare `Checkbox` for a single boolean.

**`Checkbox` / `Radio` props**

- `variant` — `primary` (default) · `secondary` · `outline` · `danger`
- `size` — `sm` · `md` (default) · `lg`
- `label` / `description` — nodes beside the control
- `indeterminate` — `Checkbox` only (a "some selected" dash)
- `containerClassName` — classes for the wrapping `<label>`
- …native `<input>` props (`checked`, `defaultChecked`, `onChange`, `value`, `disabled`)

**`RadioGroup` props** — `value` / `defaultValue` / `onChange(value)`, `name`,
`options?: { value, label, description?, disabled? }[]`, `orientation`
(`vertical` (default) · `horizontal`), `variant`, `size`, `disabled`, `label`.

**`CheckboxGroup` props** — same, but `value` / `onChange` deal in `string[]`.

**Examples**

```tsx
{
  /* single checkbox */
}
<Checkbox
  label="Charge shipping"
  description="Adds ₹40 at checkout"
  checked={charge}
  onChange={(e) => setCharge(e.target.checked)}
/>;
```

```tsx
{
  /* radio group from data */
}
<RadioGroup
  label="Payout frequency"
  value={freq}
  onChange={setFreq}
  options={[
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly", description: "Every Monday" },
    { value: "monthly", label: "Monthly" },
  ]}
/>;
```

```tsx
{
  /* checkbox group, horizontal, composed children */
}
<CheckboxGroup label="Delivery days" orientation="horizontal" value={days} onChange={setDays}>
  <Checkbox value="mon" label="Mon" />
  <Checkbox value="tue" label="Tue" />
  <Checkbox value="wed" label="Wed" />
</CheckboxGroup>;
```

```tsx
{
  /* header "select all" with indeterminate */
}
<Checkbox
  aria-label="Select all"
  checked={all}
  indeterminate={some && !all}
  onChange={toggleAll}
/>;
```

---

### Switch

An on/off toggle — a native `<input type="checkbox" role="switch">`, so
`checked` / `defaultChecked` / `onChange` behave exactly as on a checkbox. Same
`variant` (on-colour) × `size` axis as the selection controls.

**Props** — `variant` (`primary` (default) · `secondary` · `outline` · `danger`),
`size` (`sm` · `md` · `lg`), `label`, `description`, `containerClassName`, plus
native input props.

```tsx
<Switch label="Store is open" checked={open} onChange={(e) => setOpen(e.target.checked)} />

<Switch
  variant="danger"
  label="Pause all listings"
  description="Customers won't see your products"
  defaultChecked={false}
/>

<Switch size="sm" label="Email me on new orders" name="notifyOrders" />
```

---

### FileUpload

File picker + drag-and-drop target. Shares `Input`'s field pattern; the value is
always a `File[]`.

**Props**

- `variant` — `outline` (default) · `filled` — a dashed drop zone;
  `dropdown` — a compact `Dropdown`-style field, picked files as a scrolling row of chips
- `size` — `sm` · `md` (default) · `lg`
- `label` / `hint` / `error` / `invalid` / `required`
- `placeholder` / `description` — text inside the empty zone; `replaceLabel` — single-file replace hint
- `value` / `defaultValue` / `onChange(files)` — always `File[]`
- `multiple` — allow more than one; otherwise picking replaces
- `accept` — MIME/extension filter, **enforced on drops too**
- `maxSize` (bytes) / `maxFiles` — offenders go to `onReject(rejections)` and a
  message under the field; each `FileRejection` is `{ file, reason: "type" | "size" | "count" }`
- `showPreview` — thumbnail for images; `showView` / `showDelete` — per-file buttons
- `previewInDialog` — the "view" action opens the built-in `FilePreviewDialog`
- `onView(file, url)` — custom view handler
- `renderActions(ctx)` — replace the per-file buttons; `ctx` is
  `{ file, url, index, remove, view, disabled }`
- `clearable` — an ✕ to empty the field (`dropdown` variant)
- Helper: `formatFileSize(bytes)` → `"1.2 MB"` (exported for your own rows)

**Examples**

```tsx
{
  /* single image with preview + replace */
}
<FileUpload
  label="Store logo"
  accept="image/png,image/jpeg"
  maxSize={2 * 1024 * 1024}
  showPreview
  previewInDialog
  value={logo}
  onChange={setLogo}
  onReject={(r) => toastRejections(r)}
/>;
```

```tsx
{
  /* multiple documents, dropdown variant, chips */
}
<FileUpload
  variant="dropdown"
  label="KYC documents"
  multiple
  maxFiles={5}
  accept=".pdf,image/*"
  clearable
  onChange={setDocs}
/>;
```

```tsx
{
  /* custom per-file actions */
}
<FileUpload
  multiple
  onChange={setFiles}
  renderActions={({ file, remove, view }) => (
    <>
      <Button size="sm" variant="ghost" onClick={view}>
        View
      </Button>
      <Button size="sm" variant="ghost" onClick={remove}>
        Remove
      </Button>
      <span className="text-caption text-muted">{formatFileSize(file.size)}</span>
    </>
  )}
/>;
```

---

### Calendar

A month grid — the shared primitive behind `DatePicker` / `DateRangePicker`. Use
it directly for an always-visible calendar; otherwise reach for the field
components below.

**Props**

- `mode` — `single` (default) · `range`
- `month` / `defaultMonth` / `onMonthChange` — the visible month
- `monthsToShow` — render N months side by side (range mode)
- `selected` / `onSelectDate(date)` — single mode
- `range` / `onSelectRange(range)` — range mode; `range` is `{ start, end }` of `Date | null`
- `min` / `max` / `disabledDate(date)` — restrict selectable days
- `weekStartsOn` — `0` Sun … `1` Mon
- `locale` — BCP-47 string for day/month names
- `monthDropdown` — month + year `<select>`s in the header; bound by
  `fromYear` / `toYear` (absolute) or `pastYears` / `futureYears` (relative)

```tsx
<Calendar
  selected={date}
  onSelectDate={setDate}
  min={new Date()}
  disabledDate={(d) => d.getDay() === 0} // no Sundays
  weekStartsOn={1}
  monthDropdown
  pastYears={2}
  futureYears={1}
/>
```

```tsx
{
  /* two-month range */
}
<Calendar mode="range" monthsToShow={2} range={range} onSelectRange={setRange} />;
```

---

### DatePicker

Single-date field + calendar popover. The popover flips upward when short of room;
the grid is fluid on small screens.

**Props** — `value` / `defaultValue` / `onChange(date)` (`Date | null`), `min` /
`max` / `disabledDate`, `weekStartsOn`, `locale`, year bounds
(`fromYear` / `toYear` / `pastYears` / `futureYears`), `format(date) => string`
for the displayed text, plus the shared field props: `label`, `placeholder`,
`hint`, `error`, `invalid`, `disabled`, `readOnly`, `required`, `clearable`,
`variant` (`outline` · `filled`), `size` (`sm` · `md` · `lg`).

```tsx
<DatePicker
  label="Delivery date"
  placeholder="Pick a date"
  value={date}
  onChange={setDate}
  min={new Date()}
  clearable
/>;

{
  /* custom display format */
}
<DatePicker
  label="Invoice date"
  value={date}
  onChange={setDate}
  format={(d) => d.toLocaleDateString("en-IN", { dateStyle: "medium" })}
/>;
```

---

### DateRangePicker

Start/end date field + range calendar (two months on desktop, one on mobile),
with an optional quick-preset list.

**Props** — `value` / `defaultValue` / `onChange(range)` (`{ start, end }` of
`Date | null`), `monthsToShow`, `showPresets`, `presets?: DateRangePreset[]`,
`min` / `max` / `disabledDate`, `weekStartsOn`, `locale`, year bounds,
`format(range) => string`, plus the shared field props.

```tsx
import { DateRangePicker, buildDefaultPresets } from "@gramkick/ui";

<DateRangePicker
  label="Report period"
  showPresets
  presets={buildDefaultPresets(1 /* week starts Mon */)}
  value={range}
  onChange={setRange}
/>;
```

`DateRangePreset` is `{ key, label, getRange: (today: Date) => DateRange }` —
build your own list, or start from `buildDefaultPresets()` (Today, Yesterday, This
week, Last 7 / 15 / 30 days, This month, Last month).

---

### TimePicker

Time field + column picker popover (hours / minutes / [seconds] / AM-PM). The
popover stays open while you pick; a footer "Done" closes it.

**Props** — `value` / `defaultValue` / `onChange(date)` (`Date | null`; only the
time part matters), `min` / `max`, `minuteStep`, `secondStep`, `withSeconds`,
`disabledTime(date)`, `locale` (drives 12- vs 24-hour), `format(date) => string`,
plus the shared field props (`variant` `outline` / `filled` × `size`
`sm` / `md` / `lg`, `label` / `hint` / `error` / `disabled` / `readOnly` /
`invalid` / `clearable`).

```tsx
<TimePicker
  label="Pickup time"
  minuteStep={15}
  value={time}
  onChange={setTime}
  disabledTime={(d) => d.getHours() < 9 || d.getHours() > 20}
/>;

{
  /* 24-hour with seconds */
}
<TimePicker label="Cut-off" locale="en-GB" withSeconds value={t} onChange={setT} />;
```

---

### DropdownRangePicker

A range field whose popover is a list of quick presets (Today, This week, Last 15
days, …) plus an optional "Custom range" row that swaps in the range calendar.
Best when users usually want a named period, not arbitrary dates.

**Props** — `value` / `defaultValue` / `onChange(range, presetKey)` (`presetKey`
is the chosen preset's key or `"custom"`), `presets?: DateRangePreset[]`,
`allowCustom` (default `true`), `customLabel`, date bounds + year bounds,
`monthsToShow`, `format(range, presetKey) => string`, plus the shared field props.

```tsx
<DropdownRangePicker
  label="Sales period"
  value={range}
  onChange={(r, key) => {
    setRange(r);
    track("period_changed", { preset: key });
  }}
/>;

{
  /* only fixed presets, no custom calendar */
}
<DropdownRangePicker
  label="Compare"
  allowCustom={false}
  value={range}
  onChange={(r) => setRange(r)}
/>;
```

---

### Tabs

Tabbed navigation. Pass `items` for the batteries-included version, or compose
`TabsList` / `TabsTrigger` / `TabsContent` for full control. Full ARIA tablist +
roving-tabindex keyboard support (Arrows, Home, End).

**Props (`Tabs`)**

- `variant` — `line` (default) · `solid` · `soft` · `enclosed`
- `size` — `sm` · `md` (default) · `lg`
- `value` / `defaultValue` / `onValueChange` — active tab value
- `items` — `TabsItem[]`: `{ value, label, content?, icon?, badge?, disabled? }`
- `activationMode` — `automatic` (default, select on focus) · `manual` (select on Enter/Space/click)

**`TabsTrigger`** — `value` (must match a `TabsContent`), `icon`, `badge`,
`disabled`, `asChild` (render the child element — e.g. a router `<Link>` — instead
of a `<button>`, for tabbed navigation; `icon` / `badge` are then ignored).
**`TabsContent`** — `value`, `forceMount` (keep mounted while hidden).

**Examples**

```tsx
{
  /* data-driven */
}
<Tabs
  defaultValue="open"
  items={[
    { value: "open", label: "Open", badge: 12, content: <OrdersList status="open" /> },
    { value: "shipped", label: "Shipped", content: <OrdersList status="shipped" /> },
    { value: "returns", label: "Returns", icon: <RotateCcwIcon />, content: <Returns /> },
    { value: "archive", label: "Archive", disabled: true },
  ]}
/>;
```

```tsx
{
  /* composed, controlled, "solid" pill style */
}
<Tabs variant="solid" value={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="payouts" badge="new">
      Payouts
    </TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <Overview />
  </TabsContent>
  <TabsContent value="payouts">
    <Payouts />
  </TabsContent>
</Tabs>;
```

```tsx
{
  /* tabbed navigation — each tab is a real <a>, no TabsContent */
}
<Tabs variant="line" value={section} onValueChange={setSection} activationMode="manual">
  <TabsList aria-label="Primary">
    <TabsTrigger value="home" asChild>
      <Link href="/">Home</Link>
    </TabsTrigger>
    <TabsTrigger value="pricing" asChild>
      <Link href="/pricing">Pricing</Link>
    </TabsTrigger>
  </TabsList>
</Tabs>;
```

---

### Dialog

A ready-made dialog: header (accent icon, title, subtext, close), a body from
`description` and/or `children`, and a footer built from an `actions` list of
`Button` configs. Responsive by default — a bottom sheet on phones, a centered
modal from `sm` up.

**Props (`Dialog`)**

- `trigger` — element that opens it (wrapped in `DialogTrigger`); or control with
  `open` / `defaultOpen` / `onOpenChange`
- `variant` — `default` · `danger` · `warning` · `success` — tints the header icon
- `icon` — header accent icon; `titleStartIcon` — small icon before the title text
- `title` / `subtext` / `description` — nodes
- `children` — custom body content (below `description`)
- `actions` — `DialogAction[]` = `ButtonProps & { closeOnClick? }`
  (`closeOnClick` defaults to `true`)
- `size` — `sm` · `md` (default) · `lg` · `xl` · `full`
- `placement` — `responsive` (default) · `center` (centered at every width)
- `showClose` / `closeLabel`, `dismissibleByDrag` (mobile sheet), `modal`
- `contentProps` / `className` / `overlayClassName`

**Primitives** — for bespoke layouts: `DialogRoot`, `DialogTrigger`,
`DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`,
`DialogFooter`, `DialogTitle`, `DialogDescription`.

**Examples**

```tsx
{
  /* confirm a destructive action */
}
<Dialog
  variant="danger"
  trigger={<Button variant="danger">Delete store</Button>}
  icon={<TrashIcon />}
  title="Delete Sharma Kirana Store?"
  description="This removes all products and cannot be undone."
  actions={[
    { children: "Cancel", variant: "outline" },
    { children: "Delete", variant: "danger", onClick: () => remove(store.id) },
  ]}
/>;
```

```tsx
{
  /* controlled, with a form as the body */
}
<Dialog
  open={editing}
  onOpenChange={setEditing}
  title="Edit payout account"
  size="lg"
  actions={[
    { children: "Cancel", variant: "outline" },
    { children: "Save", loading: saving, onClick: save, closeOnClick: false },
  ]}
>
  <form className="flex flex-col gap-4">
    <Input label="Account number" />
    <Input label="IFSC" />
  </form>
</Dialog>;
```

```tsx
{
  /* fully custom with primitives */
}
<DialogRoot>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent size="xl" placement="center">
    <DialogHeader>
      <DialogTitle>Bulk import</DialogTitle>
    </DialogHeader>
    …
    <DialogFooter>
      <DialogClose asChild>
        <Button>Done</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</DialogRoot>;
```

---

### Tooltip

Hover / focus / click tooltip. Auto-flips to the opposite side on overflow;
supports a plain string or rich content with a description and action buttons.

**Props**

- `children` — the trigger (a single element)
- `content` — the tooltip body (node or string)
- `description` — secondary line; `actions` — buttons/links row (makes it a
  `role="dialog"` and interactive)
- `side` — `top` (default) · `bottom` · `left` · `right` (auto-flips)
- `align` — `start` · `center` (default) · `end`
- `arrow` — show the pointer (default `true`)
- `variant` — `dark` (default) · `light` · `accent` · `danger`
- `size` — `sm` · `md` (default) · `lg`
- `trigger` — one or more of `hover` / `focus` / `click` (default `["hover","focus"]`)
- `open` / `defaultOpen` / `onOpenChange`, `openDelay` / `closeDelay` (ms)
- `maxWidth` — wrapping width (number px or CSS length)
- `disabled` — render the trigger only

**Examples**

```tsx
{
  /* plain hint on an icon button */
}
<Tooltip content="Download CSV">
  <Button size="icon" variant="ghost" aria-label="Download">
    <DownloadIcon />
  </Button>
</Tooltip>;
```

```tsx
{
  /* rich, click-triggered, with actions */
}
<Tooltip
  trigger="click"
  variant="light"
  side="bottom"
  content="Payout on hold"
  description="Complete KYC to resume automatic payouts."
  actions={
    <Button size="sm" onClick={openKyc}>
      Finish KYC
    </Button>
  }
>
  <Badge variant="warning">On hold</Badge>
</Tooltip>;
```

---

### Toast

Imperative toasts — importable and callable **anywhere** (event handlers, `catch`
blocks, non-React modules). No provider is required; the first call mounts its own
outlet on `document.body`.

**`ToastMessenger`** — call it directly with `ToastOptions`, or use the shortcuts:

- `ToastMessenger.success(title, opts?)` / `.error` / `.info` / `.warning`
- `.dismiss(id)` / `.dismissAll()` / `.update(id, patch)` / `.configure(patch)`
- returns the toast `id`

**`ToastOptions`** — `title`, `description`, `actions`, `variant`
(`dark` · `light` · `accent` · `danger`), `icon`, `duration` (ms; `0` = sticky),
`dismissible`, `onDismiss`, `id`.

**`useToast()`** — React wrapper around the same store (`toast()`, `.success`, …).

**`ToastProvider`** — optional; render it once to place the stack **inside** your
React tree (so toast `actions` get your app's context) and set defaults:
`position` (`top|bottom` × `left|center|right`), `duration`, `max`.

**Examples**

```tsx
import { ToastMessenger } from "@gramkick/ui";

try {
  await api.save();
  ToastMessenger.success("Product saved");
} catch (e) {
  ToastMessenger.error("Save failed", { description: e.message, duration: 0 });
}
```

```tsx
{
  /* with an action + later update */
}
const id = ToastMessenger({
  title: "Uploading catalogue…",
  variant: "accent",
  duration: 0,
});
// …when done
ToastMessenger.update(id, { title: "Catalogue uploaded", duration: 4000 });
```

```tsx
{
  /* place + configure the stack */
}
<ToastProvider position="bottom-center" max={3} duration={5000}>
  <App />
</ToastProvider>;
```

```tsx
{
  /* from a component, via the hook */
}
const toast = useToast();
<Button onClick={() => toast.info("Link copied")}>Copy link</Button>;
```

---

### DataTable

A dynamic, responsive table: sorting, row selection (with a this-page /
all-pages menu), a paginated footer, sticky header / first / actions columns, and
skeleton / empty / error states. Horizontal scroll on mobile — the table scrolls
_inside_ its card.

**Core props**

- `columns` — `DataTableColumn<T>[]`:
  `{ id, header, cell?(row, i), accessor?(row), align?, width?, sortable?, sortAccessor?(row), headerClassName?, cellClassName? }`
  - no `cell`/`accessor` → the cell reads `row[id]`
  - a cell **value that is an object** (`{ name, email, iconUrl }`, `RichCell`) renders as avatar + text + subtext
- `data` — `T[]`; `getRowId(row, i)` — stable id for selection (defaults to `row.id` then index)
- `variant` — `default` · `striped` · `bordered`; `size` — `sm` · `md` · `lg`

**Sorting** — `sort` / `defaultSort` / `onSortChange` (`{ id, dir } | null`),
`manualSort` (data already sorted server-side).

**Selection** — `selectable`, `selectionMode` (`checkbox` · `menu`),
`selectedIds` / `defaultSelectedIds` / `onSelectionChange(ids, { allPages })`.

**Pagination** — `pagination`, `page` / `pageSize` (+ `default*` + `on*Change`),
`pageSizeOptions`, `totalCount`, `manualPagination` (data is already the page).

**Layout** — `stickyHeader`, `stickyFirstColumn`, `stickyActions`, `maxHeight`,
`isFixedHeight`, `actions(row)` + `actionsHeader`.

**States** — `loading` (+ `loadingRows`, `isHeaderLoading`, `loadingState`),
`error` (+ `errorState`), `emptyState` / `emptyTitle` / `emptyDescription`,
`highlightBackgroundColor` (string or `(row, i) => string | false`).

**Examples**

```tsx
{
  /* basic, client-side sort + pagination */
}
<DataTable
  data={orders}
  pagination
  columns={[
    { id: "id", header: "Order", sortable: true },
    { id: "customer", header: "Customer", sortable: true },
    {
      id: "total",
      header: "Total",
      align: "right",
      sortable: true,
      cell: (o) => `₹${o.total.toLocaleString("en-IN")}`,
    },
    { id: "status", header: "Status", cell: (o) => <Badge>{o.status}</Badge> },
  ]}
/>;
```

```tsx
{
  /* rich cells — object value becomes avatar + name + email */
}
<DataTable
  data={merchants}
  columns={[
    {
      id: "owner",
      header: "Owner",
      accessor: (m) => ({ name: m.ownerName, email: m.email, iconUrl: m.avatar }),
    },
    { id: "city", header: "City" },
    { id: "gmv", header: "GMV", align: "right", sortable: true },
  ]}
/>;
```

```tsx
{
  /* selection + row actions + sticky columns */
}
<DataTable
  data={rows}
  selectable
  selectionMode="menu"
  onSelectionChange={(ids, { allPages }) => setSelection({ ids, allPages })}
  stickyHeader
  stickyFirstColumn
  stickyActions
  maxHeight={480}
  actions={(row) => <MenuButton label="⋯" size="sm" variant="ghost" items={rowActions(row)} />}
  columns={cols}
/>;
```

```tsx
{
  /* server-driven: manual sort + manual pagination + loading / error */
}
<DataTable
  data={page.rows}
  manualSort
  manualPagination
  pagination
  totalCount={page.total}
  page={page.number}
  onPageChange={fetchPage}
  sort={sort}
  onSortChange={fetchSorted}
  loading={isLoading}
  isHeaderLoading
  error={error?.message}
  emptyTitle="No orders in this range"
  columns={cols}
/>;
```

---

## Hooks

From `@gramkick/ui/hooks`:

| Hook                   | Signature                                                    | Use                                                                            |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `useMediaQuery`        | `(query: string) => boolean`                                 | SSR-safe media-query subscription. `false` on the server, reconciles on mount. |
| `useControllableState` | `({ value?, defaultValue, onChange? }) => [value, setValue]` | The controlled-or-uncontrolled pattern used across the library.                |
| `useDebouncedValue`    | `(value: T, delayMs: number) => T`                           | Debounced mirror of a value; `0` updates synchronously.                        |

```tsx
import { useMediaQuery, useDebouncedValue } from "@gramkick/ui/hooks";

const isDesktop = useMediaQuery("(min-width: 768px)");

const [q, setQ] = useState("");
const debouncedQ = useDebouncedValue(q, 250);
useEffect(() => {
  search(debouncedQ);
}, [debouncedQ]);
```

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
   `rounded-gk-md`, `shadow-card`, the `text-*` scale, …) — no raw hex.
5. Re-export from `src/index.ts`.
6. `npm run changeset` to record the change.
7. Add a row to the [Component index](#component-index) and a `###` section here.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full checklist.

## Release

Automated via Changesets. Every PR that changes shipped code adds a changeset;
merging to `main` opens a **Version Packages** PR, and merging that publishes
`@gramkick/ui` to npm (needs the `NPM_TOKEN` repo secret).

### Consuming before the first npm publish

Point a front-end at the local checkout:

```jsonc
// <frontend>/package.json
"dependencies": {
  "@gramkick/ui": "file:../gramkick-ui-library"
}
```

Run `npm run build` here first (the consumer reads `dist/`).
