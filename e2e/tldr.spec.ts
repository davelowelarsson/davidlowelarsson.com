import { expect, test } from '@playwright/test';
import { KITCHEN_SINK, KITCHEN_SINK_MARKDOWN } from './fixtures';

// One entry per processor, because that is the only reason this runs twice.
const POSTS = [
  { format: 'MDX', path: KITCHEN_SINK, bullets: 5 },
  { format: 'Markdown', path: KITCHEN_SINK_MARKDOWN, bullets: 4 },
] as const;

for (const post of POSTS) {
  test(`${post.format} TL;DR renders as one reusable summary band`, async ({ page }) => {
    await page.goto(post.path);

    const heading = page.locator('article h2#tldr');
    const list = page.locator('article h2#tldr + ul');
    await expect(heading).toHaveText('TL;DR');
    await expect(list.locator('li')).toHaveCount(post.bullets);
    await expect(page.locator('article h2#tldr + blockquote')).toHaveCount(0);

    const headingStyle = await heading.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        borderLeftWidth: style.borderLeftWidth,
        marginBottom: style.marginBottom,
      };
    });
    const listStyle = await list.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        borderLeftWidth: style.borderLeftWidth,
        marginTop: style.marginTop,
      };
    });

    expect(headingStyle.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(listStyle.background).toBe(headingStyle.background);
    expect(headingStyle.borderLeftWidth).toBe('3px');
    expect(listStyle.borderLeftWidth).toBe('3px');
    expect(headingStyle.marginBottom).toBe('0px');
    expect(listStyle.marginTop).toBe('0px');

    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      391,
    );

    await page.emulateMedia({ colorScheme: 'dark' });
    const darkBackground = await heading.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(darkBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(await list.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
      darkBackground,
    );
  });

  test(`${post.format} prose TL;DR joins its heading in the same summary band`, async ({
    page,
  }) => {
    await page.goto(post.path);
    await page.locator('article h2#tldr + ul').evaluate((list) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = 'A short prose summary instead of a checklist.';
      list.replaceWith(paragraph);
    });

    const heading = page.locator('article h2#tldr');
    const summary = page.locator('article h2#tldr + p');
    await expect(summary).toHaveCSS('border-left-width', '3px');
    await expect(summary).toHaveCSS('margin-top', '0px');
    await expect(summary).toHaveCSS(
      'padding-left',
      await heading.evaluate((element) => getComputedStyle(element).paddingLeft),
    );

    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      391,
    );
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      await expect(summary).toHaveCSS(
        'background-color',
        await heading.evaluate((element) => getComputedStyle(element).backgroundColor),
      );
    }
  });
}
