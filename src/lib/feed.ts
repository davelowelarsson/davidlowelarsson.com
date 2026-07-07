import { isVisible, sortByPubDateDesc } from './posts';

export interface FeedSourcePost {
  id: string;
  data: {
    title: string;
    description?: string;
    pubDate: Date;
    draft: boolean;
  };
}

export interface FeedItem {
  title: string;
  description?: string;
  pubDate: Date;
  link: string;
}

export function toFeedItems(posts: FeedSourcePost[], showDrafts: boolean): FeedItem[] {
  return sortByPubDateDesc(posts.filter((post) => isVisible(post.data, showDrafts))).map(
    (post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}/`,
    }),
  );
}
