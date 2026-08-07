import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// There is almost no motion on this site, which is exactly what makes this
// easy to regress: one `transition:` added in passing, in a component nobody
// associates with animation, and a reader who asked their OS for less motion
// gets it anyway.
//
// The guard is opt-in rather than opt-out. `prefers-reduced-motion:
// no-preference` is the only value meaning "the reader was asked and did not
// object" — writing `@media (prefers-reduced-motion: reduce) { … none }`
// instead would still animate for anyone whose OS reports nothing at all.

/** Every .astro file under src/. */
function astroFiles(): string[] {
  const files: string[] = [];
  for (const entry of readdirSync('src', { recursive: true }) as string[]) {
    const path = join('src', entry.toString());
    if (path.endsWith('.astro') && !statSync(path).isDirectory()) files.push(path);
  }
  return files;
}

/**
 * Ranges of `@media (prefers-reduced-motion: no-preference) { … }` in a file,
 * as [start, end) offsets. Brace-matched, so nested rules count as inside.
 */
function guardedRanges(source: string): [number, number][] {
  const ranges: [number, number][] = [];
  const opener = /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{/g;

  for (let match = opener.exec(source); match !== null; match = opener.exec(source)) {
    let depth = 1;
    let index = match.index + match[0].length;
    while (index < source.length && depth > 0) {
      if (source[index] === '{') depth++;
      else if (source[index] === '}') depth--;
      index++;
    }
    ranges.push([match.index, index]);
  }
  return ranges;
}

describe('motion is opt-in', () => {
  it('guards every transition and animation behind prefers-reduced-motion', () => {
    const unguarded: string[] = [];

    for (const path of astroFiles()) {
      const source = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (comment) =>
        ' '.repeat(comment.length),
      );
      const ranges = guardedRanges(source);

      for (const match of source.matchAll(/\b(transition|animation)\s*:/g)) {
        const at = match.index ?? 0;
        const inside = ranges.some(([start, end]) => at > start && at < end);
        if (!inside) unguarded.push(`${path}: ${match[1]} at offset ${at}`);
      }
    }

    expect(unguarded, 'motion that ignores the reader s preference').toEqual([]);
  });
});
