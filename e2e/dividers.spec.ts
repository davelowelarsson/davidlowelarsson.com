import { expect, test } from '@playwright/test';

// The design promises ONE KNOB: `--divider-reach` at 0 leaves the label alone,
// at 100% brings full-width rules back. A knob nobody turns is just a constant,
// so these tests turn it.

const PAGES_WITH_DIVIDERS = ['/', '/posts/', '/category/essay/'];

/** The rendered width of a divider's two rules, in px. */
async function ruleWidths(page: import('@playwright/test').Page) {
  return page
    .locator('.divider')
    .first()
    .evaluate((el) => {
      const read = (which: '::before' | '::after') =>
        Number.parseFloat(getComputedStyle(el, which).width);
      return { before: read('::before'), after: read('::after') };
    });
}

test('a divider is a centred label with rules reaching either side', async ({ page }) => {
  for (const path of PAGES_WITH_DIVIDERS) {
    await page.goto(path);

    const divider = page.locator('.divider').first();
    await expect(divider, path).toBeVisible();

    const { before, after } = await ruleWidths(page);
    expect(before, `${path}: no rule before the label`).toBeGreaterThan(0);
    expect(after, `${path}: no rule after the label`).toBeCloseTo(before, 0);

    // Reaching a fixed distance and stopping — not running to the edge.
    const dividerBox = await divider.boundingBox();
    expect(before, `${path}: the rule runs edge to edge`).toBeLessThan(
      (dividerBox?.width ?? 0) / 3,
    );

    // The label is centred between them.
    const labelBox = await divider.locator('span').boundingBox();
    const labelCentre = (labelBox?.x ?? 0) + (labelBox?.width ?? 0) / 2;
    const dividerCentre = (dividerBox?.x ?? 0) + (dividerBox?.width ?? 0) / 2;
    expect(labelCentre, `${path}: label is not centred`).toBeCloseTo(dividerCentre, 0);
  }
});

test('the reach knob at 0 removes the rules and leaves the label', async ({ page }) => {
  await page.goto('/posts/');
  await page.addStyleTag({ content: ':root { --divider-reach: 0; }' });

  const { before, after } = await ruleWidths(page);
  expect(before, 'rules survived reach: 0').toBe(0);
  expect(after, 'rules survived reach: 0').toBe(0);

  await expect(page.locator('.divider span').first()).toBeVisible();
});

test('the reach knob at 100% restores full-width rules', async ({ page }) => {
  await page.goto('/posts/');

  const narrow = await ruleWidths(page);
  await page.addStyleTag({ content: ':root { --divider-reach: 100%; }' });
  const full = await ruleWidths(page);

  expect(full.before, 'reach: 100% did not widen the rules').toBeGreaterThan(narrow.before * 2);

  // Full width means the label plus both rules plus the gaps fill the row.
  const divider = page.locator('.divider').first();
  const dividerBox = await divider.boundingBox();
  const labelBox = await divider.locator('span').boundingBox();
  const gap = await divider.evaluate((el) => Number.parseFloat(getComputedStyle(el).columnGap));

  expect(full.before + full.after + (labelBox?.width ?? 0) + gap * 2).toBeCloseTo(
    dividerBox?.width ?? 0,
    0,
  );
});

test('dividers stay headings in the accessibility tree', async ({ page }) => {
  await page.goto('/posts/');

  // The rules are ::before/::after, which never enter the tree — so a divider
  // reads as its label and nothing else.
  const heading = page.getByRole('heading', { level: 2 }).first();
  await expect(heading).toHaveClass(/divider/);
  expect((await heading.textContent())?.trim()).toMatch(/^\S+$/);
});

test('dividers reflow at 320px without overlap or horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/posts/');

  const divider = page.locator('.divider').first();
  const { before, after } = await ruleWidths(page);
  const labelBox = await divider.locator('span').boundingBox();
  const dividerBox = await divider.boundingBox();

  expect(before, 'rules vanished at 320px').toBeGreaterThan(0);
  expect(
    before + after + (labelBox?.width ?? 0),
    'a rule overlaps its label at 320px',
  ).toBeLessThanOrEqual(dividerBox?.width ?? 0);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
