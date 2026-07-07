export const AUTHOR = {
  name: 'David Lowe Larsson',
  linkedin: 'https://www.linkedin.com/in/davidlowelarsson/',
  github: 'https://github.com/davelowelarsson',
} as const;

interface SeoSourcePost {
  id: string;
  data: {
    title: string;
    description?: string;
    pubDate: Date;
    category: string;
    tags: string[];
    cover?: { src: string; format: string };
  };
}

export function personJsonLd(site: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR.name,
    url: new URL('/', site).href,
    sameAs: [AUTHOR.linkedin, AUTHOR.github],
  };
}

/** Crawlers ignore SVG images in structured data — only raster covers count. */
function rasterCoverUrl(post: SeoSourcePost, site: string): string | undefined {
  const cover = post.data.cover;
  if (!cover || cover.format === 'svg') return undefined;
  return new URL(cover.src, site).href;
}

export function blogPostingJsonLd(post: SeoSourcePost, site: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.data.title,
    description: post.data.description,
    datePublished: post.data.pubDate.toISOString(),
    url: new URL(`/posts/${post.id}/`, site).href,
    keywords: [post.data.category, ...post.data.tags],
    author: { '@type': 'Person', name: AUTHOR.name, url: new URL('/', site).href },
    image: rasterCoverUrl(post, site),
  };
}
