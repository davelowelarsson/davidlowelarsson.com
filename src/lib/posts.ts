export const CATEGORIES = ['essay', 'til', 'experiment'] as const;

export type Category = (typeof CATEGORIES)[number];

/** Shown on each category page — the page teaches the term. */
export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  essay:
    'Longer, opinionated pieces on engineering leadership, delivery, and how software gets made.',
  til: 'Today I Learned — quick, unpolished notes captured while building. Written the same day, kept forever.',
  experiment: 'Write-ups from the lab: trying things out, measuring, and keeping honest notes.',
};

export function filterByCategory<T extends { data: { category: Category } }>(
  posts: T[],
  category: Category,
): T[] {
  return posts.filter((post) => post.data.category === category);
}

export interface PostVisibility {
  draft: boolean;
}

export interface Dated {
  data: { pubDate: Date };
}

/**
 * A post is a folder ("bundle") holding index.md or index.mdx plus its assets.
 * The folder name is the slug — parent folders (year, anything else) organize
 * the tree without ever appearing in URLs.
 */
export function postIdFromEntry(entry: string): string {
  const segments = entry.split('/');
  const filename = segments.at(-1);
  if (segments.length < 2 || (filename !== 'index.md' && filename !== 'index.mdx')) {
    throw new Error(
      `Post entry "${entry}" is not a bundle — expected <folders>/<slug>/index.md(x)`,
    );
  }
  return segments.at(-2) as string;
}

export function isVisible(data: PostVisibility, showDrafts: boolean): boolean {
  return showDrafts || !data.draft;
}

export function sortByPubDateDesc<T extends Dated>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Year buckets for archive listings — the year divider is what tells a reader
 * that a 2013 study is a 2013 study. Newest year first, newest post first.
 */
export function groupByYear<T extends Dated>(posts: T[]): Array<{ year: number; posts: T[] }> {
  const groups = new Map<number, T[]>();
  for (const post of sortByPubDateDesc(posts)) {
    const year = post.data.pubDate.getFullYear();
    const bucket = groups.get(year);
    if (bucket) {
      bucket.push(post);
    } else {
      groups.set(year, [post]);
    }
  }
  return [...groups.entries()].map(([year, grouped]) => ({ year, posts: grouped }));
}
