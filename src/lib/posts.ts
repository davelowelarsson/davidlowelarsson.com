export const CATEGORIES = ['essay', 'til', 'experiment'] as const;

export type Category = (typeof CATEGORIES)[number];

export interface PostVisibility {
  draft: boolean;
}

export interface Dated {
  data: { pubDate: Date };
}

/**
 * A post is a folder ("bundle") holding index.md plus its assets. The folder
 * name is the slug — parent folders (year, anything else) organize the tree
 * without ever appearing in URLs.
 */
export function postIdFromEntry(entry: string): string {
  const segments = entry.split('/');
  if (segments.length < 2 || segments.at(-1) !== 'index.md') {
    throw new Error(`Post entry "${entry}" is not a bundle — expected <folders>/<slug>/index.md`);
  }
  return segments.at(-2) as string;
}

export function isVisible(data: PostVisibility, showDrafts: boolean): boolean {
  return showDrafts || !data.draft;
}

export function sortByPubDateDesc<T extends Dated>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
