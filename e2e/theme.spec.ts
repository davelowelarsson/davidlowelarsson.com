import { expect, test } from '@playwright/test';
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from '../src/lib/theme';
import { KITCHEN_SINK_MARKDOWN } from './fixtures';

// Three states: light, dark, and auto — where auto is the ABSENCE of
// `data-theme`, so the OS preference applies with no rule of its own.

const CONTROL = '.theme';
const button = (theme: string) => `[data-theme-set="${theme}"]`;

test('a first-time reader follows the OS, with auto reported as active', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveAttribute(THEME_ATTRIBUTE, /.*/);
  await expect(page.locator(button('system'))).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(button('dark'))).toHaveAttribute('aria-pressed', 'false');
});

test('choosing a theme applies it and reports it', async ({ page }) => {
  await page.goto('/');
  await page.locator(button('dark')).click();

  await expect(page.locator('html')).toHaveAttribute(THEME_ATTRIBUTE, 'dark');
  await expect(page.locator(button('dark'))).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(button('system'))).toHaveAttribute('aria-pressed', 'false');
});

test('the choice survives a reload and a navigation', async ({ page }) => {
  await page.goto('/');
  await page.locator(button('dark')).click();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute(THEME_ATTRIBUTE, 'dark');
  await expect(page.locator(button('dark'))).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/posts/');
  await expect(page.locator('html')).toHaveAttribute(THEME_ATTRIBUTE, 'dark');
  await expect(page.locator(button('dark'))).toHaveAttribute('aria-pressed', 'true');
});

test('auto takes the attribute back off', async ({ page }) => {
  await page.goto('/');
  await page.locator(button('light')).click();
  await expect(page.locator('html')).toHaveAttribute(THEME_ATTRIBUTE, 'light');

  await page.locator(button('system')).click();
  await expect(page.locator('html')).not.toHaveAttribute(THEME_ATTRIBUTE, /.*/);
});

test('a stale or hand-edited stored value degrades to following the OS', async ({ page }) => {
  await page.addInitScript(([key]) => localStorage.setItem(key, 'sepia'), [
    THEME_STORAGE_KEY,
  ] as const);
  await page.goto('/');

  await expect(page.locator('html')).not.toHaveAttribute(THEME_ATTRIBUTE, /.*/);
  await expect(page.locator(button('system'))).toHaveAttribute('aria-pressed', 'true');
});

// ── The no-flash contract, asserted structurally ──
//
// The pre-paint script must be inline, classic and ahead of the stylesheet.
// Bundling it, making it a module, or moving it below the stylesheet all
// reintroduce the flash silently — nothing errors, the white page just comes
// back for one frame on a slow load. Same guard as the byline rotation's.

test('no-flash contract: the theme script is inline, classic, and pre-stylesheet', async ({
  page,
}) => {
  await page.goto('/');

  const shape = await page.evaluate((attribute: string) => {
    const scripts = [...document.head.querySelectorAll('script')];
    const themeScript = scripts.find((script) => script.textContent?.includes(attribute));
    if (!themeScript) return null;

    const stylesheet = document.head.querySelector('link[rel="stylesheet"], style');
    return {
      body: themeScript.textContent ?? '',
      hasSrc: themeScript.hasAttribute('src'),
      type: themeScript.getAttribute('type') ?? '',
      isDeferred: themeScript.hasAttribute('defer') || themeScript.hasAttribute('async'),
      inHead: themeScript.parentElement?.tagName === 'HEAD',
      // Node.DOCUMENT_POSITION_FOLLOWING === 4
      beforeStylesheet: stylesheet
        ? Boolean(themeScript.compareDocumentPosition(stylesheet) & 4)
        : true,
    };
  }, THEME_ATTRIBUTE);

  expect(shape, 'no inline theme script found in <head>').not.toBeNull();
  // Being inline and in <head> is not the same as running before paint: a body
  // wrapped in DOMContentLoaded / setTimeout / requestAnimationFrame satisfies
  // every positional assertion here and still paints the wrong ground first.
  expect(shape?.body, 'the theme is applied after paint, not during parse').not.toMatch(
    /DOMContentLoaded|setTimeout|requestAnimationFrame|addEventListener\s*\(\s*['"]load/,
  );
  expect(shape?.hasSrc, 'became an external/bundled file').toBe(false);
  expect(shape?.type, 'became a module (deferred, so post-paint)').not.toBe('module');
  expect(shape?.isDeferred, 'defer/async makes it post-paint').toBe(false);
  expect(shape?.inHead, 'moved out of <head>').toBe(true);
  expect(shape?.beforeStylesheet, 'moved below the stylesheet').toBe(true);
});

// ── The forced-theme trap ──
//
// `prefers-color-scheme` cannot see a forced theme. A reader on a LIGHT OS who
// picks dark must still get the Excalidraw invert, or they get dark strokes on
// a dark ground. This is the combination nobody tests by hand.

test('forcing dark on a light OS still inverts the Excalidraw sketch', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(KITCHEN_SINK_MARKDOWN);

  const sketch = page.locator("img[src*='excalidraw']").first();
  await expect(sketch).toBeVisible();
  expect(await sketch.evaluate((el) => getComputedStyle(el).filter)).toBe('none');

  await page.locator(button('dark')).click();
  expect(
    await sketch.evaluate((el) => getComputedStyle(el).filter),
    'dark forced on a light OS left the sketch un-inverted',
  ).toContain('invert');
});

test('an OS-dark reader who forces light gets the sketch un-inverted', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(KITCHEN_SINK_MARKDOWN);

  const sketch = page.locator("img[src*='excalidraw']").first();
  expect(await sketch.evaluate((el) => getComputedStyle(el).filter)).toContain('invert');

  await page.locator(button('light')).click();
  expect(await sketch.evaluate((el) => getComputedStyle(el).filter)).toBe('none');
});

// ── The control itself ──

test('the control is a labelled group, keyboard operable, with visible focus', async ({ page }) => {
  await page.goto('/');

  const group = page.locator(CONTROL);
  await expect(group).toHaveAttribute('role', 'group');
  await expect(group).toHaveAttribute('aria-label', /theme/i);

  const dark = page.locator(button('dark'));
  await dark.focus();
  await expect(dark).toBeFocused();
  expect(await dark.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');

  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute(THEME_ATTRIBUTE, 'dark');
});

test('every option clears the 24px WCAG 2.2 target minimum', async ({ page }) => {
  await page.goto('/');

  const buttons = page.locator(`${CONTROL} button`);
  const count = await buttons.count();
  expect(count).toBe(3);

  for (let i = 0; i < count; i++) {
    const box = await buttons.nth(i).boundingBox();
    expect(box?.width, `option ${i} is too narrow to hit`).toBeGreaterThanOrEqual(24);
    expect(box?.height, `option ${i} is too short to hit`).toBeGreaterThanOrEqual(24);
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the page renders and follows the OS preference', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).not.toHaveAttribute(THEME_ATTRIBUTE, /.*/);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('.post-list').first()).toBeVisible();
  });
});
