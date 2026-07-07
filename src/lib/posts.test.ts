import { describe, expect, it } from 'vitest';
import { isVisible, postIdFromEntry, sortByPubDateDesc } from './posts';

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

describe('postIdFromEntry', () => {
  it('uses the bundle folder name as the post id', () => {
    expect(postIdFromEntry('2026/draft-preview-pipeline/index.md')).toBe('draft-preview-pipeline');
  });

  it('ignores intermediate folders — organization never changes URLs', () => {
    expect(postIdFromEntry('2026/07/some-note/index.md')).toBe('some-note');
    expect(postIdFromEntry('deep/nested/tree/some-note/index.md')).toBe('some-note');
  });

  it('throws on a non-bundle entry instead of minting a broken id', () => {
    expect(() => postIdFromEntry('loose-file.md')).toThrow();
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
