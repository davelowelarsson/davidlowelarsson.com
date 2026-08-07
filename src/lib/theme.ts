// The theme control's vocabulary, in one place.
//
// The mechanism is deliberately small: every colour token is a `light-dark()`
// pair and `:root` carries `color-scheme: light dark`, so forcing a theme is
// one attribute on one element. See ADR 0010.
//
// These constants are imported by the layout (which passes them into the
// inline pre-paint script via `define:vars`), by the Vitest suite, and by the
// Playwright suite — so "what the stored value can be" is written once.

export const THEMES = ['light', 'dark', 'system'] as const;

export type Theme = (typeof THEMES)[number];

/** A first-time reader follows the OS. */
export const DEFAULT_THEME: Theme = 'system';

/** Namespaced: `localStorage` is shared with the saltast tally's cache. */
export const THEME_STORAGE_KEY = 'theme:preference';

/** The attribute name the whole mechanism turns on. */
export const THEME_ATTRIBUTE = 'data-theme';

/**
 * What `data-theme` should be for a given choice — `null` meaning "remove it".
 *
 * Auto is the ABSENCE of the attribute rather than a third value. That is what
 * lets the OS preference apply with no extra rule: nothing overrides `:root`'s
 * `color-scheme: light dark`, so `light-dark()` resolves however the OS says.
 *
 * Anything unrecognised — a stale value, a hand-edited localStorage, a future
 * theme that no longer exists — degrades to following the OS rather than to a
 * broken page.
 */
export function themeAttribute(value: unknown): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}
