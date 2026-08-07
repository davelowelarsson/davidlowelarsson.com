import { expect, type Page, test } from '@playwright/test';
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

// ── The Markdown tier of the figure contract (#119) ──
//
// Framing without a figure: 41 plain images across 35 Posts get a considered
// treatment with no author edits and no syntax to remember. Three conventions,
// told apart by path alone, because the element is the only hook a Markdown
// image offers.

const RASTER = "article img[src*='test-card-wide']";
const SKETCH = "article img[src*='excalidraw']";
const VECTOR = "article img[src*='fixture-vector']";

async function filterOf(page: Page, selector: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).filter);
}

test('a raster is framed, and dimmed on a dark ground but not a light one', async ({ page }) => {
  await page.goto(KITCHEN_SINK_MARKDOWN);
  const raster = page.locator(RASTER).first();
  await expect(raster).toBeVisible();

  await page.emulateMedia({ colorScheme: 'light' });
  expect(await filterOf(page, RASTER), 'a raster is altered on a light ground').toBe('none');
  expect(
    Number.parseFloat(await raster.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)),
    'a plain Markdown raster gets no framing at all',
  ).toBeGreaterThan(0);

  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await filterOf(page, RASTER), 'a raster is not dimmed on a dark ground').toContain(
    'brightness',
  );
});

test('a drawn vector is left alone on both grounds', async ({ page }) => {
  // Already ink on the page's own ground. Dimming or inverting a drawing is
  // treating it as a photograph.
  await page.goto(KITCHEN_SINK_MARKDOWN);
  await expect(page.locator(VECTOR).first()).toBeVisible();

  await page.emulateMedia({ colorScheme: 'light' });
  expect(await filterOf(page, VECTOR), 'a vector is filtered on a light ground').toBe('none');

  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await filterOf(page, VECTOR), 'a vector is filtered on a dark ground').toBe('none');
});

test('a sketch inverts on a dark ground and is never also dimmed', async ({ page }) => {
  await page.goto(KITCHEN_SINK_MARKDOWN);
  await expect(page.locator(SKETCH).first()).toBeVisible();

  await page.emulateMedia({ colorScheme: 'light' });
  expect(await filterOf(page, SKETCH), 'a sketch is filtered on a light ground').toBe('none');

  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await filterOf(page, SKETCH);
  expect(dark, 'a sketch is not inverted on a dark ground').toContain('invert');
  // A sketch is not a photograph. The raster rule must not also reach it, or it
  // is inverted AND dimmed — the failure source order exists to prevent.
  expect(dark, 'a sketch is dimmed as well as inverted').not.toContain('brightness');
});

test('the Markdown tier frames, and stops there — no figure, no caption', async ({ page }) => {
  // The two-tier limit, asserted rather than described. A plain Markdown image
  // never becomes a <figure>, never carries a kind, never takes a caption and
  // never breaks out; those are component gestures.
  await page.goto(KITCHEN_SINK_MARKDOWN);

  await expect(page.locator('article figure.media')).toHaveCount(0);
  await expect(page.locator('article [data-media]')).toHaveCount(0);
  await expect(page.locator('article figcaption')).toHaveCount(0);
  // A diagram legitimately breaks out — it is emitted by Mermaid, a component.
  // No plain IMAGE may.
  await expect(page.locator('article img.breakout')).toHaveCount(0);
  await expect(page.locator('article p.breakout')).toHaveCount(0);
});

test('a forced theme reaches the sketch, not just the OS preference', async ({ page }) => {
  // prefers-color-scheme asks the OPERATING SYSTEM. A reader on a light OS who
  // forces dark gets a dark page — and, without the companion rule, a sketch
  // still drawn in dark strokes on it.
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(KITCHEN_SINK_MARKDOWN);
  expect(await filterOf(page, SKETCH)).toBe('none');

  await page.locator('[data-theme-set="dark"]').click();
  expect(
    await filterOf(page, SKETCH),
    'dark forced on a light OS left the sketch un-inverted',
  ).toContain('invert');

  await page.locator('[data-theme-set="light"]').click();
  expect(await filterOf(page, SKETCH), 'forcing light back left the sketch inverted').toBe('none');
});

test('the image pipeline still applies to a framed Markdown raster', async ({ page }) => {
  // Framing must not cost the responsive markup. A path-keyed CSS rule cannot
  // affect it, but that is the claim, so it is checked.
  await page.goto(KITCHEN_SINK_MARKDOWN);
  const raster = page.locator(RASTER).first();
  await expect(raster).toHaveAttribute('loading', 'lazy');
  const srcset = (await raster.getAttribute('srcset')) ?? '';
  expect([...srcset.matchAll(/(\d+)w/g)].length).toBeGreaterThan(1);
});
