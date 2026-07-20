import { expect, test } from '@playwright/test';

const POSTS = [
  { format: 'MDX', path: '/posts/essay-ai-code-ownership/', bullets: 4 },
  { format: 'Markdown', path: '/posts/experiment-home-lab-topology/', bullets: 5 },
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
}
