import { describe, expect, it } from 'vitest';
import { blogPostingJsonLd, personJsonLd } from './seo';

const SITE = 'https://davidlowelarsson.com';

describe('personJsonLd', () => {
  it('describes David with profile links for the landing page', () => {
    const json = personJsonLd(SITE);

    expect(json).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'David Lowe Larsson',
      url: `${SITE}/`,
    });
    expect(json.sameAs).toContain('https://www.linkedin.com/in/davidlowelarsson/');
    expect(json.sameAs).toContain('https://github.com/davelowelarsson');
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

  it('describes a post as a BlogPosting with absolute URL and author', () => {
    const json = blogPostingJsonLd(post, SITE);

    expect(json).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'A note',
      description: 'About a note',
      datePublished: '2026-06-01T00:00:00.000Z',
      url: `${SITE}/posts/a-note/`,
      keywords: ['til', 'astro', 'ci'],
    });
    expect(json.author).toMatchObject({ '@type': 'Person', name: 'David Lowe Larsson' });
  });

  it('includes an absolute image URL only for raster covers — crawlers ignore SVG', () => {
    const withSvg = blogPostingJsonLd(
      { ...post, data: { ...post.data, cover: { src: '/_astro/c.svg', format: 'svg' } } },
      SITE,
    );
    expect(withSvg.image).toBeUndefined();

    const withPng = blogPostingJsonLd(
      { ...post, data: { ...post.data, cover: { src: '/_astro/c.png', format: 'png' } } },
      SITE,
    );
    expect(withPng.image).toBe(`${SITE}/_astro/c.png`);
  });
});
