import { getCollection } from 'astro:content';
import { SHOW_DRAFTS } from 'astro:env/server';
import type { APIContext } from 'astro';
import { isVisible, sortByPubDateDesc } from '../lib/posts';
import { AUTHOR } from '../lib/seo';

export async function GET(context: APIContext) {
  const site = context.site ?? new URL('https://davidlowelarsson.com');
  const posts = sortByPubDateDesc(
    (await getCollection('posts')).filter((post) => isVisible(post.data, SHOW_DRAFTS)),
  );

  const lines = [
    `# ${AUTHOR.name}`,
    '',
    '> The notebook, not the résumé: essays, TILs, and home-lab experiments from',
    '> a platform engineer with roots in visual effects, 3D, and digital art.',
    '> Posts are categorized as essay, til (Today I Learned), experiment, or project.',
    '',
    '## Posts',
    '',
    ...posts.map((post) => {
      const url = new URL(`/posts/${post.id}/`, site).href;
      const description = post.data.description ? `: ${post.data.description}` : '';
      return `- [${post.data.title}](${url})${description}`;
    }),
    '',
    '## Feeds',
    '',
    `- [RSS](${new URL('/rss.xml', site).href})`,
    `- [Sitemap](${new URL('/sitemap-index.xml', site).href})`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
