export const AUTHOR = {
  name: 'David Lowe Larsson',
  linkedin: 'https://www.linkedin.com/in/davidlowelarsson/',
  github: 'https://github.com/davelowelarsson',
} as const;

interface SeoCover {
  src: string;
  format: string;
  width?: number;
  height?: number;
}

interface SeoSourcePost {
  id: string;
  data: {
    title: string;
    description?: string;
    pubDate: Date;
    updatedDate?: Date;
    category: string;
    tags: string[];
    cover?: SeoCover;
  };
}

function imageObject(url: string, width?: number, height?: number) {
  return { '@type': 'ImageObject', url, width, height };
}

function defaultOgImage(site: string) {
  return imageObject(new URL('/og-default.png', site).href, 1200, 630);
}

function person(site: string) {
  return {
    '@type': 'Person',
    name: AUTHOR.name,
    url: new URL('/', site).href,
    sameAs: [AUTHOR.linkedin, AUTHOR.github],
  };
}

function publisher(site: string) {
  return {
    '@type': 'Organization',
    name: AUTHOR.name,
    url: new URL('/', site).href,
    logo: imageObject(new URL('/apple-touch-icon.png', site).href, 180, 180),
  };
}

/** Google's rich-result shape for a personal homepage: ProfilePage → Person. */
export function profilePageJsonLd(site: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: person(site),
  };
}

/**
 * BlogPosting must always carry an image (Google wants ≥696×400): a raster
 * cover with its real dimensions, else the 1200×630 default OG card.
 * Crawlers ignore SVG, so SVG covers fall through to the default.
 */
function articleImage(post: SeoSourcePost, site: string) {
  const cover = post.data.cover;
  if (!cover || cover.format === 'svg') return defaultOgImage(site);
  return imageObject(new URL(cover.src, site).href, cover.width, cover.height);
}

export function blogPostingJsonLd(post: SeoSourcePost, site: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.data.title,
    description: post.data.description,
    datePublished: post.data.pubDate.toISOString(),
    dateModified: (post.data.updatedDate ?? post.data.pubDate).toISOString(),
    url: new URL(`/posts/${post.id}/`, site).href,
    keywords: [post.data.category, ...post.data.tags],
    author: person(site),
    publisher: publisher(site),
    image: articleImage(post, site),
  };
}

export function collectionPageJsonLd(
  name: string,
  description: string,
  posts: Array<{ id: string; data: { title: string } }>,
  site: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: post.data.title,
        url: new URL(`/posts/${post.id}/`, site).href,
      })),
    },
  };
}
