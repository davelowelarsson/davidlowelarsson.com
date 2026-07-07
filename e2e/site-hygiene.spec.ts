import { expect, test } from '@playwright/test';

// Issue #12: custom 404, and an analytics beacon that only renders once a
// token is configured. Both assert against the production-mode preview
// build, same as the rest of the e2e suite.

test('unknown routes serve the styled 404 page with a link home and to posts', async ({ page }) => {
  const response = await page.goto('/nonexistent');
  expect(response?.status()).toBe(404);

  await expect(page.getByRole('heading', { level: 1 })).toContainText('404');
  await expect(page.getByRole('main').getByRole('link', { name: /home/i })).toHaveAttribute(
    'href',
    '/',
  );
  await expect(page.getByRole('main').getByRole('link', { name: /posts/i })).toHaveAttribute(
    'href',
    '/posts/',
  );
});

test('analytics beacon is absent when CLOUDFLARE_ANALYTICS_TOKEN is unset', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('script[src*="static.cloudflareinsights.com"]')).toHaveCount(0);
});

test('a 500 page is built and styled for future use', async ({ page }) => {
  await page.goto('/500');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('500');
  await expect(page.getByRole('main').getByRole('link', { name: /home/i })).toHaveAttribute(
    'href',
    '/',
  );
});
