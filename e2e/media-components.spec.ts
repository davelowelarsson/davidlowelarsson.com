import { expect, test } from '@playwright/test';
import { KITCHEN_SINK } from './fixtures';

// The component tier of the figure contract: a constrained single image, a
// compact pair, the lightbox they open into, and self-hosted video with and
// without a poster. This used to run against a published Post (2020's
// "building with children"), which meant an edit to that post's photographs
// could fail a test about layout. It targets the fixture now.

function requireBox<T>(box: T | null): T {
  expect(box).toBeTruthy();
  if (!box) throw new Error('expected element bounding box');
  return box;
}

test('a compact pair stays inside the article flow at its declared crop', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

  const pair = page.locator('[data-image-layout="compact-pair"]');
  await expect(pair).toBeVisible();
  await expect(pair.locator('img')).toHaveCount(2);

  const pairBox = requireBox(await pair.boundingBox());
  const articleBox = requireBox(await page.locator('article').boundingBox());
  expect(pairBox.width).toBeLessThanOrEqual(articleBox.width + 1);

  const pairImageBox = requireBox(await pair.locator('img').first().boundingBox());
  expect(pairImageBox.width / pairImageBox.height).toBeCloseTo(4 / 3, 1);
});

test('a constrained single image stays inside its own cap', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

  const singleImage = page.locator('[data-image-layout="constrained-single"]');
  await expect(singleImage).toBeVisible();
  const singleImageBox = requireBox(await singleImage.boundingBox());
  // 34rem, the component's own constant — not a text-dependent measurement.
  expect(singleImageBox.width).toBeLessThanOrEqual(544);
});

test('article images open in a fitting lightbox instead of a scroll/pan view', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

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

test('a video takes the poster it was given, and falls back to its own first frame when it was not', async ({
  page,
}) => {
  await page.goto(KITCHEN_SINK);

  const videos = page.locator('article video');
  await expect(videos).toHaveCount(2);

  // The fixture carries one of each case on purpose: giving a video a poster it
  // was never handed is worse than showing its first frame.
  await expect(videos.first()).toHaveAttribute('poster', /\S/);
  await expect(videos.nth(1)).not.toHaveAttribute('poster');
});
