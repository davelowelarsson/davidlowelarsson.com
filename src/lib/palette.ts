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
  ink: { light: '#1b1b1f', dark: '#e6e6e9' },
  muted: { light: '#5f665d', dark: '#9c9ca6' },
  hairline: { light: 'rgb(0 0 0 / 12%)', dark: 'rgb(255 255 255 / 16%)' },
  chip: { light: 'rgb(0 0 0 / 5%)', dark: 'rgb(255 255 255 / 9%)' },
  bg: { light: '#ffffff', dark: '#111113' },
  warn: { light: '#8a5800', dark: '#fbbf24' },
  focus: { light: '#2563eb', dark: '#93b4ff' },
  'status-up': { light: '#15803d', dark: '#4ade80' },
  'status-down': { light: '#b91c1c', dark: '#f87171' },
  // Quiet Category tints — legible as monochrome, scannable as colour.
  'tint-essay': { light: '#4338ca', dark: '#a5b4fc' },
  'tint-til': { light: '#047857', dark: '#6ee7b7' },
  'tint-experiment': { light: '#0e7490', dark: '#67e8f9' },
  'tint-project': { light: '#be185d', dark: '#f9a8d4' },
} as const satisfies Record<string, ColorPair>;

export type TokenName = keyof typeof PALETTE;

/** A token that carries text, and the token its text sits on. */
export interface TextToken {
  readonly token: TokenName;
  readonly ground: TokenName;
}

// Every token used as a text colour anywhere in the sheet. `focus` is here
// because `.badge-scheduled` paints text with it, not only because it draws
// the focus ring — the ring's own (non-text, 3:1) threshold is #107's job.
export const TEXT_TOKENS = [
  { token: 'ink', ground: 'bg' },
  { token: 'muted', ground: 'bg' },
  { token: 'warn', ground: 'bg' },
  { token: 'focus', ground: 'bg' },
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
 * set of exemptions: #108 gives each of these its locked value and empties the
 * list. Everything here still clears AA_FLOOR, which has no exceptions.
 *
 * The test asserts this list is EXACTLY the set that falls short — a token
 * cannot quietly join it, and a token that gets fixed cannot quietly stay on
 * it. Deleting the last entry is how #108 knows it is finished.
 */
export const BELOW_FLOOR = [
  'focus:light',
  'status-up:light',
  'tint-til:light',
  'tint-experiment:light',
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
