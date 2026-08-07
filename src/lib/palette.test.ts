import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONTRAST_FLOOR,
  type ColorPair,
  contrastRatio,
  PALETTE,
  relativeLuminance,
  SCHEMES,
  TEXT_TOKENS,
  tokenContrast,
} from './palette';

describe('relativeLuminance', () => {
  it('anchors at the ends of the sRGB range', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBe(1);
  });

  it('reads three-digit shorthand the same as six', () => {
    expect(relativeLuminance('#fff')).toBe(relativeLuminance('#ffffff'));
    expect(relativeLuminance('#08f')).toBe(relativeLuminance('#0088ff'));
  });

  it('refuses colours it cannot reason about', () => {
    expect(() => relativeLuminance('rgb(0 0 0 / 12%)')).toThrow(/hex/);
    expect(() => relativeLuminance('light-dark(#fff, #000)')).toThrow(/hex/);
    expect(() => relativeLuminance('#ff')).toThrow(/hex/);
  });
});

describe('contrastRatio', () => {
  // Reference pairs with published ratios — if the formula drifts, these move.
  it('is 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('is 1:1 for a colour against itself', () => {
    expect(contrastRatio('#2563eb', '#2563eb')).toBeCloseTo(1, 10);
  });

  // #767676 on white is WCAG's canonical "just passes AA" grey.
  it('is 4.54:1 for #767676 on white', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('does not care which colour is the ground', () => {
    expect(contrastRatio('#1b1b1f', '#ffffff')).toBeCloseTo(
      contrastRatio('#ffffff', '#1b1b1f'),
      10,
    );
  });
});

describe('the palette as data', () => {
  it('gives every token a value in both schemes', () => {
    for (const [name, pair] of Object.entries(PALETTE) as [string, ColorPair][]) {
      for (const scheme of SCHEMES) {
        expect(pair[scheme], `${name}.${scheme}`).toBeTruthy();
      }
    }
  });

  // The floor rises to 5.5:1 in #107. Today it guards WCAG AA.
  it(`clears ${CONTRAST_FLOOR}:1 for every text token, in both schemes`, () => {
    const failures: string[] = [];
    for (const { token, ground } of TEXT_TOKENS) {
      for (const scheme of SCHEMES) {
        const ratio = tokenContrast(token, ground, scheme);
        if (ratio < CONTRAST_FLOOR) {
          failures.push(`${token} on ${ground} (${scheme}): ${ratio.toFixed(2)}:1`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

// ── The stylesheet is a mirror of the data, not a second source ──
//
// The tokens stay written as CSS (the three-layer restructure in #116 wants
// them portable), so the guarantee is enforced rather than generated: what
// `:root` declares must equal PALETTE exactly, in both directions, and no
// colour may be written anywhere else in the global sheet.

const BASE_LAYOUT = 'src/layouts/Base.astro';

/** Split `a, b` on the top-level comma only — values may nest parens. */
function splitPair(value: string): [string, string] {
  let depth = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === ',' && depth === 0) {
      return [value.slice(0, i).trim(), value.slice(i + 1).trim()];
    }
  }
  throw new Error(`not a light-dark pair: ${value}`);
}

/** The global sheet with comments removed — prose about colours is not a colour. */
function globalStyleBlock(): string {
  const match = /<style is:global>([\s\S]*)<\/style>/.exec(readFileSync(BASE_LAYOUT, 'utf8'));
  if (!match) throw new Error(`no global style block in ${BASE_LAYOUT}`);
  return match[1].replace(/\/\*[\s\S]*?\*\//g, '');
}

function rootBlock(css: string): string {
  const match = /:root\s*\{([\s\S]*?)\n\s*\}/.exec(css);
  if (!match) throw new Error(`no :root block in ${BASE_LAYOUT}`);
  return match[1];
}

function declaredTokens(root: string): Record<string, ColorPair> {
  const tokens: Record<string, ColorPair> = {};
  for (const [, name, raw] of root.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    const value = raw.trim();
    if (!value.startsWith('light-dark(')) continue;
    const [light, dark] = splitPair(value.slice('light-dark('.length, -1));
    tokens[name] = { light, dark };
  }
  return tokens;
}

describe('the stylesheet mirrors the palette', () => {
  it('declares exactly the tokens PALETTE defines, with the same values', () => {
    expect(declaredTokens(rootBlock(globalStyleBlock()))).toEqual(PALETTE);
  });

  it('writes no colour outside :root', () => {
    const css = globalStyleBlock();
    const outside = css.replace(rootBlock(css), '');
    const literals = [
      ...(outside.match(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g) ??
        []),
      ...(outside.match(/\blight-dark\(/g) ?? []),
      ...(outside.match(/\brgba?\(/g) ?? []),
    ];
    expect(literals).toEqual([]);
  });
});
