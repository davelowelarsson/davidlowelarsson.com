import { expect, test } from '@playwright/test';

// Guards issue #6: mermaid code blocks render as diagrams client-side, and
// — the point of doing this client-side instead of via rehype-mermaid SSR —
// pages with no mermaid block never pay for the mermaid chunk at all. The
// proof-post (experiment-home-lab-topology) carries one or more `mermaid`
// blocks specifically to exercise this; it's published (draft: false), so it's
// built and served the same way in dev, preview, and this e2e run against the
// production build. The test is count-agnostic — a post may grow more diagrams.

const MERMAID_POST_PATH = '/posts/experiment-home-lab-topology/';

test('a mermaid block in a post renders as an inline SVG diagram', async ({ page }) => {
  await page.goto(MERMAID_POST_PATH);

  // The raw code block is replaced once mermaid finishes rendering
  // (async — mermaid.render() resolves after layout), so the source
  // `pre > code.language-mermaid` should be gone and a diagram should
  // stand in its place.
  await expect(page.locator('pre > code.language-mermaid')).toHaveCount(0);

  // At least one diagram rendered (the post may carry several — assert on the
  // first rather than the set, so adding diagrams never trips strict mode).
  const diagrams = page.locator('.mermaid-diagram svg');
  await expect(diagrams.first()).toBeVisible();
  // A real mermaid render, not just an empty wrapper: flowchart nodes are
  // SVG <g class="node"> elements.
  await expect(diagrams.first().locator('g.node').first()).toBeVisible();
});

test('a diagram breaks out wider than the prose column on desktop', async ({ page }) => {
  // The prose column is capped at the 42rem reading measure, but a diagram is a
  // figure, not text — it's allowed to break out wider so it stays legible
  // without shrinking to fit the paragraph width (issue: diagrams render tiny).
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(MERMAID_POST_PATH);

  const diagram = page.locator('.mermaid-diagram').first();
  await expect(diagram).toBeVisible();
  const paragraph = page.locator('article p').first();

  const diagramBox = await diagram.boundingBox();
  const paragraphBox = await paragraph.boundingBox();
  expect(diagramBox, 'diagram should have a box').not.toBeNull();
  expect(paragraphBox, 'paragraph should have a box').not.toBeNull();

  // Comfortably wider than the text measure (not merely a rounding difference).
  expect(diagramBox!.width).toBeGreaterThan(paragraphBox!.width + 40);
});

for (const width of [390, 1280]) {
  test(`a diagram never overflows horizontally at ${width}px`, async ({ page }) => {
    // The inline middle path must always fit its container — no horizontal
    // scroll, on phone or desktop — and breaking out wider must not push the
    // page itself into horizontal scroll.
    await page.setViewportSize({ width, height: 900 });
    await page.goto(MERMAID_POST_PATH);

    const diagrams = page.locator('.mermaid-diagram');
    // Wait for the async mermaid render to swap in the diagrams before measuring.
    await expect(diagrams.first()).toBeVisible();
    const count = await diagrams.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const overflow = await diagrams.nth(i).evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(overflow.scrollWidth, `diagram ${i} must not scroll sideways`).toBeLessThanOrEqual(
        overflow.clientWidth + 1,
      );
    }

    const pageOverflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(pageOverflows, 'the page must not scroll sideways').toBe(false);
  });
}

test('clicking a diagram opens it larger in the lightbox; Escape and backdrop close it', async ({
  page,
}) => {
  // The escape hatch: on a phone the inline diagram is fit-to-column (small);
  // tapping it opens a natural-size clone in the shared dialog so it can be
  // examined and panned — without pinch-zooming the whole page.
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(MERMAID_POST_PATH);

  const inline = page.locator('.mermaid-diagram svg').first();
  await expect(inline).toBeVisible();
  const inlineBox = await inline.boundingBox();

  const dialog = page.locator('#lightbox');
  await expect(dialog).toBeHidden();

  await inline.click();
  await expect(dialog).toBeVisible();

  const modalSvg = dialog.locator('svg').first();
  await expect(modalSvg).toBeVisible();
  const modalBox = await modalSvg.boundingBox();
  expect(modalBox!.width, 'diagram in the modal is larger than inline').toBeGreaterThan(
    inlineBox!.width,
  );

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // Backdrop click (a viewport corner, away from the centered content) closes too.
  await inline.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
});

test('a page without a mermaid block never fetches the mermaid chunk', async ({ page }) => {
  // The Mermaid.astro wrapper script itself ships on every page (same as
  // Lightbox) — it's the tiny, dependency-free querySelector check. What
  // must NOT happen off a mermaid page is the dynamic `import('mermaid')`
  // resolving to the actual npm package chunk, which Vite names
  // `mermaid*.core.<hash>.js` (distinct from our own component's
  // `Mermaid.astro_astro_type_script...` chunk).
  const mermaidPackageRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/mermaid[^/]*\.core[.-]/i.test(request.url())) mermaidPackageRequests.push(request.url());
  });

  await page.goto('/posts/');
  // Give any stray dynamic import a moment to fire before asserting absence.
  await page.waitForLoadState('networkidle');

  expect(mermaidPackageRequests).toEqual([]);
});
