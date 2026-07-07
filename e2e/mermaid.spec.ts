import { expect, test } from '@playwright/test';

// Guards issue #6: mermaid code blocks render as diagrams client-side, and
// — the point of doing this client-side instead of via rehype-mermaid SSR —
// pages with no mermaid block never pay for the mermaid chunk at all. The
// proof-post (experiment-home-lab-topology) carries one `mermaid` block
// (a flowchart of the request path) specifically to exercise this; it's
// published (draft: false), so it's built and served the same way in dev,
// preview, and this e2e run against the production build.

const MERMAID_POST_PATH = '/posts/experiment-home-lab-topology/';

test('a mermaid block in a post renders as an inline SVG diagram', async ({ page }) => {
  await page.goto(MERMAID_POST_PATH);

  // The raw code block is replaced once mermaid finishes rendering
  // (async — mermaid.render() resolves after layout), so the source
  // `pre > code.language-mermaid` should be gone and a diagram should
  // stand in its place.
  await expect(page.locator('pre > code.language-mermaid')).toHaveCount(0);

  const diagram = page.locator('.mermaid-diagram svg');
  await expect(diagram).toBeVisible();
  // A real mermaid render, not just an empty wrapper: flowchart nodes are
  // SVG <g class="node"> elements.
  await expect(diagram.locator('g.node').first()).toBeVisible();
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
