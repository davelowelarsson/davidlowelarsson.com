import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AA_FLOOR,
  AAA_FLOOR,
  BELOW_FLOOR,
  CONTRAST_FLOOR,
  type ColorPair,
  contrastRatio,
  HIGH_CONTRAST,
  NON_TEXT_FLOOR,
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

  /** Every (token, scheme) pair whose ratio falls below `floor`, as `token:scheme`. */
  function shortOf(floor: number): string[] {
    const short: string[] = [];
    for (const { token, ground } of TEXT_TOKENS) {
      for (const scheme of SCHEMES) {
        if (tokenContrast(token, ground, scheme) < floor) short.push(`${token}:${scheme}`);
      }
    }
    return short.sort();
  }

  it(`clears WCAG AA (${AA_FLOOR}:1) for every text token, no exceptions`, () => {
    expect(shortOf(AA_FLOOR)).toEqual([]);
  });

  // The project floor is 5.5:1. BELOW_FLOOR is the countdown of tokens still
  // short of it — asserted as an exact set, so it can only ever shrink.
  it(`falls short of ${CONTRAST_FLOOR}:1 exactly where BELOW_FLOOR says`, () => {
    expect(shortOf(CONTRAST_FLOOR)).toEqual([...BELOW_FLOOR].sort());
  });

  it(`holds body ink to WCAG AAA (${AAA_FLOOR}:1) on both grounds`, () => {
    for (const scheme of SCHEMES) {
      expect(tokenContrast('ink', 'bg', scheme), `ink (${scheme})`).toBeGreaterThanOrEqual(
        AAA_FLOOR,
      );
    }
  });

  // An override that does not measurably improve contrast is decoration. So
  // the high-contrast values have to beat their own base AND clear a higher
  // floor than the base palette is held to.
  it('makes the high-contrast overrides genuinely stronger, in both schemes', () => {
    for (const scheme of SCHEMES) {
      const base = contrastRatio(PALETTE.muted[scheme], PALETTE.bg[scheme]);
      const strengthened = contrastRatio(HIGH_CONTRAST.muted[scheme], PALETTE.bg[scheme]);

      expect(strengthened, `muted (${scheme}) is not stronger`).toBeGreaterThan(base);
      expect(strengthened, `muted (${scheme}) does not reach AAA`).toBeGreaterThanOrEqual(
        AAA_FLOOR,
      );
    }
  });

  it('firms the hairlines rather than merely recolouring them', () => {
    const alpha = (value: string) => Number.parseFloat(/\/\s*([\d.]+)%/.exec(value)?.[1] ?? '0');
    for (const scheme of SCHEMES) {
      expect(
        alpha(HIGH_CONTRAST.hairline[scheme]),
        `hairline (${scheme}) is no firmer`,
      ).toBeGreaterThan(alpha(PALETTE.hairline[scheme]));
    }
  });

  // The focus ring is non-text UI, so WCAG asks 3:1 of it rather than 4.5:1 —
  // a separate guarantee from the same token's use as `.badge-scheduled` text.
  it(`keeps the focus ring above the ${NON_TEXT_FLOOR}:1 non-text threshold`, () => {
    for (const scheme of SCHEMES) {
      expect(
        tokenContrast('accent', 'bg', scheme),
        `focus ring (${scheme})`,
      ).toBeGreaterThanOrEqual(NON_TEXT_FLOOR);
    }
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

  // `--focus` became `--accent` in #108: the design reserves ONE colour for
  // state, so a separate focus token was a contradiction. A leftover
  // `var(--focus)` would resolve to nothing and paint the element invisible,
  // which is exactly the failure a rename leaves behind.
  it('has no trace of the retired --focus token anywhere in src/', () => {
    const offenders: string[] = [];
    for (const entry of readdirSync('src', { recursive: true }) as string[]) {
      const path = join('src', entry.toString());
      // This file is the one place allowed to name the retired token — it has
      // to write it down in order to look for it.
      if (path.endsWith('palette.test.ts')) continue;
      if (!/\.(astro|ts|css)$/.test(path) || statSync(path).isDirectory()) continue;
      if (readFileSync(path, 'utf8').includes('--focus')) offenders.push(path);
    }
    expect(offenders).toEqual([]);
  });

  it('mirrors the high-contrast overrides too', () => {
    const css = globalStyleBlock();
    const block = /@media\s*\(prefers-contrast:\s*more\)\s*\{([\s\S]*?\n {2}\})/.exec(css);
    expect(block, 'no prefers-contrast block to mirror').not.toBeNull();
    expect(declaredTokens(block?.[1] ?? '')).toEqual(HIGH_CONTRAST);
  });

  it('writes no colour outside :root', () => {
    const css = globalStyleBlock();
    // The high-contrast block is a second, deliberate home for two tokens —
    // and the test above proves it mirrors HIGH_CONTRAST exactly.
    const outside = css
      .replace(/@media\s*\(prefers-contrast:\s*more\)\s*\{[\s\S]*?\n {2}\}/, '')
      .replace(rootBlock(css), '');
    const literals = [
      ...(outside.match(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g) ??
        []),
      ...(outside.match(/\blight-dark\(/g) ?? []),
      ...(outside.match(/\brgba?\(/g) ?? []),
    ];
    expect(literals).toEqual([]);
  });
});
