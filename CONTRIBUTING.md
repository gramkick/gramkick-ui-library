# Contributing to @gramkick/ui

## Setup

```bash
nvm use          # Node 20
npm install
npm run storybook
```

## Component authoring checklist

- [ ] Folder `src/components/<name>/` with `<name>.tsx`, `<name>.stories.tsx`,
      `<name>.test.tsx`, `index.ts`.
- [ ] `forwardRef` to the underlying DOM node (or Radix primitive).
- [ ] All extra props spread onto the root element (`...props`).
- [ ] Incoming `className` merged **last** through `cn(...)` so consumers can override.
- [ ] Variants declared with `cva`; export `xxxVariants` and a `type XxxProps`.
- [ ] **Token classes only** — `bg-leaf`, `text-ink`, `border-line`, `rounded-gk-md`,
      `shadow-card`, `ring-leaf/40`, … Never a raw hex value.
- [ ] Keyboard + screen-reader behaviour covered (roles, labels, focus states,
      `motion-reduce:` where animated). Prefer a Radix primitive over hand-rolled
      focus management.
- [ ] Story per meaningful state, `tags: ["autodocs"]`.
- [ ] Tests: render, variant/prop effects, interaction, disabled/asChild paths.
- [ ] Re-exported from `src/index.ts` (or `src/hooks/index.ts`).
- [ ] `npm run changeset`.

## Before pushing

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Commit & PR

- Small, focused PRs. One component or one concern each.
- Every PR touching `src/` (except tests/stories/docs) needs a changeset —
  `patch` for fixes, `minor` for new components/props, `major` for breaking API.
- CI runs lint + typecheck + test + build + `publint`/`attw` + Storybook build.

## Design tokens

Tokens live in `src/styles/theme.css` (`@theme`). They mirror the values currently
duplicated in each front-end's `app.css` / `globals.css`. Changing a token here is
a library release that every consumer picks up — treat renames/removals as breaking.
