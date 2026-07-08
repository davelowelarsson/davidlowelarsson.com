import { describe, expect, it } from 'vitest';
import { postIdFromBundleEntry } from './post-bundle-id';

// Mirrors src/lib/posts.test.ts's coverage of postIdFromEntry, plus the
// `.mdx` case that function doesn't support. Kept as a separate lib file
// (rather than a change to posts.ts) because that file is owned by a
// parallel in-flight PR — see content.config.ts for the rationale.
describe('postIdFromBundleEntry', () => {
  it('takes the id from the parent folder of an index.md bundle', () => {
    expect(postIdFromBundleEntry('2026/draft-preview-pipeline/index.md')).toBe(
      'draft-preview-pipeline',
    );
  });

  it('takes the id from the parent folder of an index.mdx bundle', () => {
    expect(postIdFromBundleEntry('2026/embed-test-fixture/index.mdx')).toBe('embed-test-fixture');
  });

  it('ignores intermediate folder structure', () => {
    expect(postIdFromBundleEntry('2026/07/some-note/index.md')).toBe('some-note');
    expect(postIdFromBundleEntry('deep/nested/tree/some-note/index.mdx')).toBe('some-note');
  });

  it('throws for an entry that is not a bundle', () => {
    expect(() => postIdFromBundleEntry('loose-file.md')).toThrow();
    expect(() => postIdFromBundleEntry('loose-file.mdx')).toThrow();
  });

  it('throws for a bundle file that is neither index.md nor index.mdx', () => {
    expect(() => postIdFromBundleEntry('2026/some-slug/notes.md')).toThrow();
  });
});
