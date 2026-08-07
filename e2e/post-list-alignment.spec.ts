import { expect, test } from '@playwright/test';

// The trap this file exists to prevent, which has already cost an hour once:
// a bare `ul { padding-left: … }` for prose lists outranks `.post-list
// { padding: 0 }` on specificity — same specificity, later in the sheet wins —
// and silently pushes every row of every post list out of alignment. Nothing
// errors; the page just stops lining up, on three kinds of page at once.
//
// So the guarantee is not "the rule is scoped" (a reader cannot see a
// selector) but "the rows still line up", asserted where it would break.

const LISTING_PAGES = [
  '/',
  '/posts/',
  '/category/essay/',
  '/category/til/',
  '/category/experiment/',
  '/category/project/',
];

for (const path of LISTING_PAGES) {
  test(`post rows stay flush with the page heading on ${path}`, async ({ page }) => {
    await page.goto(path);

    const heading = page.locator('h1').first();
    const list = page.locator('.post-list').first();
    await expect(list).toBeVisible();

    const inset = await list.evaluate((el) => getComputedStyle(el).paddingInlineStart);
    expect(inset, `${path}: .post-list picked up prose list padding`).toBe('0px');

    // Measure the ROW, not the title: a row with a cover thumbnail indents its
    // title by the thumbnail's width, which is the layout working correctly.
    // The `li` edge is what list padding would shift.
    const headingBox = await heading.boundingBox();
    const rows = page.locator('.post-list > li');
    const count = await rows.count();
    expect(count, `${path}: expected post rows to measure`).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const rowBox = await rows.nth(i).boundingBox();
      expect(rowBox?.x, `${path}: post row ${i} is not flush with the heading`).toBeCloseTo(
        headingBox?.x ?? 0,
        0,
      );
    }
  });
}

// Prose lists still need their indent — scoping must not mean deleting it.
test('prose lists inside an article keep their indent', async ({ page }) => {
  await page.goto('/posts/experiment-home-lab-topology/');
  const list = page.locator('article ul').first();
  await expect(list).toBeVisible();

  const inset = await list.evaluate((el) =>
    Number.parseFloat(getComputedStyle(el).paddingInlineStart),
  );
  expect(inset, 'prose list lost its indent').toBeGreaterThan(0);
});
