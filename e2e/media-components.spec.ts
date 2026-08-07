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

  const pair = page.locator('figure.media[data-media="photo"].image-pair');
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

  const singleImage = page.locator('figure.media[data-media="photo"]:not(.breakout)').first();
  await expect(singleImage).toBeVisible();
  const singleImageBox = requireBox(await singleImage.locator('.media__body').boundingBox());
  // 34rem, the component's own constant — not a text-dependent measurement.
  expect(singleImageBox.width).toBeLessThanOrEqual(544);
});

test('article images open in a fitting lightbox instead of a scroll/pan view', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

  const image = page.locator('figure.media[data-media="photo"]:not(.breakout) img').first();
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

// ── The figure contract, proven on one kind (#117) ──
//
// The tracer bullet: before four more components are committed to this shape,
// it is exercised through markup, CSS and the browser. The kitchen-sink fixture
// carries both cases — constrained, and broken out with a caption.

test('a figure declares its kind, and its content sits in a body element', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

  const figure = page.locator('figure.media[data-media="photo"]').first();
  await expect(figure).toBeVisible();
  await expect(figure.locator('.media__body img')).toBeVisible();
  // The retired vocabularies are gone from the WHOLE page, not just this
  // component: #118 finished the migration ArticleImage started.
  await expect(page.locator('[data-image-layout]')).toHaveCount(0);
  await expect(page.locator('[data-image-crop]')).toHaveCount(0);
  await expect(page.locator('[data-media-side]')).toHaveCount(0);
});

test('a photo is framed, and dimmed on a dark ground but not on a light one', async ({ page }) => {
  await page.goto(KITCHEN_SINK);
  const image = page.locator('figure.media[data-media="photo"] .media__body img').first();

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(image).toBeVisible();
  const light = await image.evaluate((el) => {
    const style = getComputedStyle(el);
    return { filter: style.filter, radius: style.borderTopLeftRadius };
  });
  // Framed, not restyled: the page must not distort what it is showing.
  expect(light.filter, 'a photo is altered on a light ground').toBe('none');
  expect(Number.parseFloat(light.radius), 'a photo is not framed at all').toBeGreaterThan(0);

  await page.emulateMedia({ colorScheme: 'dark' });
  const darkFilter = await image.evaluate((el) => getComputedStyle(el).filter);
  expect(darkFilter, 'a bright raster is not dimmed on a dark ground').toContain('brightness');

  // The trap: prefers-color-scheme cannot see a forced theme. A reader on a
  // LIGHT OS who forces dark must still get the dimming.
  await page.emulateMedia({ colorScheme: 'light' });
  await page.locator('[data-theme-set="dark"]').click();
  expect(
    await image.evaluate((el) => getComputedStyle(el).filter),
    'dark forced on a light OS left the photo undimmed',
  ).toContain('brightness');
});

test('a caption stays at the reading measure even when its figure breaks out', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(KITCHEN_SINK);

  const figure = page.locator('figure.media.breakout[data-media="photo"]').first();
  await expect(figure).toBeVisible();
  const caption = figure.locator('.media__caption');
  await expect(caption).toBeVisible();

  const figureBox = requireBox(await figure.boundingBox());
  const captionBox = requireBox(await caption.boundingBox());
  const paragraphBox = requireBox(await page.locator('.prose p').first().boundingBox());

  // The figure really did break out — otherwise this test proves nothing.
  expect(figureBox.width, 'the figure did not break out').toBeGreaterThan(paragraphBox.width + 40);
  // …and the caption did not follow it out there.
  expect(captionBox.width, 'the caption inherited the broken-out width').toBeLessThanOrEqual(
    paragraphBox.width + 1,
  );
  // Centred under the figure rather than pinned to one edge of it.
  const captionCentre = captionBox.x + captionBox.width / 2;
  const figureCentre = figureBox.x + figureBox.width / 2;
  expect(Math.abs(captionCentre - figureCentre)).toBeLessThanOrEqual(2);
});

for (const width of [320, 390]) {
  test(`every figure fits without pushing the page sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(KITCHEN_SINK);

    const figures = page.locator('figure.media');
    const count = await figures.count();
    expect(count, 'no figures to check').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = requireBox(await figures.nth(i).boundingBox());
      expect(box.x, `figure ${i} starts off-screen`).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width, `figure ${i} runs past the viewport`).toBeLessThanOrEqual(
        width + 1,
      );
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
      'the page scrolls sideways',
    ).toBeLessThanOrEqual(1);
  });
}

// ── The embed kind (#118) ──
//
// A third-party iframe's framing problem is genuinely different from a
// photograph's: the page controls the box and never the interior. That is why
// it is its own kind rather than `photo` with a shrug.

test('self-hosted video and the third-party facade are both embeds', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

  const video = page
    .locator('figure.media[data-media="embed"]')
    .filter({ has: page.locator('video') });
  const facade = page
    .locator('figure.media[data-media="embed"]')
    .filter({ has: page.locator('.youtube-embed') });
  await expect(video.first()).toBeVisible();
  await expect(facade.first()).toBeVisible();
  await expect(video.first().locator('.media__body')).toBeVisible();
  await expect(facade.first().locator('.media__body')).toBeVisible();
});

test('an embed is framed as a box and never reached into', async ({ page }) => {
  await page.goto(KITCHEN_SINK);
  const body = page
    .locator('figure.media[data-media="embed"] .media__body')
    .filter({ has: page.locator('video') })
    .first();

  await page.emulateMedia({ colorScheme: 'light' });
  const light = await body.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      radius: style.borderTopLeftRadius,
      border: style.borderTopWidth,
      filter: style.filter,
    };
  });
  expect(Number.parseFloat(light.radius), 'an embed is not framed').toBeGreaterThan(0);
  expect(Number.parseFloat(light.border), 'an embed has no box').toBeGreaterThan(0);

  // No dimming on either ground. A dimmed video is a worse video, and unlike a
  // raster it is not sitting still to be glanced at.
  expect(light.filter).toBe('none');
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await body.evaluate((el) => getComputedStyle(el).filter)).toBe('none');
});
