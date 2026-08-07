import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES, type Theme, themeAttribute } from './theme';

describe('the three theme states', () => {
  it('offers light, dark and system', () => {
    expect(THEMES).toEqual(['light', 'dark', 'system']);
  });

  it('defaults a first-time reader to following the OS', () => {
    expect(DEFAULT_THEME).toBe('system');
  });
});

describe('themeAttribute', () => {
  // Auto is the ABSENCE of the attribute, not a third value. That is what lets
  // `light-dark()` fall back to the OS with no extra rule: nothing is forcing
  // a `color-scheme`, so `light dark` from :root applies.
  it('is null for system, so the attribute comes off entirely', () => {
    expect(themeAttribute('system')).toBeNull();
  });

  it('is the theme name for a forced choice', () => {
    expect(themeAttribute('light')).toBe('light');
    expect(themeAttribute('dark')).toBe('dark');
  });

  it('treats anything it does not recognise as system', () => {
    for (const junk of ['', 'sepia', 'DARK', null, undefined, 42, {}]) {
      expect(themeAttribute(junk as Theme), String(junk)).toBeNull();
    }
  });
});

// ── The forced-theme trap ──
//
// `prefers-color-scheme` asks the OPERATING SYSTEM, and cannot see a theme the
// reader forced on this site. A reader on a light OS who picks dark gets the
// dark page from `color-scheme` — and every rule keyed on the media query
// silently does not fire. The Excalidraw invert is the live instance: dark
// page, un-inverted image, dark strokes on a dark ground, invisible.
//
// So: every `prefers-color-scheme` query needs a `[data-theme]` companion.
// Asserted structurally, because the failure is silent and only shows on the
// one combination nobody tests by hand.

const BASE_LAYOUT = 'src/layouts/Base.astro';

function globalStyleBlock(): string {
  const match = /<style is:global>([\s\S]*)<\/style>/.exec(readFileSync(BASE_LAYOUT, 'utf8'));
  if (!match) throw new Error(`no global style block in ${BASE_LAYOUT}`);
  return match[1].replace(/\/\*[\s\S]*?\*\//g, '');
}

/** The selectors declared inside each `prefers-color-scheme: dark` block. */
function darkSchemeQueries(css: string): string[][] {
  const blocks: string[][] = [];
  const opener = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/g;

  for (let match = opener.exec(css); match !== null; match = opener.exec(css)) {
    let depth = 1;
    let index = match.index + match[0].length;
    const start = index;
    while (index < css.length && depth > 0) {
      if (css[index] === '{') depth++;
      else if (css[index] === '}') depth--;
      index++;
    }
    const body = css.slice(start, index - 1);
    blocks.push(
      [...body.matchAll(/(^|\})([^{}]+)\{/g)].flatMap(([, , group]) =>
        group.split(',').map((selector) => selector.trim()),
      ),
    );
  }
  return blocks;
}

describe('every OS-preference query can see a forced theme', () => {
  it('guards each prefers-color-scheme selector against a forced light theme', () => {
    const unguarded = darkSchemeQueries(globalStyleBlock())
      .flat()
      .filter((selector) => !selector.includes("[data-theme='light']"));
    expect(unguarded, 'these fire even when the reader has forced light').toEqual([]);
  });

  it('gives each of them a forced-dark companion outside the query', () => {
    const css = globalStyleBlock();
    const inQuery = darkSchemeQueries(css).flat();
    expect(inQuery.length, 'expected at least one OS-preference rule to guard').toBeGreaterThan(0);

    // For every `:root:not([data-theme='light']) X` inside the query there must
    // be a `:root[data-theme='dark'] X` outside it, or forcing dark on a light
    // OS does nothing.
    const outside = css.replace(/@media\s*\(prefers-color-scheme:[\s\S]*?\n {2}\}/g, '');
    for (const selector of inQuery) {
      const target = selector.replace(":root:not([data-theme='light'])", '').trim();
      expect(outside, `no forced-dark companion for "${target}"`).toContain(
        `:root[data-theme='dark'] ${target}`,
      );
    }
  });
});

describe('the storage key', () => {
  it('is namespaced so it cannot collide with the saltast cache', () => {
    expect(THEME_STORAGE_KEY).toMatch(/:/);
    expect(THEME_STORAGE_KEY).not.toBe('saltast:summary');
  });
});
