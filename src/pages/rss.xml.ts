import { loadRenderers } from 'astro:container';
import { getCollection, render } from 'astro:content';
import { SHOW_DRAFTS } from 'astro:env/server';
import { getContainerRenderer as getMdxContainerRenderer } from '@astrojs/mdx/container-renderer';
import rss from '@astrojs/rss';
import type { APIContext, ImageMetadata } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { buildImageManifest, toFeedItems } from '../lib/feed';
import { isVisible } from '../lib/posts';

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
  const visiblePosts = posts.filter((post) => isVisible(post.data, SHOW_DRAFTS));
  const site = (context.site ?? new URL('https://davidlowelarsson.com')).href;
  const renderers = await loadRenderers([getMdxContainerRenderer()]);
  const container = await AstroContainer.create({ renderers });
  const renderedBodies = new Map(
    await Promise.all(
      visiblePosts.map(async (post) => {
        const { Content } = await render(post);
        return [post.id, await container.renderToString(Content)] as const;
      }),
    ),
  );

  return rss({
    title: 'David Lowe Larsson',
    description:
      'Notes, Essays, TILs, and home-lab experiments from David Lowe Larsson — platform engineering, flow, and roots in 3D art.',
    site,
    xmlns: { media: 'http://search.yahoo.com/mrss/' },
    items: toFeedItems(visiblePosts, SHOW_DRAFTS, site, imageManifest, renderedBodies),
    customData: '<language>en</language>',
  });
}
