import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { futureScheduledSlugs } from './scheduled-slugs';

let dir: string;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

function writePost(base: string, slug: string, frontmatter: string) {
  const folder = join(base, slug);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'index.md'), `---\n${frontmatter}\n---\n\nBody.\n`);
}

describe('futureScheduledSlugs', () => {
  it('finds a non-draft post with a future liveFrom', () => {
    dir = mkdtempSync(join(tmpdir(), 'scheduled-slugs-'));
    writePost(dir, 'queued', 'title: "Queued"\ndraft: false\nliveFrom: "2999-01-01"');

    expect(futureScheduledSlugs(dir, new Date('2026-01-01'))).toEqual(['queued']);
  });

  it('excludes drafts even with a future liveFrom', () => {
    dir = mkdtempSync(join(tmpdir(), 'scheduled-slugs-'));
    writePost(dir, 'wip', 'title: "WIP"\ndraft: true\nliveFrom: "2999-01-01"');

    expect(futureScheduledSlugs(dir, new Date('2026-01-01'))).toEqual([]);
  });

  it('excludes posts whose liveFrom has already passed', () => {
    dir = mkdtempSync(join(tmpdir(), 'scheduled-slugs-'));
    writePost(dir, 'live', 'title: "Live"\ndraft: false\nliveFrom: "2020-01-01"');

    expect(futureScheduledSlugs(dir, new Date('2026-01-01'))).toEqual([]);
  });

  it('excludes posts with no liveFrom at all', () => {
    dir = mkdtempSync(join(tmpdir(), 'scheduled-slugs-'));
    writePost(dir, 'plain', 'title: "Plain"\ndraft: false');

    expect(futureScheduledSlugs(dir, new Date('2026-01-01'))).toEqual([]);
  });

  it('finds an .mdx bundle too', () => {
    dir = mkdtempSync(join(tmpdir(), 'scheduled-slugs-'));
    const folder = join(dir, 'mdx-queued');
    mkdirSync(folder, { recursive: true });
    writeFileSync(
      join(folder, 'index.mdx'),
      '---\ntitle: "Queued"\ndraft: false\nliveFrom: "2999-01-01"\n---\n\nBody.\n',
    );

    expect(futureScheduledSlugs(dir, new Date('2026-01-01'))).toEqual(['mdx-queued']);
  });
});
