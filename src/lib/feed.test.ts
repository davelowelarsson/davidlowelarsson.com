import { describe, expect, it } from 'vitest';
import { toFeedItems } from './feed';

const SITE = 'https://davidlowelarsson.com';

const post = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  body: `Some **bold** thoughts about ${id}.`,
  data: {
    title: `Title of ${id}`,
    description: `About ${id}`,
    pubDate: new Date('2026-06-01'),
    category: 'til' as const,
    draft: false,
    tags: ['astro'],
    ...overrides,
  },
});

describe('toFeedItems', () => {
  it('maps posts to feed items linking to their post page', () => {
    const [item] = toFeedItems([post('a-note')], false, SITE);

    expect(item).toMatchObject({
      title: 'Title of a-note',
      description: 'About a-note',
      pubDate: new Date('2026-06-01'),
      link: '/posts/a-note/',
    });
  });

  it('renders the full markdown body as HTML content', () => {
    const [item] = toFeedItems([post('a-note')], false, SITE);

    expect(item?.content).toContain('<strong>bold</strong>');
  });

  it('carries category and tags as feed categories', () => {
    const [item] = toFeedItems(
      [post('a-note', { category: 'essay', tags: ['dora', 'ci'] })],
      false,
      SITE,
    );

    expect(item?.categories).toEqual(['essay', 'dora', 'ci']);
  });

  it('strips relative images from content — their URLs do not exist on the server', () => {
    const relative = post('with-diagram');
    relative.body = 'Before ![diagram](./diagram.svg) after.';

    const [item] = toFeedItems([relative], false, SITE);

    expect(item?.content).not.toContain('<img');
    expect(item?.content).toContain('Before');
  });

  it('exposes the cover as media:content — never embedded in content (readers would show it twice)', () => {
    const cover = { src: '/_astro/cover.hash.png', width: 800, height: 500, format: 'png' };
    const [item] = toFeedItems([post('with-cover', { cover, coverAlt: 'A cover' })], false, SITE);

    expect(item?.content).not.toContain('<img');
    expect(item?.customData).toContain(
      `<media:content url="${SITE}/_astro/cover.hash.png" medium="image"`,
    );
  });

  it('emits no media customData for posts without a cover', () => {
    const [item] = toFeedItems([post('plain')], false, SITE);

    expect(item?.customData).toBeUndefined();
  });

  it('never includes drafts when showDrafts is off (production feed)', () => {
    const items = toFeedItems([post('published'), post('secret', { draft: true })], false, SITE);

    expect(items).toHaveLength(1);
    expect(items[0]?.link).toBe('/posts/published/');
  });

  it('includes drafts in preview feeds, consistent with pages', () => {
    expect(toFeedItems([post('secret', { draft: true })], true, SITE)).toHaveLength(1);
  });

  it('orders items newest first', () => {
    const items = toFeedItems(
      [
        post('old', { pubDate: new Date('2026-01-01') }),
        post('new', { pubDate: new Date('2026-07-01') }),
      ],
      false,
      SITE,
    );

    expect(items.map((i) => i.link)).toEqual(['/posts/new/', '/posts/old/']);
  });
});
