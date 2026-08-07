import { expect, test } from '@playwright/test';
import { THEME_ATTRIBUTE } from '../src/lib/theme';

// What a reader has already told their operating system, honoured here without
// asking them to configure anything.

/** Resolve a token the way the page does, under whatever media is emulated. */
async function token(page: import('@playwright/test').Page, name: string) {
  return page.evaluate((property: string) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${property})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);
}

for (const scheme of ['light', 'dark'] as const) {
  test(`prefers-contrast: more strengthens secondary text in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    const base = await token(page, '--muted');

    await page.emulateMedia({ colorScheme: scheme, contrast: 'more' });
    const strengthened = await token(page, '--muted');

    expect(strengthened, `--muted did not change in ${scheme}`).not.toBe(base);
  });
}

// The trap the theme-control ticket closed, checked again from the other side:
// a reader who FORCED a theme must still get their contrast preference. These
// overrides are `light-dark()` pairs resolved by `color-scheme`, so they should
// follow the forced theme — this asserts that rather than assuming it.
test('the high-contrast override works under a forced theme, not just an OS one', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light', contrast: 'more' });
  await page.goto('/');

  await page.locator('[data-theme-set="dark"]').click();
  await expect(page.locator('html')).toHaveAttribute(THEME_ATTRIBUTE, 'dark');
  const forcedDark = await token(page, '--muted');

  // Same page, OS-dark instead of forced — the value must match.
  await page.emulateMedia({ colorScheme: 'dark', contrast: 'more' });
  await page.evaluate((attribute: string) => {
    document.documentElement.removeAttribute(attribute);
  }, THEME_ATTRIBUTE);
  const osDark = await token(page, '--muted');

  expect(forcedDark, 'forcing dark lost the high-contrast override').toBe(osDark);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`focus stays visible against the strengthened palette in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, contrast: 'more' });
    await page.goto('/');

    const controls = page.locator('.skip-link, .site-name, .site-nav a, .theme button');
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const control = controls.nth(i);
      await control.focus();
      const ring = await control.evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          style: computed.outlineStyle,
          width: Number.parseFloat(computed.outlineWidth),
          color: computed.outlineColor,
        };
      });
      expect(ring.style, `control ${i} lost its ring in ${scheme}`).not.toBe('none');
      expect(ring.width, `control ${i} has a zero-width ring in ${scheme}`).toBeGreaterThan(0);
      expect(ring.color, `control ${i} has an invisible ring in ${scheme}`).not.toMatch(
        /transparent|rgba?\([^)]*,\s*0\s*\)/,
      );
    }
  });
}

test('prefers-reduced-motion removes the transitions that exist', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/posts/');
  const withMotion = await page
    .locator('.post-link')
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(withMotion, 'the transition under test is not there to remove').not.toBe('0s');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await page
    .locator('.post-link')
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(reduced, 'motion survived prefers-reduced-motion').toBe('0s');
});

// WCAG 1.4.10: 320px is the reflow target, and it is what 400% zoom on a
// 1280px viewport reduces to. e2e/no-horizontal-scroll.spec.ts sweeps the
// wider range; this pins the four page kinds the ticket names, under the
// preferences that change layout metrics.
const PAGE_KINDS = ['/', '/posts/', '/category/essay/', '/posts/essay-ai-code-ownership/'];

test('no horizontal scroll at 320px, including under more-contrast', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  for (const contrast of ['no-preference', 'more'] as const) {
    await page.emulateMedia({ contrast });
    for (const path of PAGE_KINDS) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(
        overflow,
        `${path} scrolls sideways at 320px (contrast: ${contrast})`,
      ).toBeLessThanOrEqual(1);
    }
  }
});
