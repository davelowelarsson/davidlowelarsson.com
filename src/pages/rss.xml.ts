import { getCollection } from 'astro:content';
import { SHOW_DRAFTS } from 'astro:env/server';
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { toFeedItems } from '../lib/feed';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts');

  return rss({
    title: 'David Lowe Larsson',
    description:
      'Notes and essays on technical leadership, DORA metrics, platform engineering, and the occasional experiment.',
    site: context.site ?? 'https://davidlowelarsson.com',
    items: toFeedItems(posts, SHOW_DRAFTS),
    customData: '<language>en</language>',
  });
}
