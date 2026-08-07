import { expect, test } from '@playwright/test';
import { KITCHEN_SINK } from './fixtures';

// The aside's layout, not the essay it was built for. The fixture carries one
// <MediaAside side="right"> with three paragraphs and a captioned figure.
const POST_PATH = KITCHEN_SINK;
/** The fixture's aside card is 900x1200 — its own file, so this cannot drift. */
const FIXTURE_IMAGE_RATIO = 900 / 1200;

test('aside media sits right on desktop and below its text on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(POST_PATH);

  // Placement lives on the wrapper, kind on the figure inside it (#118).
  const aside = page.locator('[data-placement="right"]');
  const content = aside.locator('.media-aside__content');
  const figure = aside.locator('figure');
  await expect(figure).toBeVisible();
  await expect(figure.getByRole('link', { name: 'Data: Astro' })).toBeVisible();
  await expect(content.locator('p')).toHaveCount(3);

  const desktopLayout = await aside.evaluate((element) => {
    const contentBox = element.querySelector('.media-aside__content')?.getBoundingClientRect();
    const figureBox = element.querySelector('figure')?.getBoundingClientRect();
    if (!contentBox || !figureBox) return null;

    const imageBox = element.querySelector('figure img')?.getBoundingClientRect();
    if (!imageBox) return null;

    return {
      figureStartsAfterContent: figureBox.x >= contentBox.x + contentBox.width,
      topDifference: Math.abs(figureBox.y - contentBox.y),
      // Structure, not size. See the note below.
      imageRatio: imageBox.width / imageBox.height,
      imageShareOfFigure: imageBox.width / figureBox.width,
    };
  });
  expect(desktopLayout, 'desktop media should have boxes').not.toBeNull();
  expect(desktopLayout?.figureStartsAfterContent).toBe(true);
  expect(desktopLayout?.topDifference).toBeLessThanOrEqual(1);

  // The figure did not collapse.
  //
  // This assertion has been walked back twice. It was `heightDifference < 100`,
  // which measured the test runner's font stack as much as the layout — SF on
  // macOS, something wider on CI's Linux, 76px locally and 145px on CI from the
  // same commit. It then became a min/max height RATIO, which is scale-free but
  // still compares a text-determined height against an image-determined one, so
  // it moves whenever the prose or the font does.
  //
  // What the test actually wants to know is whether the image rendered at all:
  // a figure whose image never loads collapses to its caption. That is knowable
  // without measuring text. The fixture's card is 900x1200, so a rendered ratio
  // of 0.75 means it is there, at its own proportions, filling its column.
  expect(desktopLayout?.imageRatio, 'the aside image is not at its intrinsic ratio').toBeCloseTo(
    FIXTURE_IMAGE_RATIO,
    2,
  );
  expect(
    desktopLayout?.imageShareOfFigure,
    'the aside image does not fill its column',
  ).toBeGreaterThan(0.9);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await aside.evaluate((element) => {
    const contentBox = element.querySelector('.media-aside__content')?.getBoundingClientRect();
    const figureBox = element.querySelector('figure')?.getBoundingClientRect();
    const imageBox = element.querySelector('figure img')?.getBoundingClientRect();
    if (!contentBox || !figureBox || !imageBox) return null;

    return {
      figureFollowsContent: figureBox.y > contentBox.y,
      imageRatio: imageBox.width / imageBox.height,
    };
  });
  expect(mobileLayout, 'mobile media should have boxes').not.toBeNull();
  expect(mobileLayout?.figureFollowsContent).toBe(true);
  // Same reasoning as the desktop case: the image is still itself, stacked.
  expect(mobileLayout?.imageRatio, 'the stacked image is not at its intrinsic ratio').toBeCloseTo(
    FIXTURE_IMAGE_RATIO,
    2,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
});
