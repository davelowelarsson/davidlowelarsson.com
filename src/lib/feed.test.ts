import { describe, expect, it } from 'vitest';
import { toFeedItems } from './feed';

const post = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  data: {
    title: `Title of ${id}`,
    description: `About ${id}`,
    pubDate: new Date('2026-06-01'),
    draft: false,
    ...overrides,
  },
});

describe('toFeedItems', () => {
  it('maps posts to feed items linking to their post page', () => {
    const items = toFeedItems([post('a-note')], false);

    expect(items).toEqual([
      {
        title: 'Title of a-note',
        description: 'About a-note',
        pubDate: new Date('2026-06-01'),
        link: '/posts/a-note/',
      },
    ]);
  });

  it('never includes drafts when showDrafts is off (production feed)', () => {
    const items = toFeedItems([post('published'), post('secret', { draft: true })], false);

    expect(items).toHaveLength(1);
    expect(items[0]?.link).toBe('/posts/published/');
  });

  it('includes drafts in preview feeds, consistent with pages', () => {
    const items = toFeedItems([post('secret', { draft: true })], true);

    expect(items).toHaveLength(1);
  });

  it('orders items newest first', () => {
    const items = toFeedItems(
      [
        post('old', { pubDate: new Date('2026-01-01') }),
        post('new', { pubDate: new Date('2026-07-01') }),
      ],
      false,
    );

    expect(items.map((i) => i.link)).toEqual(['/posts/new/', '/posts/old/']);
  });
});
