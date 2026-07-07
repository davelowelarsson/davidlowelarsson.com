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
