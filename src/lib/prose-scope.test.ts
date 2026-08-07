import { describe, expect, it } from 'vitest';
import { allCssSources, cssIn, selectorsIn } from './stylesheets';

// Prose styling must not reach past the article. e2e/post-list-alignment.spec.ts
// asserts the outcome a reader can see; this asserts the shape of the rule, so
// that dropping the scope fails immediately rather than in whatever listing
// page happens to be looked at next.
//
// Element-level list rules are the specific hazard: they are the ones with low
// enough specificity to look harmless and wide enough reach to hit every list
// on the site, including ones that do not exist yet.
//
// Since #116 this scans EVERY stylesheet source, not one global block. A rule
// that moves into a component must stay inside the guard — otherwise splitting
// the CSS into layers would have been a way to escape it.

const PROSE_COMPONENT = 'src/components/Prose.astro';

/**
 * A list rule that nothing scopes.
 *
 * The first version of this only matched selectors STARTING with a list
 * element, so `main ul`, `body li` and `:where(ul)` all walked straight past
 * it — the rule reaches every list on the site either way. What actually
 * matters is whether anything narrows it: a class or id narrows it, and so
 * does an `article` ancestor. A selector built purely from element names does
 * not.
 */
function isUnscopedListRule(selector: string): boolean {
  if (!/\b(?:ul|ol|li)\b/.test(selector)) return false;
  if (/[.#]/.test(selector)) return false;
  return !/\barticle\b/.test(selector);
}

describe('prose styling stays inside the article', () => {
  it('scopes every list-element rule, in every stylesheet source', () => {
    const bare = allCssSources().flatMap(([path, css]) =>
      selectorsIn(css)
        .filter(isUnscopedListRule)
        .map((selector) => `${path}: ${selector}`),
    );
    expect(bare, 'a list rule reaches outside the article').toEqual([]);
  });

  it('still styles lists that ARE prose', () => {
    const scoped = selectorsIn(cssIn(PROSE_COMPONENT)).filter((selector) =>
      /^\.prose\b.*\b(?:ul|ol|li)\b/.test(selector),
    );
    expect(scoped.length, 'prose lists lost their rules entirely').toBeGreaterThan(0);
  });

  // The guarantee #116 buys, stated as a test rather than as a comment. Astro
  // compiles `.prose :global(ul)` to `.prose[data-astro-cid-…] ul`: the
  // narrowing comes from a scope attribute the compiler generates, not from an
  // `article ` prefix someone has to remember to type. `.post-list` is never
  // inside that element, so a prose list rule cannot reach it at any
  // specificity.
  it('narrows prose list rules with the component class, not a hand-written prefix', () => {
    const listRules = selectorsIn(cssIn(PROSE_COMPONENT)).filter((selector) =>
      /\b(?:ul|ol|li)\b/.test(selector),
    );
    expect(listRules.length, 'no prose list rules found to check').toBeGreaterThan(0);
    expect(
      listRules.filter((selector) => !selector.startsWith('.prose')),
      'a list rule in Prose.astro is not anchored on .prose, so Astro cannot scope it',
    ).toEqual([]);
  });
});
