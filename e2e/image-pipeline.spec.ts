import { expect, test } from '@playwright/test';

// Guards issue #9: global image.layout/responsiveStyles config actually
// produces responsive markup for a raster image dropped into a post, and
// the dependency-free lightbox opens/closes it. The Raspberry Pi cluster post
// provides a stable, published raster-image fixture.

const POST_PATH = '/posts/raspberry-pi-cluster/';
const IMAGE_SELECTOR = 'article img[src*="raw-rpi-home-cluster"]';

test('a raster image in a post gets a multi-width srcset and lazy loading', async ({ page }) => {
  await page.goto(POST_PATH);
  const image = page.locator(IMAGE_SELECTOR).first();
  await expect(image).toHaveAttribute('loading', 'lazy');

  const srcset = await image.getAttribute('srcset');
  expect(srcset, 'srcset should be present').toBeTruthy();

  const widths = [...(srcset ?? '').matchAll(/(\d+)w/g)].map((m) => Number(m[1]));
  expect(widths.length, 'expected multiple width candidates for a raster image').toBeGreaterThan(1);
});

test('clicking an in-article image opens a full-size dialog, and Escape closes it', async ({
  page,
}) => {
  await page.goto(POST_PATH);
  const image = page.locator(IMAGE_SELECTOR).first();
  const dialog = page.locator('#lightbox');

  await expect(dialog).toBeHidden();
  await image.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveAttribute(
    'src',
    await image.evaluate((el: HTMLImageElement) => el.src),
  );

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('clicking the dialog backdrop also closes the lightbox', async ({ page }) => {
  await page.goto(POST_PATH);
  const image = page.locator(IMAGE_SELECTOR).first();
  const dialog = page.locator('#lightbox');

  await image.click();
  await expect(dialog).toBeVisible();

  // The dialog element's box hugs the image exactly (no padding), so the
  // ::backdrop only exists outside that box. Click a viewport corner well
  // away from the centered image — that lands on the backdrop, whose click
  // target the browser reports as the <dialog> element itself.
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
});
