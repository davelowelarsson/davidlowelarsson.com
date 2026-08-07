import { expect, test } from '@playwright/test';
import { MASTHEAD_NAV } from '../src/lib/nav';
import { KITCHEN_SINK } from './fixtures';

// A Post page is one of the page kinds the masthead has to be identical on. It
// does not matter WHICH Post — so it is the fixture, not whichever published
// Post happened to be first in the folder when this was written.
const CORE_PAGES = ['/', '/posts/', '/category/essay/', '/category/til/', KITCHEN_SINK];

test('every Core Site page carries the same masthead over a hairline', async ({ page }) => {
  for (const path of CORE_PAGES) {
    await page.goto(path);

    const header = page.locator('header.site-header');
    await expect(header, path).toBeVisible();
    await expect(page.locator('.site-name'), path).toHaveText('David Lowe Larsson');

    for (const { label } of MASTHEAD_NAV) {
      await expect(page.locator('.site-nav a', { hasText: label }).first(), path).toBeVisible();
    }
    await expect(page.locator('.theme'), path).toBeVisible();

    const style = await header.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        direction: computed.flexDirection,
        align: computed.alignItems,
        borderBottom: computed.borderBottomWidth,
      };
    });
    expect(style.direction, `${path}: not a stack`).toBe('column');
    expect(style.align, `${path}: not centred`).toBe('center');
    expect(Number.parseFloat(style.borderBottom), `${path}: no hairline`).toBeGreaterThan(0);
  }
});

// One navigation per destination. The masthead answers "where am I and how do
// I get out"; the filter rail on /posts/ answers "narrow this list". An earlier
// masthead carried `essays` and `experiments` as well, which meant a reader on
// /posts/ saw two routes to the same pages under different labels (plural in
// one, singular in the other) and could not tell which was the real one.
test('the masthead does not duplicate the Category filter rail', async ({ page }) => {
  await page.goto('/posts/');

  const railHrefs = await page
    .locator('.filter-rail a')
    .evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
    );
  const mastheadHrefs = await page
    .locator('.site-nav a')
    .evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
    );

  expect(railHrefs.length, 'expected a filter rail to compare against').toBeGreaterThan(0);
  const overlap = mastheadHrefs.filter((href) => railHrefs.includes(href));
  expect(overlap, 'the masthead links somewhere the filter rail already covers').toEqual([]);

  // And specifically: no Category page is reachable from the masthead.
  expect(mastheadHrefs.filter((href) => href.startsWith('/category/'))).toEqual([]);
});

// A preference, not a destination — so it must not read as another row of nav.
test('the theme control sits in the far corner, outside the navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');

  const control = page.locator('.theme');
  const nav = page.locator('.site-nav');

  expect(await control.evaluate((el) => getComputedStyle(el).position)).toBe('absolute');
  expect(
    await control.evaluate((el) => el.closest('nav') !== null),
    'the theme control is inside a nav landmark',
  ).toBe(false);

  const [controlBox, navBox] = await Promise.all([control.boundingBox(), nav.boundingBox()]);
  expect(controlBox?.x, 'the control is not to the right of the navigation').toBeGreaterThan(
    (navBox?.x ?? 0) + (navBox?.width ?? 0),
  );
});

// A SWEEP, not three sampled widths.
//
// The previous version of this test checked 320, 390 and 1280 and passed while
// the control overlapped the site name at 430px — a width none of the three
// sampled, in the gap between the mobile breakpoint and a desktop viewport.
// Overlap is a boundary bug, so walk the boundaries: every 10px from 320 to
// 900, plus the common device widths either side of the 40rem breakpoint.
const SWEEP = [
  ...Array.from({ length: 59 }, (_, i) => 320 + i * 10),
  375,
  390,
  393,
  414,
  430,
  639,
  640,
  641,
  1280,
].sort((a, b) => a - b);

// The sweep below is necessary but not sufficient: it measures RENDERED text,
// so it only fails on the machine whose font happens to be wide enough. Two
// pixel-breakpoint fixes passed on macOS and collided on CI's Linux system-ui
// (at 430px, then at 390-400px).
//
// This asserts the structure instead: the header reserves a column for the
// control, so no font can push flow content under it. Fails on any machine.
test('the header reserves a column for the control, not a guessed breakpoint', async ({ page }) => {
  for (const width of [320, 390, 430, 700, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');

    const room = await page.evaluate(() => {
      const header = document.querySelector('.site-header');
      const control = document.querySelector('.theme')?.getBoundingClientRect();
      if (!header || !control) return null;
      const style = getComputedStyle(header);
      const box = header.getBoundingClientRect();
      // Where flow content is allowed to end, vs where the control begins.
      const contentRight = box.right - Number.parseFloat(style.paddingRight);
      return { contentRight, controlLeft: control.left };
    });

    expect(
      room?.contentRight,
      `no reserved column at ${width}px — content can run under the control`,
    ).toBeLessThanOrEqual(room?.controlLeft ?? 0);
  }
});

test('the corner control never overlaps the masthead at any width', async ({ page }) => {
  await page.goto('/');

  const collisions: string[] = [];
  for (const width of SWEEP) {
    await page.setViewportSize({ width, height: 800 });

    const overlaps = await page.evaluate(() => {
      const control = document.querySelector('.theme')?.getBoundingClientRect();
      const targets = ['.site-name', '.site-nav'];
      if (!control) return ['no control'];
      return targets.filter((selector) => {
        const box = document.querySelector(selector)?.getBoundingClientRect();
        if (!box) return false;
        return !(
          box.right <= control.left ||
          box.left >= control.right ||
          box.bottom <= control.top ||
          box.top >= control.bottom
        );
      });
    });

    for (const target of overlaps) collisions.push(`${target} at ${width}px`);
  }

  expect(collisions, 'the theme control overlaps the masthead').toEqual([]);
});

test('the control is icons at every width, and stays a quiet side thing', async ({ page }) => {
  const light = page.locator('[data-theme-set="light"]');
  // `isVisible()` is the wrong instrument for the label: visually-hidden means
  // clipped to 1px, which still reports visible. Measure the box instead.
  const labelWidth = () =>
    light.locator('.theme-label').evaluate((el) => el.getBoundingClientRect().width);

  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');

    expect(await light.locator('.theme-icon').isVisible(), `no icon at ${width}px`).toBe(true);
    expect(await labelWidth(), `words taking space at ${width}px`).toBeLessThanOrEqual(1);

    // Quiet: the whole control is narrower than the site name it sits beside.
    const control = await page.locator('.theme').boundingBox();
    const name = await page.locator('.site-name').boundingBox();
    expect(
      control?.width ?? 0,
      `the control is wider than the site name at ${width}px`,
    ).toBeLessThan(name?.width ?? 0);
  }

  await page.setViewportSize({ width: 1280, height: 800 });

  // The label is only VISUALLY hidden — it is still the button's accessible
  // name. An icon-only button whose label was display:none would be nameless.
  await expect(light).toHaveAccessibleName(/light/i);
  await expect(page.locator('[data-theme-set="dark"]')).toHaveAccessibleName(/dark/i);
  await expect(page.locator('[data-theme-set="system"]')).toHaveAccessibleName(/auto/i);
});

test('landmarks are correct: one banner, one main', async ({ page }) => {
  await page.goto(KITCHEN_SINK);

  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  // The masthead must not be nested inside the content it sits above.
  expect(await page.locator('main header.site-header').count()).toBe(0);
});

test.describe('the skip link', () => {
  test('is the first focusable element, hidden until focused', async ({ page }) => {
    await page.goto(KITCHEN_SINK);

    const skip = page.locator('.skip-link');
    const offscreen = await skip.boundingBox();
    expect(offscreen?.y, 'skip link is visible before focus').toBeLessThan(0);

    await page.keyboard.press('Tab');
    await expect(skip, 'something else took the first tab stop').toBeFocused();

    const shown = await skip.boundingBox();
    expect(shown?.y, 'skip link stayed hidden while focused').toBeGreaterThanOrEqual(0);
  });

  test('moves focus to the main content when activated', async ({ page }) => {
    await page.goto(KITCHEN_SINK);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page.locator('#main')).toBeFocused();
    expect(page.url()).toContain('#main');
  });
});

test('the current page is marked, and not by colour alone', async ({ page }) => {
  await page.goto('/posts/');

  const current = page.locator('.site-nav a[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText('posts');

  // Accent for state, per ADR 0009 — plus a non-colour cue.
  const decoration = await current.evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(decoration, 'current page is signalled by colour alone').toContain('underline');

  // A post page is INSIDE /posts/ but is not it; nothing should claim the page.
  await page.goto(KITCHEN_SINK);
  await expect(page.locator('.site-nav a[aria-current]')).toHaveCount(0);
});

test('every masthead target clears the 24px WCAG 2.2 minimum', async ({ page }) => {
  await page.goto('/');

  const targets = page.locator('.site-nav a, .theme button, .site-name');
  const count = await targets.count();
  expect(count).toBe(MASTHEAD_NAV.length + 4);

  for (let i = 0; i < count; i++) {
    const box = await targets.nth(i).boundingBox();
    expect(box?.height, `target ${i} is too short`).toBeGreaterThanOrEqual(24);
    expect(box?.width, `target ${i} is too narrow`).toBeGreaterThanOrEqual(24);
  }
});

for (const scheme of ['light', 'dark'] as const) {
  test(`focus is visible on every masthead control in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');

    const controls = page.locator('.skip-link, .site-name, .site-nav a, .theme button');
    const count = await controls.count();

    for (let i = 0; i < count; i++) {
      const control = controls.nth(i);
      await control.focus();
      const outline = await control.evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          style: computed.outlineStyle,
          width: Number.parseFloat(computed.outlineWidth),
          color: computed.outlineColor,
        };
      });
      expect(outline.style, `control ${i} has no focus ring in ${scheme}`).not.toBe('none');
      expect(outline.width, `control ${i} has a zero-width ring in ${scheme}`).toBeGreaterThan(0);
      // A 2px solid TRANSPARENT outline satisfies style and width and is
      // invisible, so the colour has to be checked too.
      expect(outline.color, `control ${i} has an invisible ring in ${scheme}`).not.toMatch(
        /transparent|rgba?\([^)]*,\s*0\s*\)/,
      );
    }
  });
}

test('the masthead is usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');

  await expect(page.locator('.site-header')).toBeVisible();
  await expect(page.locator('.theme')).toBeVisible();

  for (const { label } of MASTHEAD_NAV) {
    await expect(page.locator('.site-nav a', { hasText: label }).first()).toBeVisible();
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'the masthead pushed the page sideways at 320px').toBeLessThanOrEqual(1);
});
