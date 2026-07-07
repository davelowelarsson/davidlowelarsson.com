import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findOrphanMarkdown } from './content-hygiene';

describe('findOrphanMarkdown', () => {
  it('accepts bundle index files', () => {
    expect(findOrphanMarkdown(['2026/my-post/index.md'])).toEqual([]);
  });

  it('flags markdown that the loader would silently ignore', () => {
    expect(
      findOrphanMarkdown(['2026/my-post/index.md', '2026/my-post/draft.md', 'notes.md']),
    ).toEqual(['2026/my-post/draft.md', 'notes.md']);
  });

  it('ignores non-markdown files', () => {
    expect(findOrphanMarkdown(['2026/my-post/diagram.svg', '2026/my-post/index.md'])).toEqual([]);
  });
});

describe('content tree hygiene (real filesystem)', () => {
  it('contains no markdown files the loader would silently skip', () => {
    const base = join(process.cwd(), 'src/content/posts');
    const entries = readdirSync(base, { recursive: true }) as string[];
    const orphans = findOrphanMarkdown(entries.map((e) => e.toString()));

    expect(
      orphans,
      `These markdown files will NOT be published — posts must be <folders>/<slug>/index.md: ${orphans.join(', ')}`,
    ).toEqual([]);
  });
});
