import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Prose styling must not reach past the article. e2e/post-list-alignment.spec.ts
// asserts the outcome a reader can see; this asserts the shape of the rule, so
// that dropping the `article` prefix fails immediately rather than in whatever
// listing page happens to be looked at next.
//
// Element-level list rules are the specific hazard: they are the ones with low
// enough specificity to look harmless and wide enough reach to hit every list
// on the site, including ones that do not exist yet.

const BASE_LAYOUT = 'src/layouts/Base.astro';

/** Every selector in the global sheet, comments stripped. */
function selectors(): string[] {
  const match = /<style is:global>([\s\S]*)<\/style>/.exec(readFileSync(BASE_LAYOUT, 'utf8'));
  if (!match) throw new Error(`no global style block in ${BASE_LAYOUT}`);
  const css = match[1].replace(/\/\*[\s\S]*?\*\//g, '');

  return [...css.matchAll(/(^|\})([^{}]+)\{/g)]
    .flatMap(([, , group]) => group.split(','))
    .map((selector) => selector.trim())
    .filter((selector) => selector.length > 0 && !selector.startsWith('@'));
}

describe('prose styling stays inside the article', () => {
  it('scopes every list-element rule', () => {
    const bare = selectors().filter((selector) => /^(ul|ol|li)\b/.test(selector));
    expect(bare, 'a list rule reaches outside the article').toEqual([]);
  });

  it('still styles lists that ARE prose', () => {
    const scoped = selectors().filter((selector) => /^article\s+(ul|ol|li)\b/.test(selector));
    expect(scoped.length, 'prose lists lost their rules entirely').toBeGreaterThan(0);
  });
});
