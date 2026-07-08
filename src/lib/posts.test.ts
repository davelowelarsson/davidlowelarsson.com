import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_DESCRIPTIONS,
  filterByCategory,
  groupByYear,
  isVisible,
  postIdFromEntry,
  sortByPubDateDesc,
} from './posts';

const post = (overrides: Partial<{ pubDate: Date; draft: boolean }> = {}) => ({
  data: {
    pubDate: new Date('2026-01-01'),
    draft: false,
    ...overrides,
  },
});

describe('isVisible', () => {
  it('shows published posts regardless of draft mode', () => {
    expect(isVisible(post().data, false)).toBe(true);
    expect(isVisible(post().data, true)).toBe(true);
  });

  it('hides drafts in production (showDrafts = false)', () => {
    expect(isVisible(post({ draft: true }).data, false)).toBe(false);
  });

  it('shows drafts in previews (showDrafts = true)', () => {
    expect(isVisible(post({ draft: true }).data, true)).toBe(true);
  });
});

describe('filterByCategory', () => {
  const til = { data: { category: 'til' as const } };
  const essay = { data: { category: 'essay' as const } };

  it('keeps only posts of the given category', () => {
    expect(filterByCategory([til, essay, til], 'til')).toEqual([til, til]);
  });

  it('returns empty for a category with no posts', () => {
    expect(filterByCategory([essay], 'experiment')).toEqual([]);
  });
});

describe('CATEGORY_DESCRIPTIONS', () => {
  it('has a description for every category — category pages teach the term', () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_DESCRIPTIONS[category], `missing description for ${category}`).toBeTruthy();
    }
  });
});

describe('groupByYear', () => {
  it('groups posts into year buckets, newest year first, posts newest-first within', () => {
    const p2026 = post({ pubDate: new Date('2026-07-01') });
    const p2026b = post({ pubDate: new Date('2026-01-15') });
    const p2013 = post({ pubDate: new Date('2013-09-30') });

    const groups = groupByYear([p2013, p2026b, p2026]);

    expect(groups.map((g) => g.year)).toEqual([2026, 2013]);
    expect(groups[0]?.posts).toEqual([p2026, p2026b]);
    expect(groups[1]?.posts).toEqual([p2013]);
  });

  it('returns empty for no posts', () => {
    expect(groupByYear([])).toEqual([]);
  });
});

describe('postIdFromEntry', () => {
  it('uses the bundle folder name as the post id', () => {
    expect(postIdFromEntry('2026/draft-preview-pipeline/index.md')).toBe('draft-preview-pipeline');
  });

  it('accepts .mdx bundles too', () => {
    expect(postIdFromEntry('2026/embed-test-fixture/index.mdx')).toBe('embed-test-fixture');
  });

  it('ignores intermediate folders — organization never changes URLs', () => {
    expect(postIdFromEntry('2026/07/some-note/index.md')).toBe('some-note');
    expect(postIdFromEntry('deep/nested/tree/some-note/index.mdx')).toBe('some-note');
  });

  it('throws on a non-bundle entry instead of minting a broken id', () => {
    expect(() => postIdFromEntry('loose-file.md')).toThrow();
    expect(() => postIdFromEntry('2026/some-note/notes.md')).toThrow();
  });
});

describe('sortByPubDateDesc', () => {
  it('orders posts newest first', () => {
    const oldest = post({ pubDate: new Date('2024-06-01') });
    const newest = post({ pubDate: new Date('2026-07-01') });
    const middle = post({ pubDate: new Date('2025-01-15') });

    expect(sortByPubDateDesc([oldest, newest, middle])).toEqual([newest, middle, oldest]);
  });

  it('does not mutate the input array', () => {
    const posts = [
      post({ pubDate: new Date('2024-01-01') }),
      post({ pubDate: new Date('2026-01-01') }),
    ];
    const original = [...posts];

    sortByPubDateDesc(posts);

    expect(posts).toEqual(original);
  });
});
