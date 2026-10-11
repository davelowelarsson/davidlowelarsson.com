import { expect, type Locator, test } from '@playwright/test';
import { KITCHEN_SINK } from './fixtures';

// The Retrospelsmässan newsletter recreation: focusing the field makes MegaMan
// rock, leaving it makes him stand still, and nothing is ever sent. It targets
// the fixture rather than the essay that embeds it (ADR 0011). The fixture holds
// two demos on purpose, which is also what proves state is scoped by element.

const DEMO = '[data-megaman-demo]';

/** Which sprite layer is showing, read from what the reader would see. */
async function visibleSprite(demo: Locator) {
  return demo.evaluate((el) => {
    const opacity = (selector: string) =>
      Number.parseFloat(getComputedStyle(el.querySelector(selector) as Element).opacity);
    return {
      still: opacity('.megaman-demo__still'),
      rocking: opacity('.megaman-demo__rocking'),
    };
  });
}

test('focusing the email field makes MegaMan rock, and leaving it stands him still', async ({
  page,
}) => {
  await page.goto(KITCHEN_SINK);

  const demo = page.locator(DEMO).first();
  const input = demo.getByRole('textbox', { name: 'Email address' });
  await expect(input).toBeVisible();

  await expect(demo).toHaveAttribute('data-rocking', 'false');
  expect(await visibleSprite(demo)).toEqual({ still: 1, rocking: 0 });

  await input.focus();
  await expect(demo).toHaveAttribute('data-rocking', 'true');
  expect(await visibleSprite(demo)).toEqual({ still: 0, rocking: 1 });

  await input.blur();
  await expect(demo).toHaveAttribute('data-rocking', 'false');
  expect(await visibleSprite(demo)).toEqual({ still: 1, rocking: 0 });
});

test('the rocking sprite is the original GIF, served as a GIF', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

  const rocking = page.locator(`${DEMO} .megaman-demo__rocking`).first();
  const url = await rocking.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(url).toMatch(/megaman-rocking[^"')]*\.gif/);

  const response = await page.request.get(url.match(/url\("?([^")]+)"?\)/)?.[1] ?? '');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/gif');
});

test('two demos on one page rock independently', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

  const demos = page.locator(DEMO);
  await expect(demos).toHaveCount(2);

  await demos.nth(0).getByRole('textbox').focus();
  await expect(demos.nth(0)).toHaveAttribute('data-rocking', 'true');
  await expect(demos.nth(1)).toHaveAttribute('data-rocking', 'false');
});

test('submitting does not navigate and sends nothing', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

  // Lazy images load as the demo scrolls into view, so only requests that could
  // carry a submission count: a page load, a fetch or an XHR.
  const requests: string[] = [];
  page.on('request', (request) => {
    if (['document', 'fetch', 'xhr'].includes(request.resourceType())) {
      requests.push(request.url());
    }
  });
  const before = page.url();

  const demo = page.locator(DEMO).first();
  const input = demo.getByRole('textbox', { name: 'Email address' });
  await input.fill('someone@example.com');
  await demo.getByRole('button', { name: 'Ok' }).click();
  await input.press('Enter');

  await expect(page).toHaveURL(before);
  expect(page.url()).toBe(before);
  expect(requests, 'a submit made a request').toEqual([]);
  await expect(input).toHaveValue('someone@example.com');
});

test.describe('with reduced motion', () => {
  test('focusing the field keeps MegaMan still', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(KITCHEN_SINK);

    const demo = page.locator(DEMO).first();
    await demo.getByRole('textbox', { name: 'Email address' }).focus();

    await expect(demo).toHaveAttribute('data-rocking', 'false');
    expect(await visibleSprite(demo)).toEqual({ still: 1, rocking: 0 });
    await expect(demo.locator('.megaman-demo__rocking')).toBeHidden();
  });
});
