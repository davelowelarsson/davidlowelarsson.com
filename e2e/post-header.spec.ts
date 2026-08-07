import { expect, test } from '@playwright/test';

// Centred header, in reading order: Category eyebrow, title, then date and
// state. A reader should know what KIND of writing this is before they start.

const PUBLISHED = '/posts/essay-ai-code-ownership/';

test('the header reads eyebrow, then title, then date', async ({ page }) => {
  await page.goto(PUBLISHED);

  const eyebrow = page.locator('.post-header .eyebrow');
  const title = page.locator('.post-header h1');
  const meta = page.locator('.post-header .post-meta');

  const [eyebrowBox, titleBox, metaBox] = await Promise.all([
    eyebrow.boundingBox(),
    title.boundingBox(),
    meta.boundingBox(),
  ]);

  expect(eyebrowBox?.y, 'eyebrow is not above the title').toBeLessThan(titleBox?.y ?? 0);
  expect(metaBox?.y, 'date is not below the title').toBeGreaterThan(titleBox?.y ?? 0);

  // Geometry alone is not reading order. CSS `order` or `flex-direction:
  // column-reverse` can put the boxes in the right places while a screen
  // reader gets Category, title and date in whatever sequence the DOM has —
  // so assert the DOM sequence too.
  const domOrder = await page
    .locator('.post-header')
    .evaluate((header) =>
      [...header.children].map((child) =>
        child.classList.contains('eyebrow')
          ? 'eyebrow'
          : child.classList.contains('post-meta')
            ? 'meta'
            : child.tagName.toLowerCase(),
      ),
    );
  expect(domOrder, 'the header reads in the wrong order to assistive tech').toEqual([
    'eyebrow',
    'h1',
    'meta',
  ]);
});

test('the Category eyebrow carries the word, tinted, and links to its Category', async ({
  page,
}) => {
  await page.goto(PUBLISHED);

  const badge = page.locator('.post-header .eyebrow a.badge');
  await expect(badge).toHaveText('essay');
  await expect(badge).toHaveAttribute('href', '/category/essay/');

  // Tinted, not left on the body ink — and the word is there either way.
  const [colour, ink] = await Promise.all([
    badge.evaluate((el) => getComputedStyle(el).color),
    page.locator('.post-header h1').evaluate((el) => getComputedStyle(el).color),
  ]);
  expect(colour, 'the eyebrow is untinted').not.toBe(ink);

  const box = await badge.boundingBox();
  expect(box?.height, 'the Category link is under the 24px target minimum').toBeGreaterThanOrEqual(
    24,
  );
});

test('the title is centred and the only h1', async ({ page }) => {
  await page.goto(PUBLISHED);

  await expect(page.locator('h1')).toHaveCount(1);

  const header = page.locator('.post-header');
  const title = page.locator('.post-header h1');
  const headerBox = await header.boundingBox();
  const titleBox = await title.boundingBox();

  expect(await header.evaluate((el) => getComputedStyle(el).textAlign)).toBe('center');
  const titleCentre = (titleBox?.x ?? 0) + (titleBox?.width ?? 0) / 2;
  const headerCentre = (headerBox?.x ?? 0) + (headerBox?.width ?? 0) / 2;
  expect(titleCentre).toBeCloseTo(headerCentre, 0);
});

test('the date is machine-readable and set in tabular figures', async ({ page }) => {
  await page.goto(PUBLISHED);

  const time = page.locator('.post-header time');
  const datetime = await time.getAttribute('datetime');
  expect(datetime, 'no machine-readable datetime').toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(Number.isNaN(Date.parse(datetime ?? '')), 'datetime does not parse').toBe(false);

  const figures = await time.evaluate((el) => getComputedStyle(el).fontVariantNumeric);
  expect(figures, 'dates are not in tabular figures').toContain('tabular-nums');
});

test('post-list rows stay left-aligned — the centring is scoped to the header', async ({
  page,
}) => {
  await page.goto('/posts/');

  const meta = page.locator('.post-list .post-meta').first();
  expect(await meta.evaluate((el) => getComputedStyle(el).justifyContent)).not.toBe('center');
});

test('a scheduled Post is marked, a published one is not', async ({ page }) => {
  // The e2e build runs with SHOW_DRAFTS=true, which is what a Preview
  // Deployment does — so scheduled Posts render here the way David sees them.
  await page.goto(PUBLISHED);
  await expect(page.locator('.post-header .badge-scheduled')).toHaveCount(0);

  await page.goto('/posts/til-dnsendpoint-cloudflare-comments/');
  const scheduled = page.locator('.post-header .badge-scheduled');
  await expect(scheduled).toBeVisible();
  await expect(scheduled).toContainText('scheduled');

  // State takes the accent, per ADR 0009.
  const [stateColour, accent] = await Promise.all([
    scheduled.evaluate((el) => getComputedStyle(el).color),
    page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--accent)';
      document.body.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    }),
  ]);
  expect(stateColour, 'scheduled state is not on the accent').toBe(accent);
});

test('the header reads correctly at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(PUBLISHED);

  await expect(page.locator('.post-header .eyebrow')).toBeVisible();
  await expect(page.locator('.post-header h1')).toBeVisible();
  await expect(page.locator('.post-header time')).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
