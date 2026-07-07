import { describe, expect, it } from 'vitest';
import { buildImageManifest, resolveImageSrc, toFeedItems } from './feed';

const SITE = 'https://davidlowelarsson.com';

const post = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  body: `Some **bold** thoughts about ${id}.`,
  data: {
    title: `Title of ${id}`,
    description: `About ${id}`,
    pubDate: new Date('2026-06-01'),
    category: 'til' as const,
    draft: false,
    tags: ['astro'],
    ...overrides,
  },
});

describe('toFeedItems', () => {
  it('maps posts to feed items linking to their post page', () => {
    const [item] = toFeedItems([post('a-note')], false, SITE);

    expect(item).toMatchObject({
      title: 'Title of a-note',
      description: 'About a-note',
      pubDate: new Date('2026-06-01'),
      link: '/posts/a-note/',
    });
  });

  it('renders the full markdown body as HTML content', () => {
    const [item] = toFeedItems([post('a-note')], false, SITE);

    expect(item?.content).toContain('<strong>bold</strong>');
  });

  it('carries category and tags as feed categories', () => {
    const [item] = toFeedItems(
      [post('a-note', { category: 'essay', tags: ['dora', 'ci'] })],
      false,
      SITE,
    );

    expect(item?.categories).toEqual(['essay', 'dora', 'ci']);
  });

  it('strips unresolvable images from content — never a dead link in a feed reader', () => {
    const relative = post('with-diagram');
    relative.body = 'Before ![diagram](./diagram.svg) after.';

    const [item] = toFeedItems([relative], false, SITE);

    expect(item?.content).not.toContain('<img');
    expect(item?.content).toContain('Before');
  });

  it('resolves a relative in-body image to its absolute hashed URL when the manifest has it', () => {
    const withDiagram = post('with-diagram', {}) as ReturnType<typeof post> & {
      filePath: string;
    };
    withDiagram.filePath = 'src/content/posts/2026/with-diagram/index.md';
    withDiagram.body = 'Before ![diagram](./diagram.svg) after.';
    const manifest = new Map([
      ['src/content/posts/2026/with-diagram/diagram.svg', '/_astro/diagram.ABC123.svg'],
    ]);

    const [item] = toFeedItems([withDiagram], false, SITE, manifest);

    expect(item?.content).toContain(`<img src="${SITE}/_astro/diagram.ABC123.svg"`);
  });

  it('still strips an in-body image whose resolved path is not in the manifest', () => {
    const withDiagram = post('with-diagram', {}) as ReturnType<typeof post> & {
      filePath: string;
    };
    withDiagram.filePath = 'src/content/posts/2026/with-diagram/index.md';
    withDiagram.body = 'Before ![diagram](./missing.svg) after.';

    const [item] = toFeedItems([withDiagram], false, SITE, new Map());

    expect(item?.content).not.toContain('<img');
  });

  it('exposes the cover as media:content — never embedded in content (readers would show it twice)', () => {
    const cover = { src: '/_astro/cover.hash.png', width: 800, height: 500, format: 'png' };
    const [item] = toFeedItems([post('with-cover', { cover, coverAlt: 'A cover' })], false, SITE);

    expect(item?.content).not.toContain('<img');
    expect(item?.customData).toContain(
      `<media:content url="${SITE}/_astro/cover.hash.png" medium="image"`,
    );
  });

  it('emits no media customData for posts without a cover', () => {
    const [item] = toFeedItems([post('plain')], false, SITE);

    expect(item?.customData).toBeUndefined();
  });

  it('never includes drafts when showDrafts is off (production feed)', () => {
    const items = toFeedItems([post('published'), post('secret', { draft: true })], false, SITE);

    expect(items).toHaveLength(1);
    expect(items[0]?.link).toBe('/posts/published/');
  });

  it('includes drafts in preview feeds, consistent with pages', () => {
    expect(toFeedItems([post('secret', { draft: true })], true, SITE)).toHaveLength(1);
  });

  it('orders items newest first', () => {
    const items = toFeedItems(
      [
        post('old', { pubDate: new Date('2026-01-01') }),
        post('new', { pubDate: new Date('2026-07-01') }),
      ],
      false,
      SITE,
    );

    expect(items.map((i) => i.link)).toEqual(['/posts/new/', '/posts/old/']);
  });
});

describe('resolveImageSrc', () => {
  const manifest = new Map([
    ['src/content/posts/2026/with-diagram/diagram.svg', '/_astro/diagram.ABC123.svg'],
    ['src/content/posts/2026/with-diagram/nested/inline.png', '/_astro/inline.DEF456.png'],
  ]);

  it('resolves a same-folder relative path against the post filePath', () => {
    const filePath = 'src/content/posts/2026/with-diagram/index.md';

    expect(resolveImageSrc(filePath, './diagram.svg', manifest)).toBe('/_astro/diagram.ABC123.svg');
  });

  it('normalizes nested and dot-segment paths before the manifest lookup', () => {
    const filePath = 'src/content/posts/2026/with-diagram/index.md';

    expect(resolveImageSrc(filePath, './nested/inline.png', manifest)).toBe(
      '/_astro/inline.DEF456.png',
    );
    expect(resolveImageSrc(filePath, '../with-diagram/diagram.svg', manifest)).toBe(
      '/_astro/diagram.ABC123.svg',
    );
  });

  it('returns undefined when the resolved path is not in the manifest', () => {
    const filePath = 'src/content/posts/2026/with-diagram/index.md';

    expect(resolveImageSrc(filePath, './missing.svg', manifest)).toBeUndefined();
  });

  it('returns undefined when the post has no filePath', () => {
    expect(resolveImageSrc(undefined, './diagram.svg', manifest)).toBeUndefined();
  });
});

describe('buildImageManifest', () => {
  it('rewrites glob keys (relative to the calling file) to project-root-relative source paths', () => {
    const manifest = buildImageManifest(
      {
        '../content/posts/2026/with-diagram/diagram.svg': { src: '/_astro/diagram.ABC123.svg' },
      },
      'src/pages',
    );

    expect(manifest.get('src/content/posts/2026/with-diagram/diagram.svg')).toBe(
      '/_astro/diagram.ABC123.svg',
    );
  });
});
