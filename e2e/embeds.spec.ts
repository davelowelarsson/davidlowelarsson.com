import { expect, test } from '@playwright/test';

// Guards issue #37: a <YouTube /> facade never talks to Google/YouTube until
// the reader clicks play, and never shifts layout while its poster loads.
// The fixture post (embed-test-fixture, draft: true, .mdx) is built in this
// e2e run because playwright.config.ts sets SHOW_DRAFTS=true — it's excluded
// from the production build instead (src/lib/production-build.test.ts).

const EMBED_FIXTURE_PATH = '/posts/embed-test-fixture/';

test('the facade loads nothing from Google/YouTube until the reader clicks play', async ({
  page,
}) => {
  const thirdPartyRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/\byoutube[a-z0-9.-]*\.com\b/i.test(url) || /\bgoogle[a-z0-9.-]*\.com\b/i.test(url)) {
      thirdPartyRequests.push(url);
    }
  });

  await page.goto(EMBED_FIXTURE_PATH);

  const facade = page.locator('.youtube-embed');
  await expect(facade).toBeVisible();
  const button = facade.getByRole('button', { name: /Play video: Test/ });
  await expect(button).toBeVisible();
  await expect(facade.locator('iframe')).toHaveCount(0);

  // Let any stray request settle before asserting nothing third-party fired.
  await page.waitForLoadState('networkidle');
  expect(thirdPartyRequests).toEqual([]);

  const boxBeforeClick = await facade.boundingBox();

  await button.click();

  const iframe = facade.locator('iframe');
  await expect(iframe).toHaveCount(1);
  await expect(iframe).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\//);

  const boxAfterClick = await facade.boundingBox();
  expect(boxAfterClick?.height).toBe(boxBeforeClick?.height);
});

test('the facade poster causes no layout shift once it finishes loading', async ({ page }) => {
  await page.goto(EMBED_FIXTURE_PATH);
  const facade = page.locator('.youtube-embed');

  const boxAtLoad = await facade.boundingBox();
  await page
    .locator('.youtube-embed__poster')
    .first()
    .evaluate((img: HTMLImageElement) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => img.addEventListener('load', resolve)),
    );
  const boxAfterPosterLoad = await facade.boundingBox();

  expect(boxAfterPosterLoad?.height).toBe(boxAtLoad?.height);
  expect(boxAfterPosterLoad?.width).toBe(boxAtLoad?.width);
});

test('clicking the poster plays the video without opening the image lightbox', async ({ page }) => {
  await page.goto(EMBED_FIXTURE_PATH);

  const facade = page.locator('.youtube-embed');
  const dialog = page.locator('#lightbox');
  await expect(dialog).toBeHidden();

  await facade.locator('.youtube-embed__poster').click({ position: { x: 20, y: 20 } });

  await expect(facade.locator('iframe')).toHaveCount(1);
  await expect(dialog).toBeHidden();
});

test('the Maya exporter post embeds both original videos with fallbacks', async ({ page }) => {
  await page.goto('/posts/maya-scene-python-to-xml/');

  const players = page.locator('.youtube-player');
  await expect(players).toHaveCount(2);
  await expect(players.locator('[data-youtube-id="UXsNGHSSLPo"]')).toHaveCount(1);
  await expect(players.locator('[data-youtube-id="PKhWh5Hbx6U"]')).toHaveCount(1);
  await expect(players.getByRole('link', { name: /^Open ".+" on YouTube$/ })).toHaveCount(2);
});

test('the CGFX post embeds both original videos with fallbacks', async ({ page }) => {
  await page.goto('/posts/cgfx-and-glsl/');

  const players = page.locator('.youtube-player');
  await expect(players).toHaveCount(2);
  await expect(players.locator('[data-youtube-id="PUBQvz_dP18"]')).toHaveCount(1);
  await expect(players.locator('[data-youtube-id="NaFxesQ4Lzw"]')).toHaveCount(1);
  await expect(players.getByRole('link', { name: /^Open ".+" on YouTube$/ })).toHaveCount(2);
});
