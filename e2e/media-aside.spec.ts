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
      heightDifference: Math.abs(figureBox.height - contentBox.height),
    };
  });
  expect(desktopLayout, 'desktop media should have boxes').not.toBeNull();
  expect(desktopLayout?.figureStartsAfterContent).toBe(true);
  expect(desktopLayout?.topDifference).toBeLessThanOrEqual(1);
  expect(desktopLayout?.heightDifference).toBeLessThan(100);

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
