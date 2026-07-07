import { expect, test } from '@playwright/test';
import { BYLINES } from '../src/lib/bylines';

test('landing page presents David and navigates to posts', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('David Lowe Larsson');
  // The tagline rotates on each load; assert it is one of the known bylines
  // rather than a fixed string. Rotation mechanics: e2e/byline-rotation.spec.ts.
  const tagline = (await page.locator('.tagline').textContent())?.trim() ?? '';
  expect(BYLINES).toContain(tagline);

  await page.getByRole('link', { name: 'Posts', exact: true }).click();
  await expect(page).toHaveURL(/\/posts\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Posts');
});

test('inline links keep their surrounding spaces (Astro collapses newlines at tag boundaries)', async ({
  page,
}) => {
  await page.goto('/');
  const intro = (await page.locator('main p').nth(1).textContent()) ?? '';
  expect(intro).toContain('I write essays');
  expect(intro).toContain('quick notes captured');
  expect(intro).toContain('and experiments from');
  const outro = (await page.locator('main > p').last().textContent()) ?? '';
  expect(outro).toContain('lives on LinkedIn');
});

test('landing page surfaces recent writing', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Recent' })).toBeVisible();
  await expect(page.locator('.post-list li')).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'All posts' })).toBeVisible();
});

test('category pages list only their category and explain the term', async ({ page }) => {
  await page.goto('/category/til/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('til');
  await expect(page.getByText('Today I Learned')).toBeVisible();
  await expect(page.getByText('DORA metrics are a flashlight')).toHaveCount(0);

  await page.goto('/category/essay/');
  await expect(page.getByText('DORA metrics are a flashlight')).toBeVisible();
});

test('the posts archive divides entries by year, newest first', async ({ page }) => {
  await page.goto('/posts/');
  const years = page.locator('.year-heading');
  await expect(years.first()).toBeVisible();
  const texts = await years.allTextContents();
  const numbers = texts.map((t) => Number(t.trim()));
  expect(numbers.every((n) => n >= 2009 && n <= 2100)).toBe(true);
  expect([...numbers].sort((a, b) => b - a)).toEqual(numbers);
});

test('categories are reachable from the posts filter rail and from a post page', async ({
  page,
}) => {
  await page.goto('/posts/');
  await page.locator('.filter-rail').getByRole('link', { name: 'essay' }).click();
  await expect(page).toHaveURL(/\/category\/essay\/$/);

  await page.goto('/posts/essay-dora-metrics-flashlight/');
  await page.locator('article').getByRole('link', { name: 'essay' }).click();
  await expect(page).toHaveURL(/\/category\/essay\/$/);
});

test('footer links point at LinkedIn and GitHub', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
    'href',
    /linkedin\.com/,
  );
  await expect(footer.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', /github\.com/);
});

// Draft-exclusion in production builds is covered by
// src/lib/production-build.test.ts — the e2e build runs with drafts visible.

test('rss feed serves rich items', async ({ request }) => {
  const response = await request.get('/rss.xml');
  expect(response.status()).toBe(200);

  const xml = await response.text();
  expect(xml).toContain('DORA metrics are a flashlight');
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

test('pages carry OpenGraph metadata and structured data', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://davidlowelarsson.com/og-default.png',
  );
  const profile = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
  );
  expect(profile['@type']).toBe('ProfilePage');
  expect(profile.mainEntity['@type']).toBe('Person');

  await page.goto('/posts/essay-dora-metrics-flashlight/');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(1);
  const posting = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
  );
  expect(posting['@type']).toBe('BlogPosting');
  expect(posting.url).toBe('https://davidlowelarsson.com/posts/essay-dora-metrics-flashlight/');
  expect(posting.image['@type']).toBe('ImageObject');
  expect(posting.publisher['@type']).toBe('Organization');

  await page.goto('/posts/');
  const collection = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
  );
  expect(collection['@type']).toBe('CollectionPage');
  expect(collection.mainEntity.numberOfItems).toBeGreaterThan(0);
});

test('favicon.ico is the monogram, not the scaffold rocket', async ({ request }) => {
  const response = await request.get('/favicon.ico');
  expect(response.status()).toBe(200);
  const body = await response.body();
  expect(body.length).toBeLessThan(5000);
});

test('llms.txt lists published posts for AI crawlers', async ({ request }) => {
  const response = await request.get('/llms.txt');
  expect(response.status()).toBe(200);

  const text = await response.text();
  expect(text).toContain('# David Lowe Larsson');
  expect(text).toContain('DORA metrics are a flashlight');
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
