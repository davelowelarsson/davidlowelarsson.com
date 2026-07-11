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
export function futureScheduledSlugs(base = 'src/content/posts', now: Date = new Date()): string[] {
  const slugs: string[] = [];
  for (const entry of readdirSync(base, { recursive: true }) as string[]) {
    const path = entry.toString();
    if (!path.endsWith('index.md') && !path.endsWith('index.mdx')) continue;
    const frontmatter = readFileSync(join(base, path), 'utf8');
    if (/^draft:\s*true/m.test(frontmatter)) continue;
    const match = frontmatter.match(/^liveFrom:\s*["']?([0-9T:-]+)["']?/m);
    if (match && !liveFromHasPassed(match[1], now)) {
      const slug = path.split('/').at(-2);
      if (slug) slugs.push(slug);
    }
  }
  return slugs;
}
