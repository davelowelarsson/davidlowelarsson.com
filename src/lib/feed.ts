import { posix } from 'node:path';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { isVisible, sortByPubDateDesc } from './posts';

const markdown = new MarkdownIt();

export interface FeedSourcePost {
  id: string;
  body?: string;
  /** Project-root-relative path of the post's `index.md`, e.g.
   * `src/content/posts/2026/slug/index.md` — set by the glob loader. Used to
   * resolve in-body relative image paths against their post's folder. */
  filePath?: string;
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

/** The bits of Astro's `ImageMetadata` this module needs — kept minimal so
 * `feed.ts` doesn't depend on Astro's types. */
export interface ImageLike {
  src: string;
}

/**
 * `import.meta.glob` keys are import specifiers relative to the *calling*
 * file (e.g. `../content/posts/2026/slug/diagram.svg` from
 * `src/pages/rss.xml.ts`), not the project-root-relative paths `filePath`
 * uses. `globBase` — that calling file's directory, project-root-relative —
 * puts both on the same footing so `resolveImageSrc` can compare them.
 */
export function buildImageManifest(
  entries: Record<string, ImageLike>,
  globBase: string,
): Map<string, string> {
  return new Map(
    Object.entries(entries).map(([key, image]) => [
      posix.normalize(posix.join(globBase, key)),
      image.src,
    ]),
  );
}

/**
 * Resolves a markdown image's relative `src` (e.g. `./diagram.svg`) against
 * its post's folder, then looks up the served hashed URL in `manifest`
 * (keyed by project-root-relative source path, see `buildImageManifest`).
 * Returns `undefined` — never a best-effort guess — when `filePath` is
 * missing or the resolved path isn't in the manifest, so the caller can
 * strip the image instead of producing a dead link.
 */
export function resolveImageSrc(
  filePath: string | undefined,
  relativeSrc: string,
  manifest: Map<string, string>,
): string | undefined {
  if (!filePath) return undefined;
  const sourcePath = posix.normalize(posix.join(posix.dirname(filePath), relativeSrc));
  return manifest.get(sourcePath);
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

const ABSOLUTE_SRC = /^(https?:)?\//;

/**
 * Relative image paths (./diagram.svg) aren't servable as-is in a feed
 * reader — there's no page context to resolve them against — so they're
 * rewritten to the real hashed `/_astro/...` URL via `imageManifest`
 * (`resolveImageSrc`). Anything that doesn't resolve (no `filePath`, or not
 * in the manifest) is stripped rather than left as a dead link. Absolute
 * paths pass through untouched.
 */
function renderContent(
  post: FeedSourcePost,
  imageManifest: Map<string, string>,
  site: string,
): string {
  return sanitizeHtml(markdown.render(post.body ?? ''), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    transformTags: {
      img: (tagName, attribs) => {
        const src = String(attribs.src ?? '');
        if (ABSOLUTE_SRC.test(src)) return { tagName, attribs };

        const resolved = resolveImageSrc(post.filePath, src, imageManifest);
        if (!resolved) return { tagName, attribs };

        return { tagName, attribs: { ...attribs, src: new URL(resolved, site).href } };
      },
    },
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !ABSOLUTE_SRC.test(String(frame.attribs.src ?? '')),
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
  imageManifest: Map<string, string> = new Map(),
): FeedItem[] {
  return sortByPubDateDesc(posts.filter((post) => isVisible(post.data, showDrafts))).map(
    (post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}/`,
      content: renderContent(post, imageManifest, site),
      categories: [post.data.category, ...post.data.tags],
      customData: coverCustomData(post, site),
    }),
  );
}
