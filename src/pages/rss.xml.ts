import { getCollection } from 'astro:content';
import { SHOW_DRAFTS } from 'astro:env/server';
import rss from '@astrojs/rss';
import type { APIContext, ImageMetadata } from 'astro';
import { buildImageManifest, toFeedItems } from '../lib/feed';

// Eager + `import: 'default'` gives each entry as the already-imported
// ImageMetadata (Astro's asset pipeline hashes and copies these at build
// time) — `image.src` is the real served `/_astro/...` URL. Glob keys are
// relative to this file, so `buildImageManifest` needs this file's
// project-root-relative directory ('src/pages') to line them up with each
// post's `filePath`.
const images = import.meta.glob<ImageMetadata>(
  '../content/posts/**/*.{png,jpg,jpeg,webp,gif,svg}',
  { eager: true, import: 'default' },
);
const imageManifest = buildImageManifest(images, 'src/pages');

export async function GET(context: APIContext) {
  const posts = await getCollection('posts');
  const site = (context.site ?? new URL('https://davidlowelarsson.com')).href;

  return rss({
    title: 'David Lowe Larsson',
    description:
      'Notes and essays on technical leadership, DORA metrics, platform engineering, and the occasional experiment.',
    site,
    xmlns: { media: 'http://search.yahoo.com/mrss/' },
    items: toFeedItems(posts, SHOW_DRAFTS, site, imageManifest),
    customData: '<language>en</language>',
  });
}
