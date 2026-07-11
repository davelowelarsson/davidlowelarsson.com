# Astro Field Guide

A running ledger of Astro concepts as this project introduces them. Each PR
that touches something new appends 3–6 lines here. Read in order — it follows
how the project actually grew.

## Scaffold (2026-07-07)

- **`.astro` files** have a frontmatter script (between `---` fences, runs at
  build time) and a template below. Zero JS ships to the browser by default.
  Docs: https://docs.astro.build/en/basics/astro-components/
- **Content collections** (`src/content.config.ts`) turn folders of markdown
  into typed, queryable data. The `glob()` loader reads `src/content/posts/`;
  the zod schema validates every file's frontmatter at build time — a bad
  `pubDate` fails the build, not production.
  Docs: https://docs.astro.build/en/guides/content-collections/
- **`astro:env`** (schema in `astro.config.mjs`) gives type-safe env vars.
  `SHOW_DRAFTS` is read at build time via `import { SHOW_DRAFTS } from
  'astro:env/server'` — for a static site, "server" means "during the build".
  Docs: https://docs.astro.build/en/guides/environment-variables/
- **Routing is file-based**: `src/pages/posts/index.astro` → `/posts/`,
  `[slug].astro` + `getStaticPaths()` → one page per collection entry.
  Docs: https://docs.astro.build/en/guides/routing/
- **Container API** (`astro/container`) renders a component to an HTML string
  inside Vitest — that's how `PostList.test.ts` asserts on markup without a
  browser. Docs: https://docs.astro.build/en/reference/container-reference/
- **Markdown pipeline**: Astro 7's native processor ("Sätteri") handles GFM,
  frontmatter, and heading anchors with zero config. remark/rehype plugins
  are opt-in via `@astrojs/markdown-remark` if ever needed.
  Docs: https://docs.astro.build/en/guides/markdown-content/

## Kitchen-sink content + post bundles (2026-07-07, PR #15)

- **`generateId` on the glob loader** decouples post IDs (→ URLs) from file
  layout: our posts live in `year/<slug>/index.md` bundles, but the ID is just
  the bundle folder name, so reorganizing folders never breaks URLs.
  Docs: https://docs.astro.build/en/reference/content-loader-reference/
- **SVG + `currentColor` gotcha**: markdown images render as `<img>`, and an
  SVG loaded that way resolves `currentColor` to black — invisible on dark
  backgrounds. Fix: a `<style>` inside the SVG setting `color` with a
  `prefers-color-scheme` media query (media queries DO apply inside
  `<img>`-loaded SVGs; inherited page styles do NOT).
- **Relative image paths in markdown** (`![alt](./diagram.svg)`) are resolved
  and hashed by Astro's asset pipeline at build time — colocated assets move
  with their bundle. Docs: https://docs.astro.build/en/guides/images/#images-in-markdown-files

## Design round 1 (2026-07-07)

- **`image()` schema helper**: `schema: ({ image }) => z.object({ cover:
  image().optional() })` turns a frontmatter path into ImageMetadata (src +
  intrinsic width/height) at build — that's what lets the post list render
  cover thumbnails with reserved space (no layout shift).
  Docs: https://docs.astro.build/en/guides/images/#images-in-content-collections
- **SVG intrinsic size**: an SVG with only a `viewBox` has no intrinsic
  dimensions in an `<img>` — the browser can't reserve space and the layout
  shifts. Explicit `width`/`height` on the SVG root fixes it.

## RSS + sitemap (2026-07-07, issue #5)

- **Static endpoints**: any `src/pages/*.ts` exporting `GET` becomes a file at
  build time — `rss.xml.ts` renders once into `dist/rss.xml`, no server.
  Docs: https://docs.astro.build/en/guides/endpoints/
- **`@astrojs/rss`** takes `{ title, description, site, items }`; items come
  from `getCollection()` mapped through our pure `toFeedItems()` (same
  `isVisible` filter as pages — one draft gate for everything).
- **`@astrojs/sitemap`** is config-only: it walks the *built* pages, so drafts
  are excluded in production automatically. Served at `/sitemap-index.xml`,
  pointed to by `public/robots.txt`.

## Discoverability (2026-07-07, issue #8)

- **`set:html` + JSON.stringify** is the Astro idiom for JSON-LD:
  `<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />` —
  builders are pure functions in `src/lib/seo.ts`, unit-tested.
- **OG images must be raster** — crawlers ignore SVG, so posts fall back to
  `/og-default.png` unless their cover is png/jpg. The default card was
  rendered from HTML via `playwright screenshot` (repeatable: scratchpad
  og-card.html → 1200×630 png).
- **Layout props as the SEO surface**: Base.astro takes ogType/ogImage/
  publishedTime/jsonLd so each page declares its own semantics — pages stay
  dumb, the layout owns the head.

## Site hygiene (2026-07-07, issue #12)

- **`src/pages/404.astro` is the whole convention**: Astro builds it to
  `dist/404.html` automatically, no routing config needed. Workers static
  assets needs one extra nudge — `assets.not_found_handling: "404-page"` in
  `wrangler.jsonc` — to serve that file (with a real 404 status) for any
  unmatched request instead of a generic platform error.
  Docs: https://docs.astro.build/en/basics/astro-components/#page-templates
- **`public/_headers`**: Cloudflare Workers static assets reads this file
  natively and applies the rules at the edge on every request — it is
  invisible to `astro dev`/`astro preview`, so header behavior can only be
  verified against a deployed URL (e.g. securityheaders.com). Kept the CSP
  honest against what the site actually ships: `'unsafe-inline'` for
  `style-src` (Astro's scoped `<style>` tags) and `script-src` (inline
  JSON-LD), plus an explicit allowance for the Cloudflare Web Analytics
  beacon host.
- **Optional client env vars**: `envField.string({ context: 'client',
  access: 'public', optional: true })` in `astro.config.mjs` gives a var
  that's `undefined` when unset, importable from `astro:env/client` inside
  a component's frontmatter. `CLOUDFLARE_ANALYTICS_TOKEN` uses this so the beacon
  `<script>` in Base.astro is skipped entirely (not just empty) in local
  dev and CI, where the token is never configured.
  Docs: https://docs.astro.build/en/guides/environment-variables/

## RSS in-body images (2026-07-07, issue #19)

- **`import.meta.glob(..., { eager: true, import: 'default' })`** on an image
  pattern returns `Record<string, ImageMetadata>` — every matching file is
  already run through Astro's asset pipeline at build time, so `.src` is the
  real hashed `/_astro/...` URL, no per-file `getImage()` call needed.
  Docs: https://vite.dev/guide/features.html#glob-import
- **`entry.filePath`**: every content-collection entry loaded via the `glob()`
  loader carries `filePath` — the project-root-relative path of its source
  file (e.g. `src/content/posts/2026/slug/index.md`). It's the only way to
  resolve a markdown image's relative `src` (`./diagram.svg`) back to a real
  file, since `getCollection()` results don't otherwise know where they came
  from on disk.

## Image pipeline + lightbox (2026-07-07, issue #9)

- **`image.layout` + `image.responsiveStyles`** in astro.config.mjs apply
  globally to every processed image — `<Image>`/`<Picture>` components *and*
  plain Markdown `![]()` images — so `srcset`/`sizes`/`loading="lazy"` are
  automatic, zero per-image config. Docs:
  https://docs.astro.build/en/guides/images/#responsive-images
- **SVG vs. raster**: Astro can't rasterize vectors, so an SVG referenced in
  Markdown gets the `layout` attributes but only *one* `srcset` candidate
  (itself) — no real responsiveness. A raster image (`workbench.png` in the
  3D-art-to-platform-engineering post) is what actually proves the pipeline:
  multiple width candidates in `srcset`, verified in
  `e2e/image-pipeline.spec.ts`.
- **`responsiveStyles` ships as a virtual CSS module** imported by the
  compiled `<Image>`/`<Picture>` components — since this codebase only uses
  Markdown images (no `<Image>` component anywhere), that CSS never actually
  gets bundled. The `data-astro-image` attributes still land on every
  Markdown image either way; they're just inert without the component. Net
  effect here: zero layout risk from turning this flag on.
- **Native `<dialog>` lightbox**: `showModal()` gets Escape-to-close for
  free; backdrop-click needs one JS check (`event.target === dialog`, since
  `::backdrop` isn't a real descendant). Progressive enhancement — with JS
  disabled, article images are just images, no dead click affordance. Docs:
  https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog

## Obsidian publish workflow (2026-07-07, issue #7)

- **Excalidraw-as-SVG convention**: an Excalidraw sketch drawn in Obsidian
  (Auto-export SVG, transparent background) is committed as a plain `.svg`
  colocated with its post, referenced with the same relative markdown syntax
  as any other image (`![alt](./sketch.excalidraw.svg)`). No canvas, no
  client JS — it's asset-pipeline-processed exactly like a hand-drawn diagram
  SVG; the only difference is who drew it and with what tool.
- **Dark-mode filter trick**: unlike this repo's own diagrams (which use
  `currentColor` + an internal `prefers-color-scheme` `<style>`, see the
  kitchen-sink entry above), an Excalidraw export hardcodes its stroke colors
  — dark ink on a transparent background, illegible on a dark page. Rather
  than edit every exported SVG, a global selector in Base.astro,
  `img[src*='excalidraw']`, applies `filter: invert(0.92) hue-rotate(180deg)`
  inside a `prefers-color-scheme: dark` block: inverting lightness flips dark
  strokes to light, and the hue rotation undoes invert's side effect of also
  flipping any hue-bearing accent colors, so a red annotation stays
  recognizably red instead of turning cyan. The filter targets the `<img>` in
  the page, not the SVG file, so one rule covers every current and future
  Excalidraw export with zero per-file work.
  Docs: https://developer.mozilla.org/en-US/docs/Web/CSS/filter-function/invert

## Mermaid diagrams (2026-07-07, issue #6)

- **Sätteri vs. unified**: Astro 7's native processor ("Sätteri") has no
  remark/rehype plugin hooks, so a mermaid-rendering approach has to be
  processor-independent. `markdown.syntaxHighlight.excludeLangs: ['mermaid']`
  in `astro.config.mjs` just tells Shiki to leave that one fenced-code
  language alone — the block passes through as plain
  `<pre><code class="language-mermaid">` (verified by inspecting `dist/`
  output, not assumed), which a client script can then find and replace.
  This is what keeps the codebase on Sätteri instead of being forced onto
  `@astrojs/markdown-remark`/unified just to support one diagram type. Docs:
  https://docs.astro.build/en/reference/configuration-reference/#markdownsyntaxhighlight
- **Client-side over SSR (`rehype-mermaid`)**: SSR rendering needs
  unified() *and* a Playwright-driven build step just to rasterize diagrams
  ahead of time — two new pipeline dependencies for a feature most pages
  don't use. Client-side means a ~30-line script that only pays mermaid's
  cost on the pages that actually have a diagram.
- **Lazy dynamic `import('mermaid')`**: `Mermaid.astro`'s script queries for
  `pre > code.language-mermaid` first and returns early if there are none —
  the `import('mermaid')` line is never reached on pages without a diagram,
  so Vite's code-splitting never fetches that chunk there (verified in
  `e2e/mermaid.spec.ts` via `page.on('request')`). On a page that does have
  a diagram, mermaid's real cost shows up: ~30 lazy chunks, ~745 KB
  uncompressed JS (dagre for layout, roughjs for the sketch-style render,
  d3 internals) — paid once, only where it's used, and it's a real ES
  module specifier so it bundles under `/_astro/` same-origin, which is
  what satisfies the CSP's `script-src 'self'` without a CDN allowance.
- **Theme via `matchMedia`, not a CSS toggle**: mermaid renders to static
  SVG at call time, so "theme-aware" means picking `dark` vs. `neutral` in
  `mermaid.initialize()` *before* rendering
  (`matchMedia('(prefers-color-scheme: dark)').matches`), not styling the
  output after the fact.

## Whitespace collapse at tag boundaries (2026-07-07, PR #31)

- **Astro strips the newline between text and an inline element boundary**:
  `I write\n<a>essays</a>` renders as "writeessays", and `</a>\ncaptured`
  renders as "notescaptured". Prose with inline links must keep each anchor
  fully mid-line (line breaks only between plain words). An e2e test asserts
  the rendered spacing on the landing page so copy edits can't silently
  reintroduce it. This differs from plain HTML, where such newlines collapse
  to a single space.

## Flash-free text swap: inline `define:vars` script (2026-07-07)

- **Bundled vs inline decides *when* a script runs.** A bare `<script>` is
  processed/bundled by Astro into a **deferred module** — it runs *after* first
  paint, which makes a client-side text swap visibly flash (canonical → random).
  A `<script define:vars={{…}}>` is rendered **inline** (`define:vars` implies
  `is:inline`): a classic, parser-blocking script. Placed immediately after the
  target element, it executes *before the browser paints that element*, so the
  swap is invisible — the same anti-FOUC trick theme-toggle scripts use.
- **`define:vars` passes server data into an inline script** (JSON-serializable
  only), so `BYLINES` stays the single source of truth in `src/lib/bylines.ts`
  rather than being hand-copied into the markup. Only the trivial index math is
  inlined; the pure `pickByline` + its Vitest coverage remain the spec.
- **Progressive enhancement holds**: the canonical `BYLINES[0]` is
  server-rendered, so crawlers and no-JS visitors get real content; randomness
  lives in the browser because a static build is frozen per deploy — "different
  on each reload" can only be a client concern.
- **Cost**: an inline `define:vars` script is duplicated per component instance
  and is not bundled/minified — fine for a one-per-page tagline, not for a
  widely-reused component. Doc:
  https://docs.astro.build/en/reference/directives-reference/#definevars

## Deterministic CI path filtering (2026-07-07)

- **`dorny/paths-filter@v4`** (`.github/paths-filter.yml`) decides whether a
  change actually touches the built site, so docs-only changes skip
  build/test/deploy. The manifest is a fail-safe **denylist** (`'**'` then
  `!docs/**`, `!*.md`, …) — anything unlisted counts as an app change, so a new
  top-level dir triggers a build by default instead of being silently skipped.
  `*.md` matches root-level docs only (picomatch `*` doesn't cross `/`), so
  `src/content/**` markdown — which *is* the app — still builds and deploys.
- **`predicate-quantifier: 'every'` is mandatory for a denylist.** The default
  `some` makes a file match if it matches *any* rule — and `'**'` matches
  everything, so nothing is ever excluded (the filter becomes a silent no-op).
  `every` requires a file to match *all* rules, so `!docs/**` etc. actually
  subtract. picomatch runs with `dot: true`, so dotfiles (`.node-version`,
  `.github/**`) still match `'**'`.
- **`base` only matters on push.** With the default token, PR events detect
  changes against the PR base via the REST API (needs `pull-requests: read`)
  and ignore `base`. On push to `main` we set `base: github.ref_name` so it
  diffs against the commit *before* the push (long-lived-branch mode) rather
  than an implicit default-branch merge-base.
- **The required check must always report — and fail loudly if detection
  breaks.** `quality` is the only required status check on `main`. A job-level
  `if` that evaluates false makes it "skipped", which branch protection can
  treat as *passing* — so a broken `changes` job could let a PR merge untested.
  Fix: `quality` runs with `if: ${{ always() }}`, gates its real work with
  step-level `if: needs.changes.outputs.app == 'true'`, and has a guard step
  that `exit 1`s when `needs.changes.result != 'success'`. `deploy-preview`/
  `deploy-production` aren't required checks, so a job-level `if` is fine there.

## Inline MDX process cards (2026-07-08)

- **A reusable Astro component inside MDX** works best when it explains the
  paragraph it sits next to. `ProcessStepCard.astro` takes one typed step from
  a post-local config and renders a visual insert without wrapping the article.
- **Static before clever:** the card has no client script, observer, or scroll
  state. The prose stays in the normal reading frame, and the visual appears
  immediately after the related idea on desktop and mobile.
- **Post-local data, shared component:** `flow.ts` owns the Slack/Spotify sample
  arrays for this story, while `src/lib/process-rail.ts` owns validation and
  reusable types for future MDX explainers.
- **Redraw sensitive screenshots:** when real screenshots contain people, names,
  or avatars, the post uses anonymized UI-shaped cards instead of committing
  masked screenshots. The point is to teach the workflow, not preserve pixels.
- **Static CSS charts before chart libraries:** `WrappedSnapshot.astro` renders
  aggregate-only bars/tags from typed post-local data. No client JS is needed
  for a small explanatory visualization, and caveats (like a skewed playlist
  year) live in the component data next to the numbers.
- **Main article links as a component:** `ArticleLinks.astro` gives posts one
  consistent place for source repos, demos, references, or project pages. It
  keeps important outbound links scannable without turning prose paragraphs into
  link dumps, and external links get `target="_blank" rel="noreferrer"` in one
  reusable component.

## MDX media layout components (2026-07-09)

- **Prefer components over raw MDX styles** for repeated media layouts.
  `ImagePair.astro` and `ArticleImage.astro` keep crop, sizing, and responsive
  `Image` props out of post prose, and avoid MDX parser edge cases around raw
  `<style>` blocks.
- **Dynamic lightbox content needs global CSS.** Images cloned into the dialog
  by client JS do not carry Astro's scoped style attributes, so Lightbox's fit
  rules use `style is:global` while component-local layout styles stay scoped.
- **Video posters are optional.** A post can pass a representative local poster,
  or omit it and let the browser use native video metadata/first-frame behavior
  instead of forcing a misleading still image.

## YouTube embed facade + MDX support (2026-07-08, issue #37)

- **`@astrojs/mdx` adds no UI framework.** MDX is JSX-in-Markdown syntax, not
  React/Vue/Svelte — `mdx()` just teaches Astro's compiler to parse `.mdx`
  files and lets them import and use `.astro` components (like `<YouTube />`)
  directly in the post body. `.md` and `.mdx` coexist in the same content
  collection with zero change to plain-Markdown posts.
  Docs: https://docs.astro.build/en/guides/integrations-guide/mdx/
- **Widening the glob loader is one string** (`**/index.md` →
  `**/index.{md,mdx}` in `content.config.ts`), but `generateId` still has to
  turn an entry path into a slug — so `postIdFromEntry` in `src/lib/posts.ts`
  now accepts `index.md` or `index.mdx` (one id function, no duplication).
- **Click-to-load facade, not an eager iframe.** `YouTube.astro` renders a
  static poster + `<button>` inside a `position: relative` box with
  `aspect-ratio: 16/9` — the ratio reserves the box's height before any image
  loads, so there's no layout shift regardless of the poster's own intrinsic
  size. The real `<iframe>` (host: `youtube-nocookie.com`, the
  reduced-tracking embed variant, never `youtube.com`) is created by a client
  script only after a real click — nothing Google-owned is ever requested
  until then. Same hand-rolled pattern as `Mermaid.astro`/`Lightbox.astro`: a
  bundled, same-origin `<script>` (satisfies CSP `script-src 'self'` with no
  CDN allowance), no `lite-youtube-embed` dependency.
  Docs: https://docs.astro.build/en/guides/client-side-scripts/
- **CSP needed exactly one new directive.** `default-src 'self'` has no
  `frame-src`, so an embedded iframe was blocked at the edge outright. Added
  `frame-src https://www.youtube-nocookie.com` to `public/_headers` and
  changed nothing else — every other directive (and the CSP's general
  "verify against the deployed URL" caveat, since `_headers` is invisible to
  `astro dev`/`preview`) is unchanged from the site-hygiene entry above.

## Scheduled publishing without a server (2026-07-08)

- **A static site can still "publish on a date"** by turning the go-live check
  into a build-time visibility gate. `isVisible` now returns
  `showDrafts || (!draft && liveFromHasPassed(liveFrom, now))`, and a daily
  GitHub Actions cron (`scheduled-publish.yml`) rebuilds + redeploys production —
  so a post with a future `liveFrom` appears on its date with no server, no
  flag-flipping, and no CI writing to the repo. The gate lives in one function,
  so pages, RSS, sitemap, and llms.txt all honour it — no leak in one surface.
- **`liveFrom` is compared as a string, not a `Date`, on purpose.**
  `z.coerce.date()` parses a bare date as UTC and a bare datetime as
  *build-machine local* — both wrong for "David writes Swedish local time".
  Instead we hold the wall-clock string and compare it against *now formatted in
  Europe/Stockholm* (`Intl.DateTimeFormat` with `timeZone`, lexical compare of
  zero-padded `YYYY-MM-DDTHH:mm`) — DST-correct, no offset math, CI-location
  independent. **Gotcha:** YAML parses an *unquoted* `liveFrom: 2026-07-09` into
  a `Date`, so the schema is `z.union([z.string(), z.date()])` and normalizes a
  Date back to its calendar `YYYY-MM-DD` (UTC components). A bare date can stay
  unquoted; a value with a time must be quoted. `pubDate` stays
  `z.coerce.date()` — the displayed date, decoupled from go-live.
- **Idempotent + self-healing cron.** The job is an unconditional prod build +
  `wrangler deploy`; re-running it changes nothing if no post crossed its
  `liveFrom`, and a missed day is caught by the next run. `production-build.test`
  gained a live guard that fails if a not-yet-live scheduled post reaches any
  output — the same safety net that already guards drafts. Daily cadence means
  date-level precision: a `liveFrom` time only takes effect from the morning run
  onward (bump the cron to hourly for same-day timing). `liveFrom` is validated
  as a *real* calendar date/time (`isRealWallClock`), so `2026-13-40` fails the
  build rather than silently never publishing.

## Self-hosted media that never gates the build (2026-07-08, issue #10)

- **`<Video>`/`<Audio>` need no framework and no bundled script at all** —
  unlike `YouTube.astro`'s click-to-load facade, native `<video controls
  preload="metadata">`/`<audio controls preload="metadata">` already defer
  the actual media fetch until the reader presses play; Astro's job is just
  to resolve `src` to an absolute R2 URL (`mediaUrl()` in `src/lib/media.ts`)
  and pass through a `<slot />` so a post can add `<track kind="captions">`
  children. A page with no `<Video>`/`<Audio>` ships zero extra bytes.
  Docs: https://docs.astro.build/en/basics/astro-components/#component-props
- **The image pipeline and the media pipeline are deliberately separate.**
  `Video`'s `poster` prop reuses the same `ImageMetadata | string` shape as
  `YouTube.astro`'s poster (an `<Image />` for real optimization, or a raw
  path) — but the video/audio file itself never goes through Astro's asset
  pipeline; it is a plain URL string resolved at render time, because Astro
  has no story for optimizing or bundling files that live outside the repo.
- **A committed manifest is the astro-adjacent glue, not an Astro feature.**
  `src/lib/media-manifest.ts` is pure Node/TS with no Astro imports, run by
  two plain scripts (`media:sync`, `media:check`) via `node
  --experimental-strip-types` — no `tsx`/`ts-node` dependency needed since
  Node 22.6+ ships TypeScript type-stripping behind that flag. This keeps
  the R2 lifecycle tooling outside the Vite/Astro build entirely, which is
  exactly why it can never accidentally become a build-time dependency.
- **CSP got one more narrow directive.** `media-src https://assets.davidlowelarsson.com`
  was added to `public/_headers`, same pattern as issue #37's `frame-src`
  addition — nothing else changed.

## Progressive-enhancement of live third-party data (2026-07-08)

- **Live data on a static site, without a build-time coupling.** The saltast.com
  experiment tally isn't known at build (it's live) and the site ships no
  third-party runtime by default — so the `saltast.com` link renders statically
  and a bundled same-origin `<script>` fetches `/api/summary` on load, filling
  every `[data-saltast-tally]` element. No JS → just the link; fetch fails or the
  payload is malformed (`parseSummary` returns null) → "offline". Validation +
  formatting are pure in `src/lib/saltast.ts` (tested); the fetch/DOM is the edge.
- **Two no-CLS strategies for "append live data", chosen by position.** In the
  footer the tally is the LAST content on the page, so filling it grows only
  downward — the link never moves and nothing above shifts (the saltast row is
  forced full-width via `flex-basis: 100%` so it can't reflow onto/off another
  line). Mid-page (the experiments-category callout) can't rely on that, so it
  reserves `min-height` (~2 lines, mobile-safe) with a faint skeleton the script
  swaps in place — same footprint, no shift.
- **CSP `connect-src`.** A client fetch to another origin must be allow-listed —
  added `https://saltast.com` (David's own domain) beside `'self'`; the script is
  same-origin so `script-src 'self'` is untouched. `aria-live="polite"` lets a
  screen reader announce the update without interrupting. **CORS caveat:** the
  browser also needs the *response* to carry `Access-Control-Allow-Origin` — a
  200 that `curl` reads fine is still blocked in-page without it (degrades to
  "offline").
- **Feel-fast without lying.** Two latency tricks: `<link rel="preconnect">` warms
  the TLS/DNS to saltast before the fetch, and a **stale-while-revalidate**
  `sessionStorage` cache paints the previous tally instantly on repeat views then
  refreshes in the background — so only the first view waits. Colors are
  reinforcement, never the sole signal: each status is a colored dot *plus* its
  count and word ("2 up"), so it stays legible to colorblind readers and in a
  screen reader.

## Diagram readability: breakout + shared lightbox (2026-07-08)

- **Mermaid's `useMaxWidth` is the shrink knob.** It defaults to `true`, scaling
  the SVG to 100% of its container — which, in a 42rem prose column, is exactly
  why a wide `flowchart LR` renders at ~6px text. We keep it `true` (inline must
  never scroll sideways) and instead give the *container* more room.
  Docs: https://mermaid.js.org/config/schema-docs/config.html
- **`.breakout` escapes a narrow parent without a grid refactor.** `width:
  min(60rem, 100vw - 2rem)` + `position: relative; left: 50%; translateX(-50%)`
  re-centres a child wider than its parent on the viewport. Cheaper than
  restructuring `<body>` (which also holds header/footer) into a full-bleed CSS
  grid — same effect, one reusable class. Capped at 100vw−gutter so the page
  never gains a horizontal scrollbar. Josh Comeau's grid version is the
  documented upgrade if a real full-bleed language lands (#11).
- **Client-rendered content needs *delegated* listeners.** `Mermaid.astro`
  swaps its `<pre>` for a diagram `<div>` *after* `Lightbox.astro`'s script
  runs, so a one-shot `querySelectorAll` at load never sees a diagram. One
  `click` listener on `<article>` that walks `event.target.closest()` catches
  both images and async-inserted diagrams — the standard fix for
  progressively-enhanced DOM that arrives late.
- **Cloning an inline SVG into a `<dialog>` beats serialising it.**
  `svg.cloneNode(true)`, strip the `useMaxWidth` cap, pin width/height from
  `viewBox.baseVal` → it renders crisp at natural size, scroll-to-pan, no
  data-URI round-trip and no pan/zoom dependency.

## Teaser pages for Scheduled Posts (2026-07-11)

- **One route, two page shapes via `getStaticPaths` props.** `[slug].astro`'s
  `getStaticPaths` still emits every visible post, then — production only —
  pushes a second path per scheduled post with `props: { post, teaser: true }`.
  Same URL space, same file, one boolean deciding whether `render(post)` (and
  the article's og/JSON-LD) ever run. Docs:
  https://docs.astro.build/en/guides/routing/#dynamic-routes
- **`@astrojs/sitemap`'s `filter` option** takes the built page URL and
  returns a boolean — the one hook for excluding a page the crawl itself
  can't know is "not really live yet". Paired with a robots `noindex` meta
  (a new optional `Base.astro` prop) so a Teaser is reachable by direct link
  but invisible to search and to the sitemap.
- **A source-scan helper shared across a config file and a test.**
  `src/lib/scheduled-slugs.ts` is plain Node/TS (no Astro import) so both
  `astro.config.mjs` (evaluated before any content collection exists) and
  `production-build.test.ts`'s live guard read frontmatter the same way —
  one definition of "scheduled," not two that can drift.

## Rendering MDX in RSS (2026-07-11)

- **A collection entry's `body` is raw source, not feed-ready HTML.** For MDX
  that includes imports and component JSX, so RSS must call `render(entry)`
  and render its `Content` component rather than pass `body` to MarkdownIt.
  Docs: https://docs.astro.build/en/guides/content-collections/#rendering-body-content
- **One build-time Container turns all `Content` components into strings.**
  `rss.xml.ts` loads the MDX renderer once, renders every entry, then hands the
  resulting HTML to the existing sanitizer. The Container API is experimental,
  so this dependency stays isolated to the prerendered RSS endpoint and its
  production-build contract. Docs: https://docs.astro.build/en/reference/container-reference/
