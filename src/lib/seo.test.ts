import { describe, expect, it } from 'vitest';
import { blogPostingJsonLd, collectionPageJsonLd, profilePageJsonLd } from './seo';

const SITE = 'https://davidlowelarsson.com';

describe('profilePageJsonLd', () => {
  it('wraps David as the main entity of a ProfilePage (the Google rich-result shape)', () => {
    const json = profilePageJsonLd(SITE);

    expect(json).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
    });
    expect(json.mainEntity).toMatchObject({
      '@type': 'Person',
      name: 'David Lowe Larsson',
      url: `${SITE}/`,
    });
    expect(json.mainEntity.sameAs).toContain('https://www.linkedin.com/in/davidlowelarsson/');
    expect(json.mainEntity.sameAs).toContain('https://github.com/davelowelarsson');
  });
});

describe('blogPostingJsonLd', () => {
  const post = {
    id: 'a-note',
    data: {
      title: 'A note',
      description: 'About a note',
      pubDate: new Date('2026-06-01'),
      category: 'til',
      draft: false,
      tags: ['astro', 'ci'],
    },
  };

  it('describes a post as a BlogPosting with author, publisher, and dates', () => {
    const json = blogPostingJsonLd(post, SITE);

    expect(json).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'A note',
      datePublished: '2026-06-01T00:00:00.000Z',
      dateModified: '2026-06-01T00:00:00.000Z',
      url: `${SITE}/posts/a-note/`,
      keywords: ['til', 'astro', 'ci'],
    });
    expect(json.author).toMatchObject({ '@type': 'Person', name: 'David Lowe Larsson' });
    expect(json.publisher).toMatchObject({ '@type': 'Organization', name: 'David Lowe Larsson' });
    expect(json.publisher.logo).toMatchObject({ '@type': 'ImageObject' });
  });

  it('uses updatedDate for dateModified when present', () => {
    const json = blogPostingJsonLd(
      { ...post, data: { ...post.data, updatedDate: new Date('2026-07-01') } },
      SITE,
    );

    expect(json.dateModified).toBe('2026-07-01T00:00:00.000Z');
  });

  it('always has an image — raster cover with dimensions, else the default OG card', () => {
    const withoutCover = blogPostingJsonLd(post, SITE);
    expect(withoutCover.image).toMatchObject({
      '@type': 'ImageObject',
      url: `${SITE}/og-default.png`,
      width: 1200,
      height: 630,
    });

    const withSvgCover = blogPostingJsonLd(
      {
        ...post,
        data: {
          ...post.data,
          cover: { src: '/_astro/c.svg', format: 'svg', width: 400, height: 220 },
        },
      },
      SITE,
    );
    expect(withSvgCover.image.url).toBe(`${SITE}/og-default.png`);

    const withPngCover = blogPostingJsonLd(
      {
        ...post,
        data: {
          ...post.data,
          cover: { src: '/_astro/c.png', format: 'png', width: 800, height: 500 },
        },
      },
      SITE,
    );
    expect(withPngCover.image).toMatchObject({
      '@type': 'ImageObject',
      url: `${SITE}/_astro/c.png`,
      width: 800,
      height: 500,
    });
  });
});

describe('collectionPageJsonLd', () => {
  it('describes a listing page with an ItemList of posts', () => {
    const json = collectionPageJsonLd(
      'Posts',
      'All writing',
      [
        { id: 'newest', data: { title: 'Newest' } },
        { id: 'older', data: { title: 'Older' } },
      ],
      SITE,
    );

    expect(json).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Posts',
      description: 'All writing',
    });
    expect(json.mainEntity).toMatchObject({ '@type': 'ItemList', numberOfItems: 2 });
    expect(json.mainEntity.itemListElement[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      name: 'Newest',
      url: `${SITE}/posts/newest/`,
    });
  });
});
