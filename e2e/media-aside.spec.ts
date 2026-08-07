import { expect, test } from '@playwright/test';

const POST_PATH = '/posts/essay-ai-code-ownership/';

test('research media sits right on desktop and below its text on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(POST_PATH);

  const aside = page.locator('[data-media-side="right"]');
  const content = aside.locator('.media-aside__content');
  const figure = aside.locator('figure');
  await expect(figure).toBeVisible();
  await expect(figure.getByRole('link', { name: 'Data: METR' })).toBeVisible();
  await expect(content.locator('p')).toHaveCount(3);

  const desktopLayout = await aside.evaluate((element) => {
    const contentBox = element.querySelector('.media-aside__content')?.getBoundingClientRect();
    const figureBox = element.querySelector('figure')?.getBoundingClientRect();
    if (!contentBox || !figureBox) return null;

    return {
      figureStartsAfterContent: figureBox.x >= contentBox.x + contentBox.width,
      topDifference: Math.abs(figureBox.y - contentBox.y),
      // Proportional, not an absolute pixel budget — see the note below.
      balance:
        Math.min(figureBox.height, contentBox.height) /
        Math.max(figureBox.height, contentBox.height),
    };
  });
  expect(desktopLayout, 'desktop media should have boxes').not.toBeNull();
  expect(desktopLayout?.figureStartsAfterContent).toBe(true);
  expect(desktopLayout?.topDifference).toBeLessThanOrEqual(1);

  // The two columns should read as a pair rather than one dwarfing the other.
  //
  // This was `heightDifference < 100` and it was measuring the test runner's
  // font stack as much as the layout. The figure's height is fixed by the
  // image's aspect ratio; the text column's is whatever `system-ui` wraps to —
  // which is SF on macOS and something wider on CI's Linux. The margin was
  // ~24px, and #105's larger type spent it: 76px locally, 145px on CI, same
  // commit. A ratio is the same on both, and still fails loudly on the
  // breakages that matter — a figure whose image never loads collapses to its
  // caption (~8%), and a figure that loses its column trips
  // `figureStartsAfterContent` first.
  expect(desktopLayout?.balance, 'the aside reads as one tall column plus a stub').toBeGreaterThan(
    0.7,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await aside.evaluate((element) => {
    const contentBox = element.querySelector('.media-aside__content')?.getBoundingClientRect();
    const figureBox = element.querySelector('figure')?.getBoundingClientRect();
    const imageBox = element.querySelector('figure img')?.getBoundingClientRect();
    if (!contentBox || !figureBox || !imageBox) return null;

    return {
      figureFollowsContent: figureBox.y > contentBox.y,
      imageHeight: imageBox.height,
    };
  });
  expect(mobileLayout, 'mobile media should have boxes').not.toBeNull();
  expect(mobileLayout?.figureFollowsContent).toBe(true);
  expect(mobileLayout?.imageHeight).toBeGreaterThan(400);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
});
