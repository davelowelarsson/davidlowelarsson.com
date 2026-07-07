import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { isVisible, sortByPubDateDesc } from './posts';

const markdown = new MarkdownIt();

export interface FeedSourcePost {
  id: string;
  body?: string;
  data: {
    title: string;
    description?: string;
    pubDate: Date;
    category: string;
    draft: boolean;
    tags: string[];
    cover?: { src: string };
    coverAlt?: string;
  };
}

export interface FeedItem {
  title: string;
  description?: string;
  pubDate: Date;
  link: string;
  content: string;
  categories: string[];
  customData?: string;
}

/**
 * Relative image paths (./diagram.svg) are rewritten to hashed URLs on the
 * page but do not exist as served files — in a feed they would be dead links,
 * so they are stripped. Absolute paths survive.
 */
function renderContent(post: FeedSourcePost): string {
  return sanitizeHtml(markdown.render(post.body ?? ''), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !/^(https?:)?\//.test(String(frame.attribs.src ?? '')),
  });
}

/**
 * The cover travels as Media RSS metadata, NOT embedded in content — readers
 * extract a featured image themselves, and an embedded copy shows up twice.
 */
function coverCustomData(post: FeedSourcePost, site: string): string | undefined {
  if (!post.data.cover) return undefined;
  const url = new URL(post.data.cover.src, site).href;
  return `<media:content url="${url}" medium="image" />`;
}

export function toFeedItems(
  posts: FeedSourcePost[],
  showDrafts: boolean,
  site: string,
): FeedItem[] {
  return sortByPubDateDesc(posts.filter((post) => isVisible(post.data, showDrafts))).map(
    (post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}/`,
      content: renderContent(post),
      categories: [post.data.category, ...post.data.tags],
      customData: coverCustomData(post, site),
    }),
  );
}
