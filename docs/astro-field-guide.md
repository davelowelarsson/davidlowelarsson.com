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
