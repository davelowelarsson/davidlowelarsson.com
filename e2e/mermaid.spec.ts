import { expect, type Locator, type Page, test } from '@playwright/test';
import { LEGIBILITY_FLOOR_PX as FLOOR_PX } from '../src/lib/legibility';
import { KITCHEN_SINK, KITCHEN_SINK_MARKDOWN } from './fixtures';

// Guards issue #6: mermaid code blocks render as diagrams client-side, and
// — the point of doing this client-side instead of via rehype-mermaid SSR —
// pages with no mermaid block never pay for the mermaid chunk at all.
//
// Both fixtures carry a diagram, because `.md` and `.mdx` do not go through the
// same processor and "a fenced mermaid block renders" has to hold in both. The
// fixtures' node labels are stable and asserted on: renaming one means changing
// this spec in the same commit, which is the point — a published Post's labels
// are writing and must never be load-bearing for a test about rendering.

const MERMAID_POST_PATH = KITCHEN_SINK;
const MERMAID_MARKDOWN_PATH = KITCHEN_SINK_MARKDOWN;

function requireBox<T>(box: T | null): T {
  expect(box).toBeTruthy();
  if (!box) throw new Error('expected element bounding box');
  return box;
}

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

test('a diagram renders the labels on both of its branches', async ({ page }) => {
  await page.goto(MERMAID_POST_PATH);

  // `.first()`: the fixture now carries a simple diagram AND a complex one, so
  // the floor has both cases to exercise. This test is about the simple one.
  const diagram = page.locator('.mermaid-diagram svg').first();
  await expect(diagram).toBeVisible();
  await expect(diagram).toContainText('Component tier');
  await expect(diagram).toContainText('Markdown tier');
});

test('a mermaid block renders in a plain .md post too, not only in .mdx', async ({ page }) => {
  // The two formats take different processors. A diagram that renders in one and
  // silently stays a code block in the other is exactly the regression a
  // single-format fixture would miss.
  await page.goto(MERMAID_MARKDOWN_PATH);

  await expect(page.locator('pre > code.language-mermaid')).toHaveCount(0);
  const diagram = page.locator('.mermaid-diagram svg');
  await expect(diagram).toBeVisible();
  await expect(diagram).toContainText('CSS framing, keyed on path');
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

  const diagramBox = requireBox(await diagram.boundingBox());
  const paragraphBox = requireBox(await paragraph.boundingBox());

  // Comfortably wider than the text measure (not merely a rounding difference).
  expect(diagramBox.width).toBeGreaterThan(paragraphBox.width + 40);
});

// ── The legibility floor (#120) ──
//
// The guarantee this replaces was "a diagram never scrolls". That was a PROXY
// for legibility, and it bought the proxy by making complex diagrams into
// thumbnails: at 390px a 12px label lands near 4px. The new guarantee is
// stronger, because it asserts the thing itself — "a diagram never scrolls
// unless the legibility floor would be breached, and the page never scrolls
// either way."
//
// The fixture carries one of each case on purpose. A suite with only simple
// diagrams would leave the floor's entire reason for existing unexercised.

const SIMPLE_LABEL = 'Which processor?';
const COMPLEX_LABEL = 'The legibility floor decides fit or scroll';

/** The smallest rendered label size in a diagram, in CSS pixels. */
async function smallestLabelPx(diagram: Locator): Promise<number> {
  return diagram.evaluate((el) => {
    const svg = el.querySelector('svg');
    if (!svg) return Number.NaN;
    // The viewBox-to-CSS scale: labels are set in user units and painted at
    // this ratio, so the rendered size is the product. Reading the ratio rather
    // than a bounding box keeps this independent of the font stack, which is
    // what made three earlier assertions differ between macOS and CI's Linux.
    const natural = svg.viewBox?.baseVal?.width ?? 0;
    const rendered = svg.getBoundingClientRect().width;
    if (!natural || !rendered) return Number.NaN;
    const scale = rendered / natural;

    const labels = [...svg.querySelectorAll('.nodeLabel, .edgeLabel, text')];
    if (labels.length === 0) return Number.NaN;
    return Math.min(
      ...labels.map((label) => Number.parseFloat(getComputedStyle(label).fontSize) * scale),
    );
  });
}

/** Whether an element's own box scrolls sideways. */
async function scrollsSideways(locator: Locator): Promise<boolean> {
  return locator.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
}

function diagramContaining(page: Page, label: string): Locator {
  return page.locator('.mermaid-diagram').filter({ hasText: label });
}

test('a simple diagram fits without scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(MERMAID_POST_PATH);

  const diagram = diagramContaining(page, SIMPLE_LABEL);
  await expect(diagram.locator('svg')).toBeVisible();
  const scroll = diagram.locator('.mermaid-diagram__scroll');

  expect(await scrollsSideways(scroll), 'the common case was made to scroll').toBe(false);
  // Not scrolling is only the right answer if it is also legible.
  expect(await smallestLabelPx(diagram)).toBeGreaterThanOrEqual(FLOOR_PX - 0.5);

  // A container that does not scroll must not be a tab stop or an announced
  // region — there would be nothing to reach.
  await expect(scroll).not.toHaveAttribute('tabindex', '0');
  await expect(scroll).not.toHaveAttribute('role', 'region');
});

test('a complex diagram stops shrinking at the floor and scrolls inside itself', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(MERMAID_POST_PATH);

  const diagram = diagramContaining(page, COMPLEX_LABEL);
  await expect(diagram.locator('svg')).toBeVisible();
  const scroll = diagram.locator('.mermaid-diagram__scroll');

  expect(await scrollsSideways(scroll), 'a diagram that cannot fit legibly did not scroll').toBe(
    true,
  );
  // The whole point: it scrolls BECAUSE it stayed legible, not despite it.
  expect(
    await smallestLabelPx(diagram),
    'the diagram scrolled and is still below the floor',
  ).toBeGreaterThanOrEqual(FLOOR_PX - 0.5);
});

test('a scrollable diagram is reachable and announced from the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(MERMAID_POST_PATH);

  const scroll = diagramContaining(page, COMPLEX_LABEL).locator('.mermaid-diagram__scroll');
  await expect(scroll).toBeVisible();

  // Landing in a scroll region should say what it is, not drop the reader into
  // an unnamed box.
  await expect(scroll).toHaveAttribute('tabindex', '0');
  await expect(scroll).toHaveAttribute('role', 'region');
  await expect(scroll).toHaveAccessibleName(/diagram/i);

  // Focusable in fact, and operable once focused.
  await scroll.focus();
  await expect(scroll).toBeFocused();
  const before = await scroll.evaluate((el) => el.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() => scroll.evaluate((el) => el.scrollLeft), {
      message: 'the focused scroll region did not respond to the keyboard',
    })
    .toBeGreaterThan(before);
});

for (const width of [320, 390, 1280]) {
  test(`the page never scrolls sideways at ${width}px, whatever a diagram is doing`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(MERMAID_POST_PATH);
    await expect(page.locator('.mermaid-diagram svg').first()).toBeVisible();

    // The exemption WCAG 1.4.10 grants two-dimensional content covers the
    // diagram, not the page around it.
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
      'the page scrolls sideways',
    ).toBeLessThanOrEqual(1);
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
  const inlineBox = requireBox(await inline.boundingBox());

  const dialog = page.locator('#lightbox');
  await expect(dialog).toBeHidden();

  await inline.click();
  await expect(dialog).toBeVisible();

  // `.lightbox-content`, not the dialog: the close button carries an inline
  // <svg> icon, so a bare `svg` selector measures a 16px cross.
  const modalSvg = dialog.locator('.lightbox-content svg').first();
  await expect(modalSvg).toBeVisible();
  const modalBox = requireBox(await modalSvg.boundingBox());
  // At or above, not strictly above — and deliberately, at THIS width.
  //
  // On a phone the inline figure already breaks out to `100vw - 2rem`, and the
  // enlarged plate is the full screen less its padding: the same number. There
  // is no more width to give it, so parity is the geometry, not a regression.
  // What the phone gains is the full height and no surrounding content.
  //
  // The claim that opening a figure makes it BIGGER is a desktop claim and is
  // asserted as one, at 1280px, in e2e/lightbox.spec.ts. Asserting it here
  // would only be satisfiable by making the inline figure worse.
  expect(
    modalBox.width,
    'the enlarged diagram is smaller than the inline one',
  ).toBeGreaterThanOrEqual(inlineBox.width);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // Backdrop click (a viewport corner, away from the centered content) closes too.
  await inline.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
});

// ── Diagram theming from the design tokens (#121) ──
//
// Two problems, one bug and one aesthetic. The bug: the library's theme was
// picked from `matchMedia('(prefers-color-scheme: dark)')`, so a reader on a
// light machine who forced dark got a dark page with a light diagram — the
// same failure the CSS rules guard against, in JavaScript where no CSS guard
// can see it. The aesthetic: the diagram arrived in the library's own palette,
// a visitor on the page rather than part of the writing.

/** The page's own tokens, resolved to the rgb the reader is actually seeing. */
async function tokens(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    document.body.append(probe);
    const read = (name: string) => {
      probe.style.color = `var(${name})`;
      return getComputedStyle(probe).color;
    };
    const values = {
      bg: read('--bg'),
      ink: read('--ink'),
      muted: read('--muted'),
      chip: read('--chip'),
    };
    probe.remove();
    return values;
  });
}

/** What the first diagram is actually drawn in. */
async function diagramColours(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const svg = document.querySelector('.mermaid-diagram svg');
    // Every branch returns the same keys. An early `return {}` widens the type
    // to a union with all-optional members, which `Record<string, string>`
    // rejects — and `astro check` catches it while `playwright test` does not.
    if (!svg) return { label: '', nodeFill: '', nodeStroke: '', edgeStroke: '' };
    const label = svg.querySelector('.nodeLabel');
    const node = svg.querySelector('.node rect, .node polygon, .basic rect');
    const edge = svg.querySelector('.edgePath path, path.flowchart-link');
    return {
      label: label ? getComputedStyle(label).color : '',
      nodeFill: node ? getComputedStyle(node).fill : '',
      nodeStroke: node ? getComputedStyle(node).stroke : '',
      edgeStroke: edge ? getComputedStyle(edge).stroke : '',
    };
  });
}

async function expectDrawnInPageColours(page: Page) {
  const token = await tokens(page);
  const drawn = await diagramColours(page);
  expect(drawn.label, 'diagram text is not the page ink').toBe(token.ink);
  expect(drawn.nodeFill, 'node fill is not the page surface').toBe(token.chip);
  expect(drawn.nodeStroke, 'node border is not the page line colour').toBe(token.muted);
  expect(drawn.edgeStroke, 'edge is not the page line colour').toBe(token.muted);
}

test('a diagram is drawn in the page tokens, on either ground', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(MERMAID_POST_PATH);
  await expect(page.locator('.mermaid-diagram svg').first()).toBeVisible();
  await expectDrawnInPageColours(page);

  await page.emulateMedia({ colorScheme: 'dark' });
  // One variant per ground: the same tokens, resolved against the other one.
  await expect.poll(async () => (await diagramColours(page)).label).toBe((await tokens(page)).ink);
  await expectDrawnInPageColours(page);
});

test('a diagram follows the CHOSEN theme, not the OS preference', async ({ page }) => {
  // The bug, in the direction that used to fail silently: light machine, dark
  // forced. Before #121 the page went dark and the diagram stayed light.
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(MERMAID_POST_PATH);
  await expect(page.locator('.mermaid-diagram svg').first()).toBeVisible();
  const lightInk = (await diagramColours(page)).label;

  await page.locator('[data-theme-set="dark"]').click();
  await expect
    .poll(async () => (await diagramColours(page)).label, {
      message: 'dark forced on a light OS left the diagram in light colours',
    })
    .not.toBe(lightInk);
  await expectDrawnInPageColours(page);
});

test('an OS-dark reader who forces light gets a light diagram', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(MERMAID_POST_PATH);
  await expect(page.locator('.mermaid-diagram svg').first()).toBeVisible();
  const darkInk = (await diagramColours(page)).label;

  await page.locator('[data-theme-set="light"]').click();
  await expect
    .poll(async () => (await diagramColours(page)).label, {
      message: 'light forced on a dark OS left the diagram in dark colours',
    })
    .not.toBe(darkInk);
  await expectDrawnInPageColours(page);
});

test('the theme control re-themes the diagram without a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(MERMAID_POST_PATH);
  await expect(page.locator('.mermaid-diagram svg').first()).toBeVisible();

  // A marker that only survives if the document is never replaced. The control
  // APPEARS to act immediately, so it has to actually do so — re-theming via a
  // navigation would pass a colour assertion and still be the wrong behaviour.
  await page.evaluate(() => {
    (window as unknown as { __sameDocument: boolean }).__sameDocument = true;
  });

  const before = (await diagramColours(page)).label;
  await page.locator('[data-theme-set="dark"]').click();
  await expect.poll(async () => (await diagramColours(page)).label).not.toBe(before);

  expect(
    await page.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument),
    'the page reloaded instead of re-theming in place',
  ).toBe(true);
});

test('the legibility floor still holds after a re-theme', async ({ page }) => {
  // Re-theming re-renders, which throws away the sizing the floor applied. If
  // the floor were not re-applied, a diagram would silently revert to
  // fit-to-container — illegible, and only on the second render.
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(MERMAID_POST_PATH);

  const complex = page.locator('.mermaid-diagram').filter({ hasText: COMPLEX_LABEL });
  await expect(complex.locator('svg')).toBeVisible();
  const scroll = complex.locator('.mermaid-diagram__scroll');
  expect(await scrollsSideways(scroll)).toBe(true);

  await page.locator('[data-theme-set="dark"]').click();
  await expect
    .poll(() => scrollsSideways(scroll), {
      message: 'the diagram lost its floor sizing when the theme changed',
    })
    .toBe(true);
  await expect
    .poll(() => smallestLabelPx(complex), {
      message: 'labels fell below the floor after a re-theme',
    })
    .toBeGreaterThanOrEqual(FLOOR_PX - 0.5);
  await expect(scroll).toHaveAttribute('tabindex', '0');
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
