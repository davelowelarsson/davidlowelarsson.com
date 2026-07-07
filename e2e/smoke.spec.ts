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
