import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { liveFromHasPassed } from './posts';

/**
 * Non-draft posts whose `liveFrom` has not yet arrived, found by scanning
 * frontmatter directly rather than the content collection. Shared by
 * `astro.config.mjs` (the sitemap `filter`, evaluated before `getCollection`
 * exists) and `production-build.test.ts` (the live guard), so both agree on
 * exactly which slugs are scheduled instead of drifting apart.
 */
/**
 * Only the text between the opening `---` fence pair — a `liveFrom:` in the
 * post body (say, a YAML code sample in a post about this very feature) must
 * never count as scheduling metadata.
 */
export function frontmatterBlock(source: string): string {
  return source.split(/^---\s*$/m)[1] ?? '';
}

export function futureScheduledSlugs(base = 'src/content/posts', now: Date = new Date()): string[] {
  const slugs: string[] = [];
  for (const entry of readdirSync(base, { recursive: true }) as string[]) {
    const path = entry.toString();
    if (!path.endsWith('index.md') && !path.endsWith('index.mdx')) continue;
    // Tolerant of YAML whitespace (indentation, space before the colon) so
    // this scan accepts what the content-collection schema would accept.
    const frontmatter = frontmatterBlock(readFileSync(join(base, path), 'utf8'));
    if (/^\s*draft\s*:\s*true/m.test(frontmatter)) continue;
    const match = frontmatter.match(/^\s*liveFrom\s*:\s*["']?([0-9T:-]+)["']?/m);
    if (match && !liveFromHasPassed(match[1], now)) {
      const slug = path.split('/').at(-2);
      if (slug) slugs.push(slug);
    }
  }
  return slugs;
}
