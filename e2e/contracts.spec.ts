import { expect, test } from '@playwright/test';

// These contracts guard the machine-readable surfaces (JSON-LD, RSS, sitemap)
// so content or refactors can't silently break them. They run against the
// production-mode build like every other e2e test.

test('every post page carries complete BlogPosting structured data', async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  const postUrls = [
    ...sitemap.matchAll(/<loc>https:\/\/davidlowelarsson\.com(\/posts\/[^<]+\/)<\/loc>/g),
  ]
    .map((match) => match[1] as string)
    .filter((path) => path !== '/posts/');

  expect(postUrls.length).toBeGreaterThan(0);

  for (const path of postUrls) {
    await page.goto(path);
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const json = JSON.parse(raw ?? '{}');

    expect(json['@type'], path).toBe('BlogPosting');
    expect(json.headline, path).toBeTruthy();
    expect(json.datePublished, path).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(json.dateModified, path).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(json.url, path).toBe(`https://davidlowelarsson.com${path}`);
    expect(json.author?.name, path).toBeTruthy();
    expect(json.publisher?.logo?.url, path).toBeTruthy();
    expect(json.image?.url, path).toMatch(/^https:\/\//);
    expect(json.image?.width, path).toBeGreaterThanOrEqual(696);
    expect(json.image?.height, path).toBeGreaterThanOrEqual(400);
  }
});

test('every rss item is complete', async ({ request }) => {
  const xml = await (await request.get('/rss.xml')).text();

  const items = xml.split('<item>').slice(1);
  expect(items.length).toBeGreaterThan(0);

  for (const item of items) {
    expect(item).toMatch(/<title>[^<]+<\/title>/);
    expect(item).toMatch(/<link>https:\/\/davidlowelarsson\.com\/posts\/[^<]+<\/link>/);
    expect(item).toMatch(/<pubDate>[^<]+<\/pubDate>/);
    expect(item).toMatch(/<content:encoded>/);
    expect(item).toMatch(/<category>[^<]+<\/category>/);
  }

  expect(xml).toContain('<language>en</language>');
  expect(xml).toContain('xmlns:media=');
});

test('sitemap covers every page the build produced', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  for (const required of [
    'https://davidlowelarsson.com/',
    'https://davidlowelarsson.com/posts/',
    'https://davidlowelarsson.com/category/til/',
    'https://davidlowelarsson.com/category/essay/',
    'https://davidlowelarsson.com/category/experiment/',
  ]) {
    expect(urls, `missing ${required}`).toContain(required);
  }

  const postEntries = sitemap.match(/<loc>[^<]*\/posts\/[^<]+\/<\/loc>\s*<lastmod>/g) ?? [];
  expect(postEntries.length, 'post URLs must carry lastmod').toBeGreaterThan(0);
});
