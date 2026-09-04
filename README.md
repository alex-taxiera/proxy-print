# Print My Proxy

**[printmyproxy.com](https://printmyproxy.com)**

Print My Proxy lays out proxy playing cards for printing at home. Drop in card
images, tune bleed, cut guides and duplex alignment for your specific printer,
and export print-ready PDFs. It also generates the registration marks and DXF
cut lines that automatic cutters like the Silhouette Cameo need.

Everything runs in your browser. There is no account, no upload, and no server
holding your images — card data, settings and projects live in your browser's
IndexedDB, and PDFs are rendered locally in web workers.

## Features

**Getting cards in**

- Upload local image files, or drag and drop them onto the page.
- Import an [MPC Autofill](https://mpcfill.com) order XML; fronts, backs, slot
  counts and the default card back are all read from the file and the images
  are pulled from the MPC Autofill CDN.
- Paste a decklist and resolve it against [Scryfall](https://scryfall.com),
  with a configurable default import language and a picker for alternate
  printings.

**Layout**

- Card sizes: standard (63×88mm), Japanese (59×86mm), tarot (70×120mm), or
  custom.
- Page sizes: Letter, Legal, Tabloid, A4, A3, A3+, or custom, in inches or
  millimetres.
- Print modes: duplex, side-by-side, inline faces, fronts only, backs only.
- Per-face X/Y offsets and rotation to calibrate a duplex printer that doesn't
  land the back exactly on the front.
- Configurable grid columns, row and column gaps, with optional separate gaps
  for the back face.
- Bleed edge synthesis for borderless art, plus cut guides with adjustable
  colour, thickness, length and placement.

**Preview and editing**

- Paginated preview with zoom, drag-and-drop reordering, and multi-select.
- Per-card and bulk actions: duplicate, remove, download, move between pages,
  add or remove bleed, add or remove upscaling, revert to original.

**Output**

- Print-ready PDFs rendered in parallel across web workers, with a DPI cap
  (300–1200) and optional JPG conversion to keep file sizes manageable. Output
  is split automatically before hitting Chrome's 2GB blob limit.
- Auto-cutter support: generate a base PDF carrying Silhouette registration
  marks (including a borderless mode that moves marks to 3.5mm from the edge to
  fit 3×3 layouts), and export a matching DXF of rounded-rect cut lines.
- Optional AI upscaling of low-resolution art via TensorFlow.js, running on
  WebGPU where available and falling back to WebGL.

**Saving and sharing**

- Save layout settings as named presets, and card sets as named projects.
- Export either as a ZIP bundle containing the settings, base PDF bytes and
  image blobs, then import it elsewhere with name-collision resolution.

## Quick start

Requires **Node 24 or newer**.

```bash
git clone git@github.com:alex-taxiera/proxy-print.git
cd proxy-print
npm ci
npm run dev
```

The dev server binds to your LAN (`vite --host`) so you can test on a phone or
tablet. `npm run dev` also starts the Chakra typegen watcher; if you edit
`src/theme.ts` outside of it, run `npm run typegen` to regenerate theme types.

> The repo carries ~131MB of TensorFlow.js model weights in `public/models/`,
> so the initial clone is large.

## Scripts

| Script                         | What it does                                                  |
| ------------------------------ | ------------------------------------------------------------- |
| `npm run dev`                  | Vite dev server on the LAN, plus Chakra typegen in watch mode |
| `npm run build`                | Type-check every tsconfig project, then bundle                |
| `npm run preview`              | Build, then serve through the real Cloudflare Worker runtime  |
| `npm test`                     | Vitest in watch mode                                          |
| `npm run test:run`             | Vitest once                                                   |
| `npm run lint` / `lint:fix`    | ESLint                                                        |
| `npm run format` / `format:ci` | Prettier write / check                                        |
| `npm run check:pr`             | Typegen, lint, format check and build — the pre-commit gate   |
| `npm run typegen`              | Regenerate Chakra theme types from `src/theme.ts`             |
| `npm run storybook`            | Storybook on port 6006                                        |
| `npm run build-storybook`      | Static Storybook build                                        |
| `npm run deploy`               | Build and deploy to Cloudflare Workers                        |

A Husky pre-commit hook runs `npm run check:pr`, so commits are blocked on lint,
formatting and a clean build.

## Project structure

```
src/
├── App.tsx            Providers, plus a gate that waits for IndexedDB hydration
├── Layout.tsx         The only screen: header, preview, sidebar, bottom bar
├── index.tsx          Sentry init and the React root
├── theme.ts           Chakra system: tokens and component recipes
├── asm/               imghelper.c compiled to WASM — alpha-channel detection
├── components/
│   ├── BottomBar/     Pagination, preview actions, selection action bar
│   ├── Header/         Header, community banner, social links
│   ├── Preview/       Page grid, drag overlay, zoom, and Card/ internals
│   ├── Sidebar/       Uploader, settings form, base PDFs, DXF and bundle export
│   └── ui/            Chakra v3 snippet components and their recipes
├── context/           Images, selection, preview, settings schema, cutter,
│                      download and upscale queue managers
├── hooks/             useGeneratePdf, useTransfer, useUpscaleImage, and friends
├── queries/           Image fetching and the Scryfall client
├── store/             Persisted settings store, download progress store
├── utils/             Bleed, DXF, grid layout, base PDFs, decklist parsing,
│                      and the transfer/ bundle format
└── workers/           PDF render pipeline, Silhouette marks, zip and upscale
```

Elsewhere:

- `.storybook/` — Storybook config; stories run as a Vitest browser project.
- `.github/workflows/` — CI and deploys, see below.
- `.agents/skills/` — vendored Chakra UI agent skills, pinned by
  `skills-lock.json`. `.claude/skills/` symlinks to them.
- `.cursor/sentry.mdc` — Sentry usage rule for agents.
- `test/rats.xml` — a sample MPC Autofill order XML for manual testing.
- `public/models/` — TensorFlow.js weights for the upscaler.

## Configuration

Copy `.env.example` to `.env.local`. Every variable is optional; the app runs
with none of them set.

| Variable                  | Purpose                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `VITE_SENTRY_DSN`         | Sentry DSN. Unset disables error reporting.                                         |
| `VITE_SENTRY_ENV`         | Environment reported to Sentry; defaults to Vite's `MODE`.                          |
| `VITE_CLOUDFLARE_ORIGINS` | Comma-separated mirror hosts substituted for `cards.scryfall.io` when fetching art. |

In development, Vite proxies `/cdn-images` to the MPC Autofill CDN to work
around CORS. Production fetches the CDN directly.

## Testing

Unit tests are colocated in `src/` as `*.test.ts` and run in Node via
`vitest.config.ts` — they cover the pure layout, geometry, bleed, DXF, decklist
and bundle logic, including snapshot tests of the PDF operation spec.

Storybook stories run as a separate Vitest browser project (defined inside
`vite.config.ts`) in headless Chromium via Playwright. Playwright is only that
browser provider; there are no end-to-end specs.

## Deployment

The app deploys to Cloudflare Workers as an assets-only Worker with SPA
fallback. `wrangler.jsonc` defines two environments:

| Environment  | Domains                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- |
| `production` | `printmyproxy.com`, `proxyprint.taxiera.net` (legacy)                                    |
| `staging`    | `dev.printmyproxy.com`, `dev-proxyprint.taxiera.net` and `devprint.taxiera.net` (legacy) |

The Worker itself is still named `proxy-print`. Renaming it in Cloudflare would
create a new Worker and drop the custom domain bindings, so it keeps the
pre-rebrand slug.

Workflows in `.github/workflows/`:

- **`test-and-build.yml`** — install, typegen, lint, format check and build.
  Runs on PRs into `trunk`, and is called by every deploy workflow.
- **`deploy-staging.yml`** — deploys to staging on every push to `trunk`,
  skipping release commits.
- **`deploy-production.yml`** — deploys to production on a `v*` tag.
- **`deploy-preview.yml`** — manually dispatched; uploads a Worker version under
  a per-branch preview alias and reports the URL in the job summary.
- **`manual-release.yml`** — manually dispatched from `trunk`; bumps the
  version, tags it, and opens a draft release. Pushing the tag triggers the
  production deploy.

### Self-hosting

`Dockerfile` builds the app and serves `dist/` from nginx with an SPA fallback:

```bash
docker compose up --build   # http://localhost:3000
```

This path is independent of the Cloudflare deployment and isn't exercised by CI.

## Contributing

Run `npm run check:pr` before opening a pull request — the pre-commit hook does
this for you. PRs target `trunk`. Imports are sorted by a Prettier plugin, so
let `npm run format` order them rather than doing it by hand.

Agent-facing conventions and gotchas live in [`AGENTS.md`](./AGENTS.md).

## Community

[Join the Proxy Community Discord!](https://discord.gg/A5AkkyP8CU)

Want to design your own cards? Try [Card Anvil](https://cardanvil.com).

## License

[GNU Affero General Public License v3.0](./LICENSE)
