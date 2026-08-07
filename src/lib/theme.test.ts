import { describe, expect, it } from 'vitest';
import { allCssSources, mediaBlocks, selectorsIn, withoutMediaBlocks } from './stylesheets';
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

// Since #116 this scans EVERY stylesheet source rather than one global block.
// The trap is silent by nature, so the guard must not have a layer it cannot
// see: a component that adds its own prefers-color-scheme rule is covered the
// day it is written.
const DARK_SCHEME = /prefers-color-scheme:\s*dark/;

/** The selectors declared inside each `prefers-color-scheme: dark` block. */
function darkSchemeQueries(css: string): string[][] {
  return mediaBlocks(css, DARK_SCHEME).map(selectorsIn);
}

describe('every OS-preference query can see a forced theme', () => {
  it('guards each prefers-color-scheme selector against a forced light theme', () => {
    const unguarded = allCssSources().flatMap(([path, css]) =>
      darkSchemeQueries(css)
        .flat()
        .filter((selector) => !selector.includes("[data-theme='light']"))
        .map((selector) => `${path}: ${selector}`),
    );
    expect(unguarded, 'these fire even when the reader has forced light').toEqual([]);
  });

  it('gives each of them a forced-dark companion outside the query', () => {
    const sources = allCssSources();
    const total = sources.flatMap(([, css]) => darkSchemeQueries(css).flat());
    expect(total.length, 'expected at least one OS-preference rule to guard').toBeGreaterThan(0);

    // For every `:root:not([data-theme='light']) X` inside the query there must
    // be a `:root[data-theme='dark'] X` outside it, or forcing dark on a light
    // OS does nothing. The companion has to be in the SAME file: a rule and its
    // counterpart living in different layers is how one of them gets deleted.
    for (const [path, css] of sources) {
      // Brace-matched removal. The previous version anchored on `\n  }`, the
      // indentation of a rule inside `<style is:global>` — which stops matching
      // the moment the rule moves into a .css file at column zero, silently
      // leaving the whole query in `outside` and passing every assertion.
      const outside = withoutMediaBlocks(css, DARK_SCHEME);
      for (const selector of darkSchemeQueries(css).flat()) {
        const target = selector.replace(":root:not([data-theme='light'])", '').trim();
        expect(outside, `${path}: no forced-dark companion for "${target}"`).toContain(
          `:root[data-theme='dark'] ${target}`,
        );
      }
    }
  });
});

describe('the storage key', () => {
  it('is namespaced so it cannot collide with the saltast cache', () => {
    expect(THEME_STORAGE_KEY).toMatch(/:/);
    expect(THEME_STORAGE_KEY).not.toBe('saltast:summary');
  });
});
