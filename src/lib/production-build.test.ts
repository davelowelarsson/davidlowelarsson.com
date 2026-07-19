import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { frontmatterBlock, futureScheduledSlugs } from './scheduled-slugs';

// The e2e suite runs against the drafts-visible build (so content-dependent
// tests keep working while posts are in draft). THIS test owns the opposite
// guarantee: a production build (SHOW_DRAFTS=false) must never publish a
// draft anywhere — page, feed, sitemap, or llms.txt — and that a scheduled
// post's page is a Teaser, never its real content.

function draftSlugs(): string[] {
  const base = 'src/content/posts';
  const slugs: string[] = [];
  for (const entry of readdirSync(base, { recursive: true }) as string[]) {
    const path = entry.toString();
    if (!path.endsWith('index.md') && !path.endsWith('index.mdx')) continue;
    const frontmatter = frontmatterBlock(readFileSync(join(base, path), 'utf8'));
    if (/^\s*draft\s*:\s*true/m.test(frontmatter)) {
      const slug = path.split('/').at(-2);
      if (slug) slugs.push(slug);
    }
  }
  return slugs;
}

/** The raw source (frontmatter + body) for a given post slug. */
function postSource(slug: string): string {
  const base = 'src/content/posts';
  for (const entry of readdirSync(base, { recursive: true }) as string[]) {
    const path = entry.toString();
    if (!path.endsWith('index.md') && !path.endsWith('index.mdx')) continue;
    if (path.split('/').at(-2) === slug) return readFileSync(join(base, path), 'utf8');
  }
  throw new Error(`no source found for slug ${slug}`);
}

function frontmatterTitle(source: string): string {
  return (source.match(/^title:\s*(.+)$/m)?.[1] ?? '').replace(/^"|"$/g, '');
}

function frontmatterDescription(source: string): string | undefined {
  return frontmatterBlock(source)
    .match(/^\s*description\s*:\s*(.+)$/m)?.[1]
    ?.replace(/^["']|["']$/g, '');
}

/**
 * A plain-text word from the article body — proof the Teaser didn't leak it.
 * Skips any word contained in text the teaser legitimately carries (its own
 * boilerplate, the post's title, the slug in the canonical URL) — substring
 * containment, not word equality, so "shortener" is excluded when the title
 * says "shorteners".
 */
function bodyProbe(source: string, slug: string): string | undefined {
  const legitimate = `scheduled expected ${frontmatterTitle(source)} ${slug}`.toLowerCase();
  const body = source
    .split(/^---\s*$/m)
    .slice(2)
    .join('---');
  const plain = body.replace(/^#.*$/gm, '').replace(/[*_`>[\]()]/g, '');
  return plain
    .split(/\s+/)
    .find((word) => word.length >= 8 && !legitimate.includes(word.toLowerCase()));
}

function rssItemLink(slug: string): string {
  // Published posts may intentionally link to scheduled teaser URLs in their
  // article bodies. Only an item's canonical link means RSS published the post.
  return `<link>https://davidlowelarsson.com/posts/${slug}/</link>`;
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
      expect(rss, `draft ${slug} leaked into rss.xml`).not.toContain(rssItemLink(slug));
      expect(sitemap, `draft ${slug} leaked into sitemap`).not.toContain(`/posts/${slug}/`);
      expect(llms, `draft ${slug} leaked into llms.txt`).not.toContain(`/posts/${slug}/`);
    }

    for (const slug of futureScheduledSlugs()) {
      const pagePath = join(outDir, 'posts', slug, 'index.html');
      expect(existsSync(pagePath), `teaser page missing for scheduled ${slug}`).toBe(true);

      const html = readFileSync(pagePath, 'utf8');
      expect(html, `${slug} teaser missing noindex`).toMatch(/name="robots"[^>]*noindex/);
      expect(html, `${slug} teaser missing "expected" wording`).toContain('expected');

      const source = postSource(slug);
      expect(html, `${slug} teaser missing its title`).toContain(frontmatterTitle(source));
      const probe = bodyProbe(source, slug);
      if (probe) expect(html, `${slug} teaser leaked article body`).not.toContain(probe);

      // Article-only metadata must be absent — a teaser is not the article.
      expect(html, `${slug} teaser carries og:type article`).not.toContain(
        'property="og:type" content="article"',
      );
      expect(html, `${slug} teaser carries JSON-LD`).not.toContain('application/ld+json');
      expect(html, `${slug} teaser carries article:published_time`).not.toContain(
        'article:published_time',
      );
      const description = frontmatterDescription(source);
      if (description) {
        expect(html, `${slug} teaser leaked the description`).not.toContain(description);
      }

      expect(rss, `scheduled ${slug} leaked into rss.xml`).not.toContain(rssItemLink(slug));
      expect(sitemap, `scheduled ${slug} leaked into sitemap`).not.toContain(`/posts/${slug}/`);
      expect(llms, `scheduled ${slug} leaked into llms.txt`).not.toContain(`/posts/${slug}/`);
    }
  }, 180_000);
});
