export const CATEGORIES = ['essay', 'til', 'experiment'] as const;

export type Category = (typeof CATEGORIES)[number];

export interface PostVisibility {
  draft: boolean;
}

export interface Dated {
  data: { pubDate: Date };
}

export function isVisible(data: PostVisibility, showDrafts: boolean): boolean {
  return showDrafts || !data.draft;
}

export function sortByPubDateDesc<T extends Dated>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
