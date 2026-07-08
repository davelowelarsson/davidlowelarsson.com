/**
 * Self-hosted video/audio lives in a Cloudflare R2 bucket, fronted by this
 * subdomain — never referenced by hostname anywhere else (issue #10). The
 * repo/dist never contains the media itself (Workers static assets cap at
 * 25 MiB per file); R2 is the source of truth.
 */
export const MEDIA_ORIGIN = 'https://assets.davidlowelarsson.com';

/**
 * Resolves a `<Video|Audio src>` prop to an absolute URL. `src` is normally
 * an R2 key relative to `MEDIA_ORIGIN` (the file's path relative to
 * `src/content/posts/`, e.g. `2026/my-post/clip.mp4`) — but an already
 * absolute `http(s)://` URL passes through unchanged, so a post can point at
 * a one-off external host without a component change.
 */
export function mediaUrl(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${MEDIA_ORIGIN}/${src.replace(/^\/+/, '')}`;
}
