import { createHash } from 'node:crypto';

/**
 * Pure logic for `scripts/media-sync.mjs` and `scripts/media-check.mjs`
 * (issue #10): scanning, hashing, manifest diffing, key derivation, and R2
 * reconciliation. No fs/network access happens in this module — both
 * scripts do the real I/O and feed it through these functions, which is
 * what makes them unit-testable with mocked inputs instead of a real R2
 * bucket or file tree.
 *
 * Media never lives in the repo (Workers static assets cap at 25 MiB/file;
 * R2 is the source of truth) — this manifest is the repo's record of what
 * SHOULD exist in R2, keyed by the file's path relative to
 * `src/content/posts/` (e.g. `src/content/posts/2026/my-post/clip.mp4` →
 * key `2026/my-post/clip.mp4`, referenced as `<Video src="2026/my-post/clip.mp4" .../>`).
 */

/** Kept in lockstep with the media patterns ignored in `.gitignore`. */
export const MEDIA_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v', 'm4a', 'mp3', 'wav', 'ogg'] as const;

export interface ManifestEntry {
  hash: string;
  posts: string[];
}

export type Manifest = Record<string, ManifestEntry>;

export interface ScannedFile {
  key: string;
  hash: string;
  postSlug: string;
}

/** Is this a media file that is gitignored under `src/content/**`? */
export function isMediaFile(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase();
  return ext !== undefined && (MEDIA_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * A post bundle is always `<year>/<slug>/...` relative to
 * `src/content/posts/` (see `postIdFromEntry` in `posts.ts`) — media may sit
 * directly in the bundle or a subfolder of it, but the slug is always the
 * second path segment.
 */
export function postSlugFromKey(key: string): string {
  const segments = key.split('/');
  return segments[1] ?? segments[0];
}

/** sha256 of file content — deterministic, so re-scanning unchanged files is a no-op. */
export function hashContent(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Pure scan step: given every file under `src/content/posts` (path relative
 * to that root, plus its content), returns the media files with their
 * derived key, hash, and owning post slug. Non-media files (posts
 * themselves, posters) are skipped.
 */
export function scanMediaFiles(files: Array<{ path: string; content: Buffer }>): ScannedFile[] {
  return files
    .filter((file) => isMediaFile(file.path))
    .map((file) => ({
      key: file.path,
      hash: hashContent(file.content),
      postSlug: postSlugFromKey(file.path),
    }));
}

/** Which scanned files are new or changed vs. the committed manifest? Hash-skip makes this idempotent. */
export function diffManifest(
  manifest: Manifest,
  scanned: ScannedFile[],
): { toUpload: ScannedFile[]; unchanged: string[] } {
  const toUpload: ScannedFile[] = [];
  const unchanged: string[] = [];
  for (const file of scanned) {
    const existing = manifest[file.key];
    if (existing && existing.hash === file.hash) {
      unchanged.push(file.key);
    } else {
      toUpload.push(file);
    }
  }
  return { toUpload, unchanged };
}

/** Returns a new manifest with each uploaded file's hash recorded and its post slug tracked (deduped). */
export function mergeManifest(manifest: Manifest, uploaded: ScannedFile[]): Manifest {
  const next: Manifest = { ...manifest };
  for (const file of uploaded) {
    const existingPosts = next[file.key]?.posts ?? [];
    next[file.key] = {
      hash: file.hash,
      posts: [...new Set([...existingPosts, file.postSlug])],
    };
  }
  return next;
}

/** Manifest keys no longer referenced by any post — reported, never auto-deleted. */
export function findOrphans(manifest: Manifest, referencedKeys: Iterable<string>): string[] {
  const referenced = new Set(referencedKeys);
  return Object.keys(manifest).filter((key) => !referenced.has(key));
}

const MEDIA_TAG_SRC = /<(?:Video|Audio)\b[^>]*\bsrc=["']([^"']+)["']/g;

/** Every relative R2 key referenced by a `<Video|Audio src="...">` in a post body. Absolute http(s) URLs are not R2-managed, so they're excluded. */
export function extractMediaRefs(source: string): string[] {
  const refs: string[] = [];
  for (const match of source.matchAll(MEDIA_TAG_SRC)) {
    const src = match[1];
    if (src && !/^https?:\/\//.test(src)) refs.push(src);
  }
  return refs;
}

export type MediaStatus = 'ok' | 'sync-needed' | 'broken';

/**
 * `media:check`'s three-way reconciliation for one referenced key: R2 is
 * authoritative (a key can be in R2 without a local file — the whole point
 * of not committing media), local-only means "run media:sync", and neither
 * means a genuinely broken embed.
 */
export function categorizeMediaKey(input: { inR2: boolean; localFile: boolean }): MediaStatus {
  if (input.inR2) return 'ok';
  if (input.localFile) return 'sync-needed';
  return 'broken';
}
