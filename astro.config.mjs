// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';

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
    if (!path.endsWith('index.md')) continue;
    const slug = path.split('/').at(-2);
    const pubDate = readFileSync(join(base, path), 'utf8').match(/^pubDate:\s*(\S+)/m)?.[1];
    if (slug && pubDate) dates.set(slug, new Date(pubDate).toISOString());
  }
  return dates;
}

const postLastmod = postDates();

// https://astro.build/config
export default defineConfig({
  site: 'https://davidlowelarsson.com',
  integrations: [
    sitemap({
      serialize(item) {
        const slug = item.url.match(/\/posts\/([^/]+)\/$/)?.[1];
        const lastmod = slug && postLastmod.get(slug);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  env: {
    schema: {
      SHOW_DRAFTS: envField.boolean({
        context: 'server',
        access: 'public',
        default: false,
      }),
    },
  },
});
