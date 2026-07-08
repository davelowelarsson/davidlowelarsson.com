import { describe, expect, it } from 'vitest';
import {
  categorizeMediaKey,
  diffManifest,
  extractMediaRefs,
  findOrphans,
  hashContent,
  isMediaFile,
  type Manifest,
  mergeManifest,
  postSlugFromKey,
  scanMediaFiles,
} from './media-manifest';

describe('isMediaFile', () => {
  it('recognizes every ignored media extension', () => {
    for (const ext of ['mp4', 'webm', 'mov', 'm4v', 'm4a', 'mp3', 'wav', 'ogg']) {
      expect(isMediaFile(`clip.${ext}`)).toBe(true);
    }
  });

  it('rejects poster/thumbnail image extensions — those stay committed', () => {
    for (const ext of ['png', 'jpg', 'jpeg', 'svg', 'webp']) {
      expect(isMediaFile(`cover.${ext}`)).toBe(false);
    }
  });

  it('rejects non-media files like index.md', () => {
    expect(isMediaFile('index.md')).toBe(false);
    expect(isMediaFile('index.mdx')).toBe(false);
  });

  it('is case-insensitive on extension', () => {
    expect(isMediaFile('clip.MP4')).toBe(true);
  });
});

describe('postSlugFromKey', () => {
  it('derives the post slug from a <year>/<slug>/... key', () => {
    expect(postSlugFromKey('2026/my-post/clip.mp4')).toBe('my-post');
  });

  it('derives the slug even when the file is nested deeper in the bundle', () => {
    expect(postSlugFromKey('2026/my-post/assets/clip.mp4')).toBe('my-post');
  });
});

describe('hashContent', () => {
  it('is deterministic for identical content', () => {
    expect(hashContent(Buffer.from('hello'))).toBe(hashContent(Buffer.from('hello')));
  });

  it('differs for different content', () => {
    expect(hashContent(Buffer.from('hello'))).not.toBe(hashContent(Buffer.from('world')));
  });
});

describe('scanMediaFiles', () => {
  it('hashes and derives a key + post slug for each media file, skipping non-media files', () => {
    const scanned = scanMediaFiles([
      { path: '2026/my-post/clip.mp4', content: Buffer.from('a') },
      { path: '2026/my-post/index.md', content: Buffer.from('---\n---') },
      { path: '2026/other-post/cover.png', content: Buffer.from('b') },
    ]);

    expect(scanned).toEqual([
      { key: '2026/my-post/clip.mp4', hash: hashContent(Buffer.from('a')), postSlug: 'my-post' },
    ]);
  });
});

describe('diffManifest', () => {
  const scanned = [
    { key: '2026/my-post/clip.mp4', hash: 'hash-a', postSlug: 'my-post' },
    { key: '2026/my-post/other.mp3', hash: 'hash-b', postSlug: 'my-post' },
  ];

  it('flags files missing from the manifest as needing upload', () => {
    const { toUpload, unchanged } = diffManifest({}, scanned);
    expect(toUpload).toEqual(scanned);
    expect(unchanged).toEqual([]);
  });

  it('flags files whose hash changed as needing upload', () => {
    const manifest: Manifest = {
      '2026/my-post/clip.mp4': { hash: 'stale-hash', posts: ['my-post'] },
      '2026/my-post/other.mp3': { hash: 'hash-b', posts: ['my-post'] },
    };
    const { toUpload, unchanged } = diffManifest(manifest, scanned);
    expect(toUpload).toEqual([scanned[0]]);
    expect(unchanged).toEqual(['2026/my-post/other.mp3']);
  });

  it('is idempotent — an unchanged scan re-run needs no uploads', () => {
    const manifest: Manifest = {
      '2026/my-post/clip.mp4': { hash: 'hash-a', posts: ['my-post'] },
      '2026/my-post/other.mp3': { hash: 'hash-b', posts: ['my-post'] },
    };
    const { toUpload, unchanged } = diffManifest(manifest, scanned);
    expect(toUpload).toEqual([]);
    expect(unchanged.sort()).toEqual(['2026/my-post/clip.mp4', '2026/my-post/other.mp3']);
  });
});

describe('mergeManifest', () => {
  it('adds new entries with their hash and referencing post slug', () => {
    const result = mergeManifest({}, [
      { key: '2026/my-post/clip.mp4', hash: 'hash-a', postSlug: 'my-post' },
    ]);
    expect(result).toEqual({
      '2026/my-post/clip.mp4': { hash: 'hash-a', posts: ['my-post'] },
    });
  });

  it('updates the hash of an existing entry and keeps its post list deduped', () => {
    const manifest: Manifest = {
      '2026/my-post/clip.mp4': { hash: 'old-hash', posts: ['my-post'] },
    };
    const result = mergeManifest(manifest, [
      { key: '2026/my-post/clip.mp4', hash: 'new-hash', postSlug: 'my-post' },
    ]);
    expect(result['2026/my-post/clip.mp4']).toEqual({ hash: 'new-hash', posts: ['my-post'] });
  });

  it('does not mutate the input manifest', () => {
    const manifest: Manifest = { existing: { hash: 'h', posts: ['p'] } };
    mergeManifest(manifest, [{ key: 'new/key.mp4', hash: 'h2', postSlug: 'p2' }]);
    expect(manifest).toEqual({ existing: { hash: 'h', posts: ['p'] } });
  });
});

describe('findOrphans', () => {
  it('reports manifest keys no longer referenced by any post', () => {
    const manifest: Manifest = {
      'used/key.mp4': { hash: 'a', posts: ['used'] },
      'orphan/key.mp4': { hash: 'b', posts: ['orphan'] },
    };
    expect(findOrphans(manifest, ['used/key.mp4'])).toEqual(['orphan/key.mp4']);
  });

  it('reports nothing when every manifest key is referenced', () => {
    const manifest: Manifest = { 'used/key.mp4': { hash: 'a', posts: ['used'] } };
    expect(findOrphans(manifest, ['used/key.mp4'])).toEqual([]);
  });
});

describe('extractMediaRefs', () => {
  it('finds a relative key from a <Video src="...">', () => {
    const body = `<Video src="2026/my-post/clip.mp4" poster={poster} />`;
    expect(extractMediaRefs(body)).toEqual(['2026/my-post/clip.mp4']);
  });

  it('finds a relative key from an <Audio src="...">', () => {
    const body = `<Audio src="2026/my-post/clip.mp3" />`;
    expect(extractMediaRefs(body)).toEqual(['2026/my-post/clip.mp3']);
  });

  it('ignores already-absolute http(s) src values', () => {
    const body = `<Video src="https://example.com/clip.mp4" poster={poster} />`;
    expect(extractMediaRefs(body)).toEqual([]);
  });

  it('normalizes a leading-slash src to the canonical key (matches manifest/local keys)', () => {
    const body = `<Video src="/2026/my-post/clip.mp4" poster={poster} />`;
    expect(extractMediaRefs(body)).toEqual(['2026/my-post/clip.mp4']);
  });

  it('finds every reference across multiple embeds', () => {
    const body = `
      <Video src="2026/a/clip.mp4" poster={poster} />
      some text
      <Audio src="2026/b/clip.mp3" />
    `;
    expect(extractMediaRefs(body)).toEqual(['2026/a/clip.mp4', '2026/b/clip.mp3']);
  });

  it('returns an empty array when nothing is embedded', () => {
    expect(extractMediaRefs('Just plain markdown, no embeds.')).toEqual([]);
  });
});

describe('categorizeMediaKey', () => {
  it('is OK when the key exists in R2, even with no local file', () => {
    expect(categorizeMediaKey({ inR2: true, localFile: false })).toBe('ok');
  });

  it('is OK when the key exists in R2 and locally', () => {
    expect(categorizeMediaKey({ inR2: true, localFile: true })).toBe('ok');
  });

  it('needs a sync when present locally but not yet in R2', () => {
    expect(categorizeMediaKey({ inR2: false, localFile: true })).toBe('sync-needed');
  });

  it('is broken when missing from both R2 and local disk', () => {
    expect(categorizeMediaKey({ inR2: false, localFile: false })).toBe('broken');
  });
});
