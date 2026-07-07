import { expect, test } from '@playwright/test';

test('landing page presents David and navigates to posts', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('David Lowe Larsson');

  await page.getByRole('link', { name: 'Posts' }).click();
  await expect(page).toHaveURL(/\/posts\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Posts');
});

test('footer links point at LinkedIn and GitHub', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
    'href',
    /linkedin\.com/,
  );
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', /github\.com/);
});

test('drafts are hidden when SHOW_DRAFTS is off (production behavior)', async ({ page }) => {
  await page.goto('/posts/');
  await expect(page.getByText('Hello, world (again)')).toHaveCount(0);
});

test('rss feed serves rich items for published posts and never drafts', async ({ request }) => {
  const response = await request.get('/rss.xml');
  expect(response.status()).toBe(200);

  const xml = await response.text();
  expect(xml).toContain('DORA metrics are a flashlight');
  expect(xml).not.toContain('Hello, world (again)');
  expect(xml).toContain('<content:encoded>');
  expect(xml).toContain('<category>');
});

test('sitemap carries per-post lastmod and robots.txt points at it', async ({ request }) => {
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);

  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('<lastmod>');

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://davidlowelarsson.com/sitemap-index.xml');
});

test('every page declares its canonical URL on the apex domain', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://davidlowelarsson.com/',
  );

  await page.goto('/posts/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://davidlowelarsson.com/posts/',
  );
});
