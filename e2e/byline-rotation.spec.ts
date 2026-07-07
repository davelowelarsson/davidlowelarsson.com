import { expect, test } from '@playwright/test';
import { BYLINES } from '../src/lib/bylines';

// The home-page tagline rotates through BYLINES on each load. It is rendered
// canonically server-side and swapped to a random entry by an INLINE,
// parser-blocking script placed immediately after the element, so the swap
// happens before first paint — no flash. These tests exist to catch the
// refactor that would silently break that: bundling the script (making it a
// deferred module), moving it away from the element, or adopting <ClientRouter/>
// (inline scripts don't re-run on client-side navigations). See the comment in
// src/pages/index.astro and docs/astro-field-guide.md.

test('tagline is always one of the known bylines', async ({ page }) => {
  await page.goto('/');
  const text = (await page.locator('#tagline').textContent())?.trim() ?? '';
  expect(BYLINES).toContain(text);
});

test('client swap reaches the first byline when Math.random() is 0', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await expect(page.locator('#tagline')).toHaveText(BYLINES[0]);
});

test('client swap reaches the last byline as Math.random() approaches 1', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.999;
  });
  await page.goto('/');
  await expect(page.locator('#tagline')).toHaveText(BYLINES[BYLINES.length - 1]);
});

// The no-flash guarantee is structural, so assert the structure directly:
// the swap must be an inline classic script sitting right after the tagline.
// If someone converts it to a bundled module, this fails loudly.
test('no-flash contract: swap is an inline script adjacent to the tagline', async ({ page }) => {
  await page.goto('/');
  const sibling = await page.evaluate(() => {
    const el = document.getElementById('tagline');
    const next = el?.nextElementSibling;
    return {
      tag: next?.tagName ?? null,
      hasSrc: next instanceof HTMLScriptElement ? next.hasAttribute('src') : null,
      type: next?.getAttribute('type') ?? '',
    };
  });
  expect(sibling.tag).toBe('SCRIPT'); // adjacent to the element (runs pre-paint)
  expect(sibling.hasSrc).toBe(false); // inline, not an external/bundled file
  expect(sibling.type).not.toBe('module'); // classic + parser-blocking, not deferred
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('falls back to the canonical server-rendered byline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#tagline')).toHaveText(BYLINES[0]);
  });
});
