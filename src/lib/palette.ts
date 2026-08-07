// The palette as data.
//
// Every colour the global stylesheet defines lives here exactly once, as a
// light/dark pair. `src/layouts/Base.astro` writes them out as custom
// properties and `palette.test.ts` asserts the two agree in both directions,
// so a colour cannot drift between the sheet and the tests that reason about
// it. Same trick as `bylines.ts`: exported data consumed by both the page and
// its spec.
//
// Colours are changed HERE, and the mirror test tells you which line of the
// stylesheet to follow up.

export const SCHEMES = ['light', 'dark'] as const;

export type Scheme = (typeof SCHEMES)[number];

/** A token's value in each scheme. Any CSS colour — hex, or `rgb()` with alpha. */
export interface ColorPair {
  readonly light: string;
  readonly dark: string;
}

export const PALETTE = {
  // Green-biased neutrals: the greys carry a trace of the accent's hue, so they
  // read as chosen rather than as leftover #888.
  bg: { light: '#fafbfa', dark: '#111310' },
  ink: { light: '#1e211d', dark: '#e6eae3' },
  muted: { light: '#5f665d', dark: '#a3aa9f' },
  hairline: { light: 'rgb(30 33 29 / 13%)', dark: 'rgb(230 234 227 / 14%)' },
  chip: { light: 'rgb(30 33 29 / 5%)', dark: 'rgb(230 234 227 / 7%)' },
  // The accent means STATE — link, focus, current, scheduled. Nothing else.
  accent: { light: '#0f6b74', dark: '#6fcdd9' },
  warn: { light: '#8a5800', dark: '#eebd5c' },
  // Retuned to sit with the green-biased ground. The locked design has no
  // equivalent for these two; the light values are what changed, because the
  // old `#15803d` measured 4.84:1 against the new ground.
  'status-up': { light: '#136c36', dark: '#4ade80' },
  'status-down': { light: '#b01818', dark: '#f87171' },
  // Category tints. These only ever colour the Category WORD — see ADR 0009.
  'tint-essay': { light: '#4338ca', dark: '#b4bdfc' },
  'tint-til': { light: '#0f766e', dark: '#5eead4' },
  'tint-experiment': { light: '#155e75', dark: '#7dd3fc' },
  'tint-project': { light: '#a21caf', dark: '#f0abfc' },
} as const satisfies Record<string, ColorPair>;

export type TokenName = keyof typeof PALETTE;

/** A token that carries text, and the token its text sits on. */
export interface TextToken {
  readonly token: TokenName;
  readonly ground: TokenName;
}

// Every token used as a text colour anywhere in the sheet. `accent` is here
// because `.badge-scheduled` and link hover paint text with it, not only
// because it draws the focus ring — the ring's own (non-text, 3:1) threshold
// is a separate, lower guarantee.
export const TEXT_TOKENS = [
  { token: 'ink', ground: 'bg' },
  { token: 'muted', ground: 'bg' },
  { token: 'warn', ground: 'bg' },
  { token: 'accent', ground: 'bg' },
  { token: 'status-up', ground: 'bg' },
  { token: 'status-down', ground: 'bg' },
  { token: 'tint-essay', ground: 'bg' },
  { token: 'tint-til', ground: 'bg' },
  { token: 'tint-experiment', ground: 'bg' },
  { token: 'tint-project', ground: 'bg' },
] as const satisfies readonly TextToken[];

/**
 * The floor this project holds itself to, deliberately above WCAG AA's 4.5:1
 * so a token cannot drift into "technically passing" without breaking a build.
 */
export const CONTRAST_FLOOR = 5.5;

/** WCAG AA for body text. Nothing is ever excused from this one. */
export const AA_FLOOR = 4.5;

/** Non-text UI (the focus ring) has its own, lower WCAG threshold. */
export const NON_TEXT_FLOOR = 3;

/** WCAG AAA for body text — the standard `--ink` is held to. */
export const AAA_FLOOR = 7;

/**
 * Text tokens that do not yet clear CONTRAST_FLOOR. This is a countdown, not a
 * set of exemptions — everything here still clears AA_FLOOR, which has no
 * exceptions at all.
 *
 * The test asserts this list is EXACTLY the set that falls short — a token
 * cannot quietly join it, and a token that gets fixed cannot quietly stay on
 * it.
 *
 * One entry left, and it is a contradiction inside the locked design rather
 * than an unfinished job: the locked `--tint-til` is `#0f766e`, which measures
 * 5.28:1 against the locked ground — the prototype's own §1b note records the
 * tint range as "5.3–7.6" while setting the floor at 5.5. Changing the hex
 * would be reopening a locked decision, so it is reported on #94 instead.
 * `#0e7168` is the smallest same-hue darkening that clears the floor (5.65:1).
 */
export const BELOW_FLOOR = [
  'tint-til:light',
] as const satisfies readonly `${TokenName}:${Scheme}`[];

/** The three sRGB channels of an opaque hex colour, 0–255. */
export function parseHex(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`not an opaque hex colour: ${hex}`);
  const digits = match[1];
  const full = digits.length === 3 ? digits.replace(/./g, (d) => d + d) : digits;
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** WCAG 2.x gamma expansion for one channel. */
function linearise(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance: 0 for black, 1 for white. */
export function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHex(hex);
  return 0.2126 * linearise(red) + 0.7152 * linearise(green) + 0.0722 * linearise(blue);
}

/** WCAG 2.x contrast ratio, 1:1 to 21:1. Order of the arguments is irrelevant. */
export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/** The contrast between two tokens in one scheme. */
export function tokenContrast(token: TokenName, ground: TokenName, scheme: Scheme): number {
  return contrastRatio(PALETTE[token][scheme], PALETTE[ground][scheme]);
}
