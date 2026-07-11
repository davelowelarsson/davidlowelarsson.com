// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';
import { futureScheduledSlugs } from './src/lib/scheduled-slugs.ts';

/**
 * slug → pubDate ISO string, read from post frontmatter. The sitemap
 * integration only sees built URLs, so per-page lastmod (the one sitemap
 * field search engines actually use) has to come from the source tree.
 */
function postDates() {
  const base = 'src/content/posts';
  const dates = new Map();
  for (const entry of readdirSync(base, { recursive: true })) {
    const path = String(entry);
    if (!/index\.mdx?$/.test(path)) continue;
    const slug = path.split('/').at(-2);
    const pubDate = readFileSync(join(base, path), 'utf8').match(/^pubDate:\s*(\S+)/m)?.[1];
    if (slug && pubDate) dates.set(slug, new Date(pubDate).toISOString());
  }
  return dates;
}

const postLastmod = postDates();

// Scheduled posts get a Teaser page (see src/pages/posts/[slug].astro) but
// must not show up in search results before they're real — same source scan
// the production-build test guards against, so the two can't drift apart.
// Snapshotted at config load; a build that straddles a liveFrom boundary can
// misfile one sitemap entry for a day. Accepted: the window is seconds, the
// teaser carries noindex regardless, and the daily rebuild self-heals it.
const scheduledSlugs = new Set(futureScheduledSlugs());

// https://astro.build/config
export default defineConfig({
  site: 'https://davidlowelarsson.com',
  // Every processed image (Markdown or <Image>) gets srcset/sizes + the
  // matching CSS for free — no per-image config. SVGs pass through
  // untouched (vector, no rasterization) so this only bites on raster art.
  // Docs: https://docs.astro.build/en/guides/images/#responsive-images
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
  // `mermaid` code blocks skip Shiki entirely and pass through as plain
  // `<pre><code class="language-mermaid">` — Mermaid.astro finds them by
  // that class and renders them client-side. Processor-independent (works
  // with Sätteri, Astro 7's default), so it doesn't force the pipeline back
  // to unified/@astrojs/markdown-remark.
  // Docs: https://docs.astro.build/en/reference/configuration-reference/#markdownsyntaxhighlight
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
  },
  // `mdx()` adds no UI framework — MDX files get JSX-in-markdown syntax so
  // Astro components (like `<YouTube />`) can be dropped straight into post
  // bodies, while plain `.md` posts keep working unchanged.
  // Docs: https://docs.astro.build/en/guides/integrations-guide/mdx/
  integrations: [
    sitemap({
      filter(page) {
        const slug = page.match(/\/posts\/([^/]+)\/$/)?.[1];
        return !slug || !scheduledSlugs.has(slug);
      },
      serialize(item) {
        const slug = item.url.match(/\/posts\/([^/]+)\/$/)?.[1];
        const lastmod = slug && postLastmod.get(slug);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
    mdx(),
  ],
  env: {
    schema: {
      SHOW_DRAFTS: envField.boolean({
        context: 'server',
        access: 'public',
        default: false,
      }),
      // Cloudflare Web Analytics site token. Left unset locally and in CI —
      // undefined means Base.astro skips rendering the beacon entirely.
      CLOUDFLARE_ANALYTICS_TOKEN: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
});
