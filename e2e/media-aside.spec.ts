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

  const desktopContent = await content.boundingBox();
  const desktopFigure = await figure.boundingBox();
  expect(desktopContent, 'desktop text should have a box').not.toBeNull();
  expect(desktopFigure, 'desktop figure should have a box').not.toBeNull();
  expect(desktopFigure?.x).toBeGreaterThan(desktopContent?.x ?? Number.POSITIVE_INFINITY);
  expect(Math.abs((desktopFigure?.y ?? 0) - (desktopContent?.y ?? 0))).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileContent = await content.boundingBox();
  const mobileFigure = await figure.boundingBox();
  const mobileImage = await figure.locator('img').boundingBox();
  expect(mobileContent, 'mobile text should have a box').not.toBeNull();
  expect(mobileFigure, 'mobile figure should have a box').not.toBeNull();
  expect(mobileImage, 'mobile chart should have a box').not.toBeNull();
  expect(mobileFigure?.y).toBeGreaterThan(mobileContent?.y ?? Number.POSITIVE_INFINITY);
  expect(mobileImage?.height).toBeGreaterThan(400);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
});
