import { expect, test } from '@playwright/test';
import { KITCHEN_SINK, KITCHEN_SINK_MARKDOWN } from './fixtures';

// Widening the measure (42rem → 43rem in #105) is exactly the kind of change
// that pushes a page into horizontal scroll at a narrow width without anyone
// noticing on a desktop. A page that scrolls sideways is broken on a phone, so
// the guarantee is asserted across the range rather than eyeballed at one size.
//
// #112 extends this file with the 320px reflow requirement (WCAG 1.4.10).

const WIDTHS = [320, 390, 768, 1280];

const PAGES = [
  '/',
  '/posts/',
  '/category/essay/',
  // The fixtures carry a diagram, a wide table, a long code line and every kind
  // of figure between them — all the blocks that push a page sideways, on one
  // page each, in both processors.
  KITCHEN_SINK,
  KITCHEN_SINK_MARKDOWN,
  // content-pinned: ProcessStepCard is ruled outside the figure contract and
  // renders this Post's own data, so the wide-card case cannot move to a
  // fixture without copying that data across. See process-step-card.spec.ts.
  '/posts/experiment-spotify-slack-sync/',
];

for (const width of WIDTHS) {
  test(`no page scrolls sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });

    for (const path of PAGES) {
      await page.goto(path);
      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth - root.clientWidth;
      });
      // Sub-pixel rounding is not a horizontal scrollbar.
      expect(overflow, `${path} overflows by ${overflow}px at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
}
