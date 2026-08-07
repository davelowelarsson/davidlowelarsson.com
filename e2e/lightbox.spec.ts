import { expect, type Locator, type Page, test } from '@playwright/test';
import { KITCHEN_SINK, KITCHEN_SINK_MARKDOWN } from './fixtures';

// #122 / closes #75. The lightbox was pointer-only: a capability that existed
// for mouse users and not for keyboard users. Its pointer behaviour is
// asserted elsewhere (image-pipeline, media-components, mermaid) and must not
// change; this file is about reaching it, operating it, and getting back.

const dialogOf = (page: Page) => page.locator('#lightbox');

/** The fixture's COMPLEX diagram — the one wide enough to need panning. */
const COMPLEX_LABEL = 'The legibility floor decides fit or scroll';

/** The examine button belonging to the first article image. */
function imageExamine(page: Page): Locator {
  return page.locator('article img[data-examinable] + .examine').first();
}

/** The examine button belonging to the first diagram. */
function diagramExamine(page: Page): Locator {
  return page.locator('article .mermaid-diagram[data-examinable] + .examine').first();
}

/**
 * The examine button for a diagram matching `label`.
 *
 * The panning test needs the COMPLEX diagram specifically: the simple one is
 * 453 units wide and fits the dialog at natural size, so opening it would prove
 * nothing about panning. Picking `.first()` there passed for exactly that
 * reason until the assertion that the dialog actually overflows caught it.
 */
function examineFor(page: Page, label: string): Locator {
  return page
    .locator('.mermaid-diagram')
    .filter({ hasText: label })
    .locator('xpath=following-sibling::button[contains(@class,"examine")][1]');
}

async function box(locator: Locator) {
  const value = await locator.boundingBox();
  expect(value, 'element has no box').not.toBeNull();
  return value as NonNullable<typeof value>;
}

test('an image can be examined from the keyboard', async ({ page }) => {
  await page.goto(KITCHEN_SINK);
  const dialog = dialogOf(page);
  await expect(dialog).toBeHidden();

  const button = imageExamine(page);
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('data-lightbox-kind', 'image');
  await expect(dialog.locator('img')).toBeVisible();
});

test('Space opens it too — it is a real button, not a keydown handler', async ({ page }) => {
  await page.goto(KITCHEN_SINK);
  const button = imageExamine(page);
  await button.focus();
  await page.keyboard.press('Space');
  await expect(dialogOf(page)).toBeVisible();
});

test('a diagram can be examined from the keyboard', async ({ page }) => {
  await page.goto(KITCHEN_SINK);
  // The button has to exist at all: Mermaid swaps diagrams in after the
  // lightbox script runs, so a one-shot pass would never have seen one.
  await expect(diagramExamine(page)).toHaveCount(1);

  await diagramExamine(page).focus();
  await page.keyboard.press('Enter');

  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('data-lightbox-kind', 'diagram');
  await expect(dialog.locator('.lightbox-content svg')).toBeVisible();
});

test('an enlarged diagram can be panned without a pointer', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 700 });
  await page.goto(KITCHEN_SINK);

  const button = examineFor(page, COMPLEX_LABEL);
  await button.focus();
  await page.keyboard.press('Enter');
  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();

  // The clone renders at natural size, so it exceeds the dialog box — that is
  // the case panning exists for.
  const overflows = await dialog.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(overflows, 'the enlarged diagram fits, so panning proves nothing').toBe(true);

  const before = await dialog.evaluate((el) => el.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() => dialog.evaluate((el) => el.scrollLeft), {
      message: 'the enlarged diagram could not be panned from the keyboard',
    })
    .toBeGreaterThan(before);
});

test('Escape closes it and focus returns to where it came from', async ({ page }) => {
  await page.goto(KITCHEN_SINK);
  const button = imageExamine(page);
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(dialogOf(page)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialogOf(page)).toBeHidden();
  // Without this a keyboard reader is dropped at the top of the document and
  // has to find their place in the article again.
  await expect(button, 'focus was not returned to the control that opened it').toBeFocused();
});

test('the affordance is hidden until focused, then a real, sized control', async ({ page }) => {
  await page.goto(KITCHEN_SINK);
  const button = imageExamine(page);

  // Not `display: none` — that cannot take focus, and the control would never
  // exist for the reader it is for. Visually hidden instead.
  const hidden = await box(button);
  expect(hidden.width, 'the control is visible before it is focused').toBeLessThanOrEqual(2);

  await button.focus();
  const shown = await box(button);
  expect(shown.width, 'the control stayed hidden while focused').toBeGreaterThan(40);
  // WCAG 2.2 target size, once it is a control anyone can hit.
  expect(shown.height).toBeGreaterThanOrEqual(24);
});

test('the control says what it does, and which figure it belongs to', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

  // A name like "Examine" alone would be identical on all 41 images. The alt
  // text is what tells a screen-reader user WHICH figure they are opening.
  await expect(imageExamine(page)).toHaveAccessibleName(/examine .+ full screen/i);
  await expect(diagramExamine(page)).toHaveAccessibleName(/examine diagram full screen/i);
});

test('the media keeps its own semantics — no nested interactive content', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

  // The button is a SIBLING, deliberately. Wrapping an <img> in a button stops
  // it being announced as an image; wrapping a diagram would nest the button
  // around the focusable scroll region the legibility floor adds.
  //
  // Scoped to EXAMINABLE media, not to every image: the YouTube facade puts its
  // poster inside its own play button on purpose, and that button owns it —
  // which is exactly why the facade's poster is excluded from this enhancement
  // in the first place.
  await expect(page.locator('article button img[data-examinable]')).toHaveCount(0);
  await expect(page.locator('article img[data-examinable][role]')).toHaveCount(0);
  await expect(page.locator('article .examine img, article .examine svg')).toHaveCount(0);
  await expect(page.locator('article .examine .mermaid-diagram__scroll')).toHaveCount(0);
});

test('a pointer user sees no new chrome and still clicks the figure itself', async ({ page }) => {
  await page.goto(KITCHEN_SINK);
  const image = page.locator('article img[data-examinable]').first();
  await image.click();
  await expect(dialogOf(page)).toBeVisible();
  await expect(dialogOf(page)).toHaveAttribute('data-lightbox-kind', 'image');
});

// ── The enlarged view has to be MORE legible than the inline one ──
//
// It was not. `#lightbox` was `background: transparent` over a 75%-black
// scrim, and an SVG carries no background of its own — so a diagram or a
// sketch opened straight onto the scrim. In light mode that is near-black ink
// on near-black. A raster hid the problem, because a photograph brings its own
// opacity; the two kinds of media that are just strokes did not.
//
// Reported from the preview, which is exactly what a Preview Deployment is for.

/** `rgb(r, g, b)` / `rgba(...)` -> channels, or null if not fully opaque. */
function opaqueChannels(colour: string): [number, number, number] | null {
  const match = colour.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = (match[1] as string).split(',').map((value) => Number.parseFloat(value.trim()));
  const [r, g, b, a = 1] = parts as [number, number, number, number?];
  if (a !== 1) return null;
  return [r, g, b];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light as number) + 0.05) / ((dark as number) + 0.05);
}

for (const scheme of ['light', 'dark'] as const) {
  test(`an enlarged diagram sits on an opaque ground in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(KITCHEN_SINK);
    await expect(page.locator('.mermaid-diagram svg').first()).toBeVisible();
    await page.locator('.mermaid-diagram').first().click();

    const dialog = dialogOf(page);
    await expect(dialog).toBeVisible();

    const reading = await page.evaluate(() => {
      const box = document.querySelector('#lightbox') as HTMLElement;
      const label = box.querySelector('.nodeLabel, text');
      const probe = document.createElement('span');
      probe.style.color = 'var(--bg)';
      document.body.append(probe);
      const bg = getComputedStyle(probe).color;
      probe.remove();
      return {
        plate: getComputedStyle(box).backgroundColor,
        pageGround: bg,
        ink: label ? getComputedStyle(label).color : '',
      };
    });

    const plate = opaqueChannels(reading.plate);
    expect(plate, `the enlarged view is see-through (${reading.plate})`).not.toBeNull();
    // The page's own ground, not an invented one: it is the ground the diagram's
    // colours were resolved against in the first place (#121).
    expect(reading.plate).toBe(reading.pageGround);

    const ink = opaqueChannels(reading.ink);
    expect(ink, `no diagram label to measure (${reading.ink})`).not.toBeNull();
    expect(
      contrast(plate as [number, number, number], ink as [number, number, number]),
      'the enlarged diagram does not clear the WCAG AA text floor against its own ground',
    ).toBeGreaterThanOrEqual(4.5);
  });
}

test('an enlarged sketch answers the theme the same way the inline one does', async ({ page }) => {
  // The clone lives outside the Prose component, so it does not inherit the
  // inversion that makes a sketch legible on a dark ground. Without the rule in
  // the lightbox's own styles it opens as dark strokes on the dark plate.
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(KITCHEN_SINK_MARKDOWN);

  const sketch = page.locator("article img[src*='excalidraw']").first();
  await expect(sketch).toBeVisible();
  expect(await sketch.evaluate((el) => getComputedStyle(el).filter)).toContain('invert');

  await sketch.click();
  await expect(dialogOf(page)).toBeVisible();
  const clone = page.locator('.lightbox-content img');
  expect(
    await clone.evaluate((el) => getComputedStyle(el).filter),
    'the enlarged sketch is dark strokes on a dark ground',
  ).toContain('invert');
});

test('a forced theme reaches the enlarged sketch too', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(KITCHEN_SINK_MARKDOWN);
  await page.locator('[data-theme-set="dark"]').click();

  const sketch = page.locator("article img[src*='excalidraw']").first();
  await sketch.click();
  await expect(dialogOf(page)).toBeVisible();
  expect(
    await page.locator('.lightbox-content img').evaluate((el) => getComputedStyle(el).filter),
    'dark forced on a light OS left the enlarged sketch un-inverted',
  ).toContain('invert');
});

test('an enlarged raster still fits inside the plate rather than overflowing it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto(KITCHEN_SINK_MARKDOWN);
  const image = page.locator("article img[src*='test-card-wide']").first();
  await image.click();

  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();

  // Measured against the plate's CONTENT box, not its border box. Comparing to
  // the outer width includes the padding the image is supposed to sit inside,
  // which makes the assertion true however far the image overflows — it passed
  // with the padding-blind cap still in place until this was tightened.
  const fit = await dialog.evaluate((el) => {
    const style = getComputedStyle(el);
    const inner =
      el.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
    const image = el.querySelector('img');
    return { inner, image: image ? image.getBoundingClientRect().width : Number.NaN };
  });
  expect(fit.image).not.toBeNaN();
  expect(fit.image, 'the picture sits proud of the plate meant to contain it').toBeLessThanOrEqual(
    fit.inner + 1,
  );
});

// ── "Enlarged" has to mean enlarged, whatever the media is (reported) ──
//
// Images appeared to grow and diagrams did not. Images only ever "grew"
// because they are DOWNSCALED inline — a 1600px card shown at 544px looks
// bigger at its natural size. Diagrams were pinned to their viewBox, and the
// simple fixture diagram is 453 units wide against a breakout column wider
// than that: the enlarged view was genuinely smaller than the figure clicked.
//
// The distinction that matters is raster versus vector, not image versus
// diagram: a photograph cannot be scaled past natural without going soft, a
// vector can be scaled forever.

/** The rendered width of a piece of media inline, and again in the lightbox. */
async function inlineThenEnlarged(page: Page, inline: Locator): Promise<[number, number]> {
  const before = await inline.boundingBox();
  await inline.click();
  await expect(dialogOf(page)).toBeVisible();
  const after = await page.locator('#lightbox .lightbox-content :is(img, svg)').boundingBox();
  expect(before, 'no inline box').not.toBeNull();
  expect(after, 'no enlarged box').not.toBeNull();
  return [(before as NonNullable<typeof before>).width, (after as NonNullable<typeof after>).width];
}

test('a diagram is actually bigger in the lightbox than it was inline', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(KITCHEN_SINK);
  const diagram = page.locator('.mermaid-diagram').first();
  await expect(diagram.locator('svg')).toBeVisible();

  const [inline, enlarged] = await inlineThenEnlarged(page, diagram.locator('svg').first());
  expect(enlarged, 'the enlarged diagram is no bigger than the inline one').toBeGreaterThan(
    inline * 1.2,
  );
});

test('a sketch is actually bigger in the lightbox than it was inline', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(KITCHEN_SINK_MARKDOWN);
  const sketch = page.locator("article img[src*='excalidraw']").first();
  await expect(sketch).toBeVisible();

  const [inline, enlarged] = await inlineThenEnlarged(page, sketch);
  expect(enlarged, 'the enlarged sketch is no bigger than the inline one').toBeGreaterThan(inline);
});

test('an enlarged diagram fills the plate rather than floating in it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(KITCHEN_SINK);
  await expect(page.locator('.mermaid-diagram svg').first()).toBeVisible();
  await page.locator('.mermaid-diagram').first().click();

  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  // Measured against the AVAILABLE space, not against the dialog's own width.
  // A <dialog> sizes to its content, so "is the figure as wide as the box it is
  // in" is circular — it is true however small the figure is. The question is
  // whether the figure used the room the viewport actually offered.
  const fit = await dialog.evaluate((el) => {
    const style = getComputedStyle(el);
    const padding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
    const availableWidth = window.innerWidth * 0.92 - padding;
    const availableHeight = window.innerHeight * 0.92 - padding;
    // `.lightbox-content`, not the dialog: the close button carries an inline
    // <svg> icon, so a bare `svg` selector measures a 16px cross — which is
    // exactly what made this report "the plate is 2% full".
    const svg = el.querySelector('.lightbox-content svg');
    const box = svg?.getBoundingClientRect();
    return {
      availableWidth,
      availableHeight,
      width: box ? box.width : Number.NaN,
      height: box ? box.height : Number.NaN,
    };
  });

  // A vector scales losslessly, so there is no reason to leave the plate half
  // empty. Either the width ran out or the height did — both are "as big as it
  // can be" — but one of them has to have.
  const usedWidth = fit.width / fit.availableWidth;
  const usedHeight = fit.height / fit.availableHeight;
  expect(
    Math.max(usedWidth, usedHeight),
    'the enlarged diagram left the plate half empty',
  ).toBeGreaterThan(0.9);
  expect(fit.width, 'the enlarged diagram overflows the plate').toBeLessThanOrEqual(
    fit.availableWidth + 1,
  );
});

test('a phone still gets a legible, pannable diagram rather than a shrunken one', async ({
  page,
}) => {
  // Filling must not override the floor. On a narrow screen the enlarged view
  // is still bigger than the plate and pans, because shrinking it to fit would
  // be the illegibility the floor exists to prevent.
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(KITCHEN_SINK);
  const complex = page.locator('.mermaid-diagram').filter({ hasText: COMPLEX_LABEL });
  await expect(complex.locator('svg')).toBeVisible();
  await complex.click();

  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate((el) => el.scrollWidth > el.clientWidth + 1),
    'the enlarged diagram was shrunk to fit a phone instead of panning',
  ).toBe(true);
});

// ── One affordance, keyed on the capability (reported) ──
//
// `cursor: zoom-in` was set per component: Prose on plain Markdown images,
// Mermaid on diagrams, MediaAside on its figure — and ArticleImage and
// ImagePair not at all. So the same picture offered a zoom cursor in a `.md`
// post and none in an `.mdx` one, purely by which component had remembered.

for (const [label, path] of [
  ['component tier (.mdx)', KITCHEN_SINK],
  ['Markdown tier (.md)', KITCHEN_SINK_MARKDOWN],
] as const) {
  test(`every examinable figure offers the same cursor — ${label}`, async ({ page }) => {
    await page.goto(path);
    const examinable = page.locator('article [data-examinable]');
    const count = await examinable.count();
    expect(count, 'nothing examinable to check').toBeGreaterThan(0);

    const cursors = await examinable.evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).cursor),
    );
    expect(
      cursors.filter((cursor) => cursor !== 'zoom-in'),
      'an examinable figure does not advertise that it can be examined',
    ).toEqual([]);
  });
}

test('nothing that is NOT examinable pretends to be', async ({ page }) => {
  await page.goto(KITCHEN_SINK);
  // The YouTube facade's poster is inside its own play button — clicking it
  // plays the video, so a zoom cursor would be a lie.
  const poster = page.locator('.youtube-embed__poster').first();
  await expect(poster).toBeVisible();
  expect(await poster.evaluate((el) => getComputedStyle(el).cursor)).not.toBe('zoom-in');
});

// ── The lightbox is an OVERLAY, on every screen (reported from a phone) ──
//
// A full-screen plate was tried and reverted. Sizing the dialog to
// `100vw/100vh` made it stop centring — a <dialog> is centred by the UA's
// `margin: auto`, which does nothing once the box fills the viewport, so the
// figure sat at the top-left — and the opaque plate then covered the scrim
// entirely, so nothing said the page was still behind it. It read as a
// navigation rather than an overlay.

const PHONE = { width: 390, height: 844 };

test('on a phone the figure is centred, not pinned to the corner', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto(KITCHEN_SINK_MARKDOWN);
  const image = page.locator("article img[src*='test-card-wide']").first();
  await image.click();

  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  // The FIGURE, not the dialog. A dialog sized to the viewport is trivially
  // centred in it, so measuring the dialog reports success on exactly the
  // layout that was reported broken — the figure pinned to the top-left of a
  // full-screen box.
  const box = await dialog.locator('.lightbox-content img').boundingBox();
  expect(box, 'no figure to measure').not.toBeNull();
  const { x, y, width, height } = box as NonNullable<typeof box>;

  // Centred on both axes, within a pixel of rounding.
  expect(Math.abs(x + width / 2 - PHONE.width / 2), 'not horizontally centred').toBeLessThanOrEqual(
    2,
  );
  expect(Math.abs(y + height / 2 - PHONE.height / 2), 'not vertically centred').toBeLessThanOrEqual(
    2,
  );
});

test('on a phone the page is still visibly behind it', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto(KITCHEN_SINK_MARKDOWN);
  await page.locator("article img[src*='test-card-wide']").first().click();

  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  const { width, height } = box as NonNullable<typeof box>;

  // The scrim has to be visible SOMEWHERE, or the reader cannot tell they are
  // on top of the post rather than navigated away from it.
  const coversEverything = width >= PHONE.width - 1 && height >= PHONE.height - 1;
  expect(coversEverything, 'the enlarged view covers the whole screen').toBe(false);
});

test('there is a way out that does not need a keyboard', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto(KITCHEN_SINK_MARKDOWN);
  await page.locator("article img[src*='test-card-wide']").first().click();

  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();

  // Escape does not exist on a phone, and the backdrop is a thin ring around a
  // figure that nearly fills the screen. A real control is the only honest way
  // out — and it has to be a comfortable target.
  const close = dialog.locator('.lightbox-close');
  await expect(close).toBeVisible();
  await expect(close).toHaveAccessibleName(/close/i);
  const target = await close.boundingBox();
  expect(target).not.toBeNull();
  expect((target as NonNullable<typeof target>).width).toBeGreaterThanOrEqual(24);
  expect((target as NonNullable<typeof target>).height).toBeGreaterThanOrEqual(24);

  await close.click();
  await expect(dialog).toBeHidden();
});

test('the close control does not steal the arrow keys from panning', async ({ page }) => {
  // Adding a focusable button means `showModal` would focus IT, and the arrow
  // keys would move focus instead of panning the figure. The dialog takes focus
  // explicitly so both work: pan with the arrows, Tab to reach the button.
  await page.setViewportSize({ width: 700, height: 700 });
  await page.goto(KITCHEN_SINK);
  await examineFor(page, COMPLEX_LABEL).focus();
  await page.keyboard.press('Enter');

  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  const before = await dialog.evaluate((el) => el.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() => dialog.evaluate((el) => el.scrollLeft), {
      message: 'the close button took the arrow keys',
    })
    .toBeGreaterThan(before);
});

test('on a phone a diagram is never handed back smaller than it already was', async ({ page }) => {
  // The plate is narrower than the inline breakout column (`100vw - 2rem`), so
  // fitting to it would return something smaller than the reader already had.
  // Bigger than the plate simply means it pans — which for a diagram at this
  // width is the only way to stay legible anyway.
  await page.setViewportSize(PHONE);
  await page.goto(KITCHEN_SINK);
  const diagram = page.locator('.mermaid-diagram').first();
  await expect(diagram.locator('svg')).toBeVisible();

  const inline = await diagram.locator('svg').first().boundingBox();
  await diagram.click();
  await expect(dialogOf(page)).toBeVisible();
  const enlarged = await page.locator('#lightbox .lightbox-content svg').boundingBox();

  expect(inline).not.toBeNull();
  expect(enlarged).not.toBeNull();
  expect(
    (enlarged as NonNullable<typeof enlarged>).width,
    'the enlarged diagram is smaller than the inline one',
  ).toBeGreaterThanOrEqual((inline as NonNullable<typeof inline>).width);
});

test('a diagram too wide for the phone pans inside the overlay', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto(KITCHEN_SINK);
  const complex = page.locator('.mermaid-diagram').filter({ hasText: COMPLEX_LABEL });
  await expect(complex.locator('svg')).toBeVisible();
  await complex.click();

  const dialog = dialogOf(page);
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate((el) => el.scrollWidth > el.clientWidth + 1),
    'a diagram that cannot fit the phone was shrunk instead of made pannable',
  ).toBe(true);
});
