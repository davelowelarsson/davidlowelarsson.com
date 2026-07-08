import { expect, test } from '@playwright/test';

const POST_PATH = '/posts/experiment-spotify-slack-sync/';
const REPO_URL = 'https://github.com/davelowelarsson/spotify-slack-sync-fredagslistan';

function requireBox<T>(box: T | null): T {
  expect(box).toBeTruthy();
  if (!box) throw new Error('expected element bounding box');
  return box;
}

test('process visuals sit inline with the article instead of floating beside it', async ({
  page,
}) => {
  await page.goto(POST_PATH);

  const cards = page.locator('[data-process-step-card-id]');
  await expect(cards).toHaveCount(3);
  await expect(page.locator('[data-process-floating]')).toHaveCount(0);
  await expect(page.locator('[data-process-active-step]')).toHaveCount(0);

  const articleBox = requireBox(await page.locator('article').boundingBox());
  const diffCardBox = requireBox(await cards.nth(1).boundingBox());

  expect(diffCardBox.x).toBeGreaterThanOrEqual(articleBox.x - 1);
  expect(diffCardBox.x + diffCardBox.width).toBeLessThanOrEqual(
    articleBox.x + articleBox.width + 1,
  );
});

test('process visuals remain readable in the mobile article flow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(POST_PATH);

  const cards = page.locator('[data-process-step-card-id]');
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toBeVisible();

  const firstCardBox = requireBox(await cards.first().boundingBox());
  expect(firstCardBox.width).toBeGreaterThan(300);
  expect(firstCardBox.width).toBeLessThanOrEqual(390);
});

test('wrapped snapshot renders aggregate stats with the skew caveat', async ({ page }) => {
  await page.goto(POST_PATH);

  const wrapped = page.locator('.wrapped-snapshot');
  await expect(wrapped).toBeVisible();
  await expect(wrapped).toContainText('Fredagslistan wrapped, carefully');
  await expect(wrapped).toContainText('1,974');
  await expect(wrapped).toContainText('not a perfect interest graph');
  await expect(wrapped).toContainText('initial archive scan');
  await expect(wrapped).toContainText('playlist spans more than one calendar year');
  await expect(wrapped).toContainText('swedish pop');
});

test('post credits Agnes and the first theme without exposing raw Slack details', async ({
  page,
}) => {
  await page.goto(POST_PATH);

  await expect(page.locator('article')).toContainText('Agnes made a playlist');
  await expect(page.locator('article')).toContainText(/Today.s theme is sun/);
  await expect(page.locator('article')).not.toContainText('agnesforsell');
  await expect(page.locator('article')).not.toContainText('U06LM2VJ8');
});

test('post exposes its source repository as a main link', async ({ page }) => {
  await page.goto(POST_PATH);

  const sourceLink = page.getByRole('link', { name: /source repository/i });
  await expect(sourceLink).toBeVisible();
  await expect(sourceLink).toHaveAttribute('href', REPO_URL);
});
