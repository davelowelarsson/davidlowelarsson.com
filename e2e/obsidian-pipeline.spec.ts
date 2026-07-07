import { expect, test } from '@playwright/test';

// Guards issue #7: a post with a colocated Excalidraw-exported SVG actually
// renders that image at the URL the post's markdown points to. The rest of
// the acceptance criteria (JSON-LD, RSS presence, sitemap coverage) is
// already exercised for every post — including this one — by
// e2e/contracts.spec.ts; this test only needs to prove the Excalidraw-
// specific bit that no other post exercises.

const POST_PATH = '/posts/experiment-obsidian-pipeline/';

test('the Obsidian pipeline post renders its colocated Excalidraw SVG', async ({ page }) => {
  await page.goto(POST_PATH);
  const image = page.locator("article img[src*='excalidraw']");
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('src', /excalidraw/);
});
