import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

// The e2e suite runs against the drafts-visible build (so content-dependent
// tests keep working while posts are in draft). THIS test owns the opposite
// guarantee: a production build (SHOW_DRAFTS=false) must never publish a
// draft anywhere — page, feed, sitemap, or llms.txt.

function draftSlugs(): string[] {
  const base = 'src/content/posts';
  const slugs: string[] = [];
  for (const entry of readdirSync(base, { recursive: true }) as string[]) {
    const path = entry.toString();
    if (!path.endsWith('index.md')) continue;
    const frontmatter = readFileSync(join(base, path), 'utf8');
    if (/^draft:\s*true/m.test(frontmatter)) {
      const slug = path.split('/').at(-2);
      if (slug) slugs.push(slug);
    }
  }
  return slugs;
}

const outDir = mkdtempSync(join(tmpdir(), 'prod-build-'));

afterAll(() => rmSync(outDir, { recursive: true, force: true }));

describe('production build (SHOW_DRAFTS=false)', () => {
  it('publishes no draft anywhere — pages, rss, sitemap, llms.txt', () => {
    execFileSync('npx', ['astro', 'build', '--outDir', outDir], {
      env: { ...process.env, SHOW_DRAFTS: 'false' },
      stdio: 'pipe',
    });

    const drafts = draftSlugs();
    expect(
      drafts.length,
      'expected at least one draft to make this test meaningful',
    ).toBeGreaterThan(0);

    const rss = readFileSync(join(outDir, 'rss.xml'), 'utf8');
    const sitemap = existsSync(join(outDir, 'sitemap-0.xml'))
      ? readFileSync(join(outDir, 'sitemap-0.xml'), 'utf8')
      : '';
    const llms = readFileSync(join(outDir, 'llms.txt'), 'utf8');

    for (const slug of drafts) {
      expect(existsSync(join(outDir, 'posts', slug)), `page built for draft ${slug}`).toBe(false);
      expect(rss, `draft ${slug} leaked into rss.xml`).not.toContain(`/posts/${slug}/`);
      expect(sitemap, `draft ${slug} leaked into sitemap`).not.toContain(`/posts/${slug}/`);
      expect(llms, `draft ${slug} leaked into llms.txt`).not.toContain(`/posts/${slug}/`);
    }
  }, 180_000);
});
