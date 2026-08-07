import { expect, test } from '@playwright/test';
import { PALETTE, parseHex, SCHEMES, type Scheme, type TokenName } from '../src/lib/palette';

// src/lib/palette.test.ts proves the stylesheet SOURCE mirrors PALETTE. This
// proves the same of the page a reader actually gets: the tokens survive the
// build, resolve to the right half in each scheme, and a Category badge really
// paints with the tint the data names. Together they close the loop — a colour
// is defined once, in palette.ts.
//
// Compare RESOLVED colours, not strings: the build's minifier rewrites
// `rgb(0 0 0 / 12%)` as `#0000001f`, which is the same colour spelled
// differently. Letting the browser canonicalise both sides tests the thing
// that matters and ignores the thing that doesn't.

/**
 * For each token, what `var(--token)` resolves to on the page, next to what
 * PALETTE's own value for this scheme resolves to. Both go through the same
 * browser colour parser, so a match means the reader sees the data's colour.
 */
async function resolveTokens(page: import('@playwright/test').Page, scheme: Scheme) {
  const expected = Object.entries(PALETTE).map(([name, pair]) => [name, pair[scheme]] as const);

  return page.evaluate((entries: (readonly [string, string])[]) => {
    const probe = document.createElement('span');
    document.body.append(probe);
    const readback: Record<string, { actual: string; expected: string }> = {};
    for (const [name, value] of entries) {
      probe.style.color = `var(--${name})`;
      const actual = getComputedStyle(probe).color;
      probe.style.color = value;
      readback[name] = { actual, expected: getComputedStyle(probe).color };
    }
    probe.remove();
    return readback;
  }, expected);
}

for (const scheme of SCHEMES) {
  test(`every token resolves to its PALETTE value in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');

    for (const [name, { actual, expected }] of Object.entries(await resolveTokens(page, scheme))) {
      expect(actual, `--${name} (${scheme})`).toBe(expected);
      expect(actual, `--${name} (${scheme}) resolved to nothing`).not.toBe('');
    }
  });
}

// Playwright's default colour scheme is light, so the light half is what paints.
const TINTED_CATEGORIES = [
  ['essay', 'tint-essay'],
  ['til', 'tint-til'],
  ['experiment', 'tint-experiment'],
  ['project', 'tint-project'],
] as const satisfies readonly (readonly [string, TokenName])[];

for (const [category, token] of TINTED_CATEGORIES) {
  test(`a ${category} badge paints with --${token}`, async ({ page }) => {
    await page.goto(`/category/${category}/`);
    const badge = page.locator(`.badge-${category}`).first();
    await expect(badge).toBeVisible();

    const [red, green, blue] = parseHex(PALETTE[token].light);
    expect(await badge.evaluate((el) => getComputedStyle(el).color)).toBe(
      `rgb(${red}, ${green}, ${blue})`,
    );
  });
}

// ADR 0009's first rule of colour: a tint colours the Category WORD, never a
// swatch and never a chart segment. `til` and `experiment` sit ΔE 6.7 apart —
// as two coloured words they are unambiguous, because the word carries the
// meaning; as two adjacent bar segments nobody could tell them apart. So the
// guarantee to hold is that the word is always there to read.
test('Category is never conveyed by colour alone', async ({ page }) => {
  for (const [category] of TINTED_CATEGORIES) {
    await page.goto(`/category/${category}/`);
    const badges = page.locator(`.badge-${category}`);
    const count = await badges.count();
    expect(count, `expected tinted badges on /category/${category}/`).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const text = ((await badges.nth(i).textContent()) ?? '').trim().toLowerCase();
      expect(text, `a ${category} badge carried colour but no word`).toContain(category);
    }
  }
});
