import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { postFrontmatterSchema } from './post-schema';

function frontmatterOf(markdown: string): unknown {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error('no frontmatter block found');
  return parse(match[1] as string);
}

describe('postFrontmatterSchema', () => {
  it('accepts a minimal post', () => {
    const parsed = postFrontmatterSchema.parse({ title: 'Hi', pubDate: '2026-07-07' });

    expect(parsed.category).toBe('til');
    expect(parsed.draft).toBe(false);
    expect(parsed.tags).toEqual([]);
  });

  it('rejects a post without a title', () => {
    expect(() => postFrontmatterSchema.parse({ pubDate: '2026-07-07' })).toThrow();
  });

  it('rejects an unknown category', () => {
    expect(() =>
      postFrontmatterSchema.parse({ title: 'Hi', pubDate: '2026-07-07', category: 'rant' }),
    ).toThrow();
  });
});

describe('templates/new-post', () => {
  it('is always a valid post — the template IS the frontmatter contract example', () => {
    const template = readFileSync(join(process.cwd(), 'templates/new-post/index.md'), 'utf8');

    const parsed = postFrontmatterSchema.parse(frontmatterOf(template));

    expect(parsed.draft).toBe(true);
    expect(parsed.title.length).toBeGreaterThan(0);
    expect(parsed.description).toBeTruthy();
  });
});
