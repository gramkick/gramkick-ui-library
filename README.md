# @gramkick/ui

Reusable React component library for the GramKick front-ends — design tokens,
accessible primitives, and 26 styled components shared by the shell and the
merchant / customer / dealer / admin SPAs.

React 19 (peer `^18 || ^19`) · TypeScript · ESM-only · Tailwind CSS v4 tokens ·
Radix primitives · `cva` + `tailwind-merge` variants.

## Install

```bash
npm install @gramkick/ui
```

## Setup

**1. Load the tokens** once, at your app's CSS entry:

```css
/* Tailwind v4 app */
@import "tailwindcss";
@import "@gramkick/ui/theme.css";
@source "../node_modules/@gramkick/ui/dist";
```

```ts
/* app without Tailwind — prebuilt stylesheet instead */
import "@gramkick/ui/styles.css";
```

**2. Load the Inter webfont** in your app (Google Fonts / self-host / `next/font`).
The library only sets `--font-sans`; until the font loads, text falls back to the
system UI stack.

## Use

```tsx
import { Button, Card, Badge, Text } from "@gramkick/ui";
import { useMediaQuery } from "@gramkick/ui/hooks";
import { ShoppingCartIcon } from "@gramkick/ui/icons";
import { cn, type DateRange } from "@gramkick/ui";
```

## Docs

- **[Full component reference →](./docs/COMPONENTS.md)** — every component, its
  props, and usage examples, plus icons, typography, and design tokens.
- Interactive workbench: `npm run storybook`

## Develop

```bash
nvm use && npm install
npm run storybook     # http://localhost:6006
npm test
npm run lint && npm run typecheck
npm run build
```

Add a component: see [CONTRIBUTING.md](./CONTRIBUTING.md). Every code change needs
a changeset (`npm run changeset`); merging to `main` publishes via the release
workflow.
