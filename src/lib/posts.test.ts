import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_DESCRIPTIONS,
  filterByCategory,
  formatScheduleDate,
  groupByYear,
  isScheduled,
  isVisible,
  liveFromHasPassed,
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

  it('hides a non-draft with a future liveFrom in production', () => {
    const now = new Date('2026-07-20T00:00:00Z'); // Stockholm 02:00 (CEST)
    expect(isVisible({ draft: false, liveFrom: '2026-07-21' }, false, now)).toBe(false);
  });

  it('shows a scheduled (future liveFrom) post in previews', () => {
    const now = new Date('2026-07-20T00:00:00Z');
    expect(isVisible({ draft: false, liveFrom: '2026-07-21' }, true, now)).toBe(true);
  });

  it('shows a non-draft once its liveFrom has passed', () => {
    const now = new Date('2026-07-20T00:00:00Z');
    expect(isVisible({ draft: false, liveFrom: '2026-07-19' }, false, now)).toBe(true);
  });

  it('still hides a draft even when its liveFrom has passed', () => {
    const now = new Date('2026-07-20T00:00:00Z');
    expect(isVisible({ draft: true, liveFrom: '2026-01-01' }, false, now)).toBe(false);
  });
});

describe('liveFromHasPassed', () => {
  it('treats an absent liveFrom as always passed', () => {
    expect(liveFromHasPassed(undefined, new Date('2026-07-20T00:00:00Z'))).toBe(true);
  });

  it('reads a bare date as start-of-day Europe/Stockholm', () => {
    // 2026-07-20T00:00Z is already 02:00 in Stockholm (CEST), so the 20th has begun.
    expect(liveFromHasPassed('2026-07-20', new Date('2026-07-20T00:00:00Z'))).toBe(true);
    // One second before Stockholm midnight of the 20th (21:59:59Z on the 19th) → not yet.
    expect(liveFromHasPassed('2026-07-20', new Date('2026-07-19T21:59:59Z'))).toBe(false);
  });

  it('honours a wall-clock time in summer (CEST, UTC+2)', () => {
    expect(liveFromHasPassed('2026-07-20T09:00', new Date('2026-07-20T06:59:00Z'))).toBe(false);
    expect(liveFromHasPassed('2026-07-20T09:00', new Date('2026-07-20T07:00:00Z'))).toBe(true);
  });

  it('honours a wall-clock time in winter (CET, UTC+1)', () => {
    expect(liveFromHasPassed('2026-01-15T09:00', new Date('2026-01-15T07:59:00Z'))).toBe(false);
    expect(liveFromHasPassed('2026-01-15T09:00', new Date('2026-01-15T08:00:00Z'))).toBe(true);
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

describe('isScheduled', () => {
  const now = new Date('2026-07-20T00:00:00Z');

  it('is true for a non-draft with a future liveFrom', () => {
    expect(isScheduled({ draft: false, liveFrom: '2026-07-25' }, now)).toBe(true);
  });

  it('is false once liveFrom has passed (it is just live)', () => {
    expect(isScheduled({ draft: false, liveFrom: '2026-07-01' }, now)).toBe(false);
  });

  it('is false with no liveFrom, and false for drafts (a draft is not "scheduled")', () => {
    expect(isScheduled({ draft: false }, now)).toBe(false);
    expect(isScheduled({ draft: true, liveFrom: '2026-07-25' }, now)).toBe(false);
  });
});

describe('formatScheduleDate', () => {
  it('renders a short month + day for the badge', () => {
    expect(formatScheduleDate('2026-07-09')).toBe('Jul 9');
    expect(formatScheduleDate('2026-12-31')).toBe('Dec 31');
  });

  it('ignores any time component', () => {
    expect(formatScheduleDate('2026-07-09T09:00')).toBe('Jul 9');
  });
});
