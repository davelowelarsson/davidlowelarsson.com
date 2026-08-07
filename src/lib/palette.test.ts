import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AA_FLOOR,
  AAA_FLOOR,
  CONTRAST_FLOOR,
  type ColorPair,
  contrastRatio,
  HIGH_CONTRAST,
  NON_TEXT_FLOOR,
  PALETTE,
  parseHex,
  relativeLuminance,
  SCHEMES,
  TEXT_TOKENS,
  tokenContrast,
} from './palette';
import { allCssSources, cssIn, GLOBAL_STYLESHEET, mediaBlocks, stripComments } from './stylesheets';

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

  // EVERY other reference here is greyscale or a self-comparison, which means
  // they pin the shape of the formula but not its channel weights: swapping
  // WCAG's 0.2126/0.7152/0.0722 for 0.2/0.7/0.1 leaves them all green. These
  // three separate the channels — one primary at a time against white, so each
  // ratio depends on exactly one weight.
  it('weights the channels the way WCAG does', () => {
    expect(contrastRatio('#ff0000', '#ffffff'), 'red weight').toBeCloseTo(3.998, 2);
    expect(contrastRatio('#00ff00', '#ffffff'), 'green weight').toBeCloseTo(1.372, 2);
    expect(contrastRatio('#0000ff', '#ffffff'), 'blue weight').toBeCloseTo(8.592, 2);
  });

  // Below 0.04045 sRGB is linear, above it is a 2.4 gamma curve. A colour on
  // the linear side pins the threshold; without this the constant could drift
  // and only very dark values would be wrong.
  it('uses the linear segment below the sRGB threshold', () => {
    expect(relativeLuminance('#0a0a0a')).toBeCloseTo(10 / 255 / 12.92, 6);
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

  // The project floor, deliberately above AA. No exceptions and no countdown:
  // the last one (`tint-til`, 5.28:1 on its locked value) was resolved in #113,
  // so this is now an unconditional guarantee and the style is frozen with it.
  it(`clears the ${CONTRAST_FLOOR}:1 project floor for every text token`, () => {
    expect(shortOf(CONTRAST_FLOOR)).toEqual([]);
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

  // Compare what a reader SEES, not the alpha channel. A hairline set to the
  // background's own colour at 100% opacity has more alpha and less contrast —
  // it would pass an alpha comparison while rendering an invisible divider.
  it('firms the hairlines rather than merely recolouring them', () => {
    const composite = (value: string, scheme: (typeof SCHEMES)[number]) => {
      const p = /^rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)%\)$/.exec(value);
      if (!p) throw new Error(value);
      const a = Number(p[4]) / 100;
      const base = parseHex(PALETTE.bg[scheme]);
      const ch = [1, 2, 3].map((i) => Math.round(a * Number(p[i]) + (1 - a) * base[i - 1]));
      return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    };

    for (const scheme of SCHEMES) {
      const ground = PALETTE.bg[scheme];
      const base = contrastRatio(composite(PALETTE.hairline[scheme], scheme), ground);
      const firm = contrastRatio(composite(HIGH_CONTRAST.hairline[scheme], scheme), ground);
      expect(firm, `hairline (${scheme}) is no more visible`).toBeGreaterThan(base);
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
  return stripComments(cssIn(GLOBAL_STYLESHEET));
}

function rootBlock(css: string): string {
  const match = /:root\s*\{([\s\S]*?)\n\s*\}/.exec(css);
  if (!match) throw new Error(`no :root block in ${GLOBAL_STYLESHEET}`);
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

/** The custom properties in `:root` that are deliberately not colours. */
const NON_COLOUR_TOKENS = [
  'font-prose',
  'font-mono',
  'measure',
  'gutter',
  'step-0',
  'leading',
  'space-section',
  'space-figure',
  'divider-reach',
  'divider-gap',
];

/**
 * Components that define colours of their own, and why.
 *
 * Widening this scan from one global block to every layer (#116) found five —
 * all of them predating the guard, none of them previously visible to it. They
 * are listed rather than quietly excluded, so the exceptions are finite and
 * each one has to justify itself.
 *
 * Genuinely outside the palette:
 *   ProcessStepCard, WrappedSnapshot — brand marks. Spotify green and Slack's
 *     four hues ARE those products' colours; putting them in src/lib/palette.ts
 *     would claim they are this site's, and a theme change must not repaint
 *     someone else's logo. Both components are ruled outside the figure
 *     contract by #114.
 *   Lightbox — a black scrim at 75%. The backdrop deliberately does not follow
 *     the theme: it is the absence of the page, not a surface on it.
 *   Video, YouTube — RECLASSIFIED in #118, which migrated both to the `embed`
 *     kind and made the question concrete. A letterbox is black because video
 *     is black; the facade's scrim and play triangle are the same idea. All of
 *     it is the absence of picture, exactly like the lightbox scrim above —
 *     not a surface the theme has an opinion about. The `embed` framing that
 *     IS the page's opinion (border, radius) lives in src/styles/media.css and
 *     uses tokens.
 *
 * Debt, and named as such:
 *   ArticleLinks — a surface pair (`light-dark(#ffffff, #151518)`) that could
 *     be tokens and is not. The last real one. It is NOT a media component, so
 *     #118 does not reach it and inventing a token for it here would be a
 *     visual change smuggled into a migration. It needs its own decision.
 */
const COLOUR_EXCEPTIONS = new Set([
  'src/components/ArticleLinks.astro',
  'src/components/Lightbox.astro',
  'src/components/ProcessStepCard.astro',
  'src/components/Video.astro',
  'src/components/YouTube.astro',
  'src/components/WrappedSnapshot.astro',
]);

/** Every rule whose selector starts with `:root`, wherever it appears. */
function withoutRootRules(css: string): string {
  return css.replace(/:root[^{]*\{[^{}]*\}/g, '');
}

describe('the stylesheet mirrors the palette', () => {
  it('declares exactly the tokens PALETTE defines, with the same values', () => {
    expect(declaredTokens(rootBlock(globalStyleBlock()))).toEqual(PALETTE);
  });

  // The mirror above only inspects `light-dark()` declarations, so a token
  // written any other way — `--rogue: #f00` — used to sail through it AND
  // through the literal scan, which exempts all of :root. Invert the question:
  // every custom property in :root is either a known non-colour or a PALETTE
  // key. There is no third category.
  it('declares no custom property in :root that PALETTE does not know about', () => {
    const names = [...rootBlock(globalStyleBlock()).matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]);
    const unknown = names.filter((name) => !NON_COLOUR_TOKENS.includes(name) && !(name in PALETTE));
    expect(unknown, 'a token in :root is defined outside src/lib/palette.ts').toEqual([]);
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
    // Brace-matched rather than anchored on a two-space indent: the same rule
    // is indented differently in a .css file and in an .astro <style> block,
    // and an indentation-anchored regex silently stops matching when a rule
    // moves between layers.
    const [block] = mediaBlocks(cssIn(GLOBAL_STYLESHEET), /prefers-contrast:\s*more/);
    expect(block, 'no prefers-contrast block to mirror').toBeDefined();
    expect(declaredTokens(block ?? '')).toEqual(HIGH_CONTRAST);
  });

  it('writes no colour outside :root', () => {
    // Strip every :root rule WHEREVER it appears — including the one nested in
    // the prefers-contrast query. Previously the whole media block was exempted,
    // which also excused any ordinary rule inside it: a
    // `@media (prefers-contrast: more) { .post-description { color: #fff } }`
    // passed both tests while making secondary text nearly invisible.
    // Every layer, not just the global sheet. Before #116 there was only one
    // block to scan, so moving a rule into a component would have been a way
    // out of this guard; now it is not.
    const outside = allCssSources()
      .filter(([path]) => !COLOUR_EXCEPTIONS.has(path))
      .map(([path, css]) => `/* ${path} */\n${withoutRootRules(stripComments(css))}`)
      .join('\n');

    // Every colour syntax CSS has, not just the three this project happens to
    // use. `oklch()`, `hsl()`, a named colour or an uppercase `RGB()` are all
    // ways to define a colour somewhere other than the palette.
    const literals = [
      ...(outside.match(/#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\b/gi) ?? []),
      ...(outside.match(
        /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/gi,
      ) ?? []),
      ...(outside.match(
        /:\s*(?:red|blue|green|white|black|gray|grey|yellow|orange|purple|pink|brown|cyan|magenta|silver|gold|teal|navy|olive|maroon|lime|aqua|fuchsia)\b/gi,
      ) ?? []),
    ];
    expect(literals, 'a colour is defined outside the palette').toEqual([]);
  });
});
