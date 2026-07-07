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
}

/**
 * Relative image paths (./diagram.svg) are rewritten to hashed URLs on the
 * page but do not exist as served files — in a feed they would be dead links,
 * so they are stripped. Absolute paths (like the processed cover) survive.
 */
function renderContent(post: FeedSourcePost, site: string): string {
  const body = sanitizeHtml(markdown.render(post.body ?? ''), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !/^(https?:)?\//.test(String(frame.attribs.src ?? '')),
  });

  const cover = post.data.cover
    ? `<p><img src="${new URL(post.data.cover.src, site).href}" alt="${post.data.coverAlt ?? ''}" /></p>`
    : '';

  return cover + body;
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
      content: renderContent(post, site),
      categories: [post.data.category, ...post.data.tags],
    }),
  );
}
