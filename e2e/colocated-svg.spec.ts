import { expect, test } from '@playwright/test';
import { KITCHEN_SINK_MARKDOWN } from './fixtures';

// Guards issue #7: a colocated SVG referenced with plain Markdown syntax
// actually renders at the URL the post points to — the Excalidraw export that
// the Obsidian pipeline produces, and the plain vector next to it. The rest of
// that issue's acceptance criteria (JSON-LD, RSS, sitemap) is exercised for
// every published post by e2e/contracts.spec.ts.
//
// This used to run against the Obsidian pipeline post, which coupled a test
// about image resolution to one Post's sketch. The fixture carries both kinds.

test('a colocated Excalidraw SVG renders from its markdown reference', async ({ page }) => {
  await page.goto(KITCHEN_SINK_MARKDOWN);

  const sketch = page.locator("article img[src*='excalidraw']");
  await expect(sketch).toBeVisible();
  await expect(sketch).toHaveAttribute('src', /excalidraw/);
});

test('a plain colocated SVG renders too, and is not treated as a sketch', async ({ page }) => {
  await page.goto(KITCHEN_SINK_MARKDOWN);

  const vector = page.locator("article img[src*='fixture-vector']");
  await expect(vector).toBeVisible();
  await expect(vector).toHaveAttribute('src', /\.svg/);
  // The sketch-inversion rule is keyed on the *.excalidraw.svg path, so a plain
  // vector must not pick it up. Asserted here rather than only in theme.spec so
  // the two kinds are distinguished at the point they are both on the page.
  await expect(vector).not.toHaveAttribute('src', /excalidraw/);
});
