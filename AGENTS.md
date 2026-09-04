# AGENTS.md

Working notes for coding agents on Print My Proxy. See [`README.md`](./README.md)
for the product overview, feature list and deployment details.

## Shape of the app

A single-screen, entirely client-side React SPA. There is **no router, no
backend API, no auth and no database**. The Cloudflare Worker serves static
assets only. All state lives in the browser's IndexedDB.

`src/App.tsx` gates rendering on `useSettingsStore(s => s._hasHydrated)`, so
nothing paints until persisted settings load. Context nesting is
`ImagesProvider → ImageSelectionProvider → PreviewProvider → Layout`.
`src/Layout.tsx` is the only screen.

## Stack

React 19 (with the React Compiler Babel plugin), Chakra UI v3 + Emotion,
Zustand for local state, TanStack Query for async state, Zod for validation,
`idb-keyval` for persistence, `pdf-lib` for PDF assembly, TensorFlow.js for
upscaling, `@dnd-kit` for drag and drop. Vite 8 with the Cloudflare plugin,
Vitest 4, Storybook 10, Sentry for errors and tracing.

## Commands

```bash
npm run dev          # dev server + Chakra typegen watcher
npm run typegen      # regenerate Chakra theme types after editing src/theme.ts
npm run test:run     # unit tests once
npm run check:pr     # typegen + lint + format check + build — run before finishing
```

`npm run check:pr` is the pre-commit hook and the CI gate. Run it before
declaring work done.

## Conventions

- **Imports are sorted by a Prettier plugin** with a fixed group order
  (`@/components/ui/*`, `@/components/*`, `@/*`, relative) and blank lines
  between groups. Don't hand-order imports; run `npm run format`.
- Use the `@` alias for anything outside the current directory.
- Prefer the existing Chakra snippet components in `src/components/ui/` over raw
  Chakra primitives. Note that directory holds a lot of unused CLI-generated
  scaffolding — check whether a component is actually imported before treating
  it as an established pattern.
- Styling goes through the Chakra system in `src/theme.ts`: tokens, semantic
  tokens and recipes. Editing `theme.ts` requires `npm run typegen` before types
  resolve.
- Wrap meaningful async work in `Sentry.startSpan`. See `.cursor/sentry.mdc`.
- Chakra UI work has vendored skills in `.agents/skills/` (`chakra-ui-builder`
  for building, `chakra-ui-refactor` for reviewing and converting).

## Naming: Print My Proxy vs proxy-print

The product was renamed from "Proxy Print" to **Print My Proxy**. All
user-facing copy should say "Print My Proxy". Several identifiers deliberately
keep the old slug because changing them breaks users or infrastructure — **do
not rename these**:

- `proxy-print-settings` — the persisted settings key in
  `src/store/settingsStore.ts`. Renaming orphans every existing user's settings,
  presets and projects.
- `proxy-print-image-cache` — the IndexedDB image store in
  `src/utils/imageQueryCache.ts`.
- `proxy-print/bundle` — the transfer bundle format literal in
  `src/utils/transfer/schema.ts` and `build-bundle.ts`. This is the
  compatibility contract with already-exported `.zip` bundles.
- The Cloudflare Worker name in `wrangler.jsonc`, the Sentry org and project
  slugs in `vite.config.ts`, the `package.json` name, and the GitHub repo slug.

Exported ZIP filenames (`print-my-proxy-preset-*.zip` etc.) are cosmetic — the
importer reads the manifest, not the filename — so those did get renamed.

## Gotchas

- **Settings store migrations.** `src/store/settingsStore.ts` is at persist
  version 11 with a migration chain from earlier versions. Any change to the
  persisted shape needs a version bump _and_ a migration step. The store uses a
  custom `PersistStorage` over `idb-keyval` rather than JSON so that
  `Uint8Array` base-PDF bytes survive via structured clone.
- **`enableBleedEdge` is bypassed in preview.** `computeCssVars` in
  `settingsStore.ts` hardcodes `const enableBleedEdge = true` with the real
  setting commented out, while `useGeneratePdf.ts` still honours the setting.
  Preview and PDF output can therefore disagree. Known inconsistency — don't
  "fix" it incidentally without checking why it was disabled.
- **PDF generation measures the live DOM.** `useGeneratePdf.ts` reads the
  rendered preview to derive crop geometry, so preview markup changes can alter
  PDF output. `src/workers/pdf-spec.ts` has snapshot tests; if a snapshot
  changes, verify the resulting PDF rather than just accepting it.
- **Two Vitest configs.** `vitest.config.ts` runs Node unit tests from `src/`
  and is what `npm test` uses. A second project defined inside `vite.config.ts`
  runs Storybook stories in headless Chromium. Playwright is only that browser
  provider; there are no e2e specs.
- **Worker files must stay bundler-friendly.** Everything in `src/workers/` is
  loaded as an ES module worker (`worker.format: "es"`). Keep the pure spec
  modules (`pdf-spec`, `pdf-types`, `pdf-render`, `silhouette-spec`) free of DOM
  dependencies so they stay unit-testable in Node.
- **`src/asm/imghelper.*` is generated** from `imghelper.c` via Emscripten.
  Don't hand-edit the `.js`, `.wasm` or `.d.ts`.
- `src/context/CutterContext.ts` enumerates a `CutterType` union with a single
  member (`silhouette`) — scaffolding, not dead code to remove.

## Git

- PRs target `trunk`.
- Conventional commits, e.g. `fix(preview): split card menu and drag gestures`.
- Releases go through the `manual-release.yml` workflow, which tags and opens a
  draft release; the tag triggers the production deploy. Don't bump the version
  in `package.json` by hand.
