import { expect, test } from '@playwright/test';

const POST_PATH = '/posts/building-with-children/';

function requireBox<T>(box: T | null): T {
  expect(box).toBeTruthy();
  if (!box) throw new Error('expected element bounding box');
  return box;
}

test('building-with-children media stays compact in the article flow', async ({ page }) => {
  await page.goto(POST_PATH);

  const pair = page.locator('[data-image-layout="compact-pair"]');
  await expect(pair).toBeVisible();
  await expect(pair.locator('img')).toHaveCount(2);

  const pairBox = requireBox(await pair.boundingBox());
  const articleBox = requireBox(await page.locator('article').boundingBox());
  expect(pairBox.width).toBeLessThanOrEqual(articleBox.width + 1);

  const pairImageBox = requireBox(await pair.locator('img').first().boundingBox());
  expect(pairImageBox.width / pairImageBox.height).toBeCloseTo(4 / 3, 1);

  const singleImage = page.locator('[data-image-layout="constrained-single"]');
  await expect(singleImage).toBeVisible();
  const singleImageBox = requireBox(await singleImage.boundingBox());
  expect(singleImageBox.width).toBeLessThanOrEqual(544);
});

test('article images open in a fitting lightbox instead of a scroll/pan view', async ({ page }) => {
  await page.goto(POST_PATH);

  const image = page.locator('[data-image-layout="constrained-single"] img');
  const dialog = page.locator('#lightbox');

  await image.click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('data-lightbox-kind', 'image');

  const viewport = page.viewportSize();
  const lightboxImageBox = requireBox(await dialog.locator('img').boundingBox());
  expect(viewport).toBeTruthy();
  expect(lightboxImageBox.width).toBeLessThanOrEqual((viewport?.width ?? 0) * 0.92 + 1);
  expect(lightboxImageBox.height).toBeLessThanOrEqual((viewport?.height ?? 0) * 0.92 + 1);
});

test('videos can rely on their own first frame when no poster fits', async ({ page }) => {
  await page.goto(POST_PATH);

  const videos = page.locator('article video');
  await expect(videos).toHaveCount(2);
  await expect(videos.first()).not.toHaveAttribute('poster');
  await expect(videos.nth(1)).not.toHaveAttribute('poster');
});
