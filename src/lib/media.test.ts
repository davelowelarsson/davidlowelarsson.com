import { describe, expect, it } from 'vitest';
import { MEDIA_ORIGIN, mediaUrl } from './media';

describe('mediaUrl', () => {
  it('prefixes an R2 key with the media origin', () => {
    expect(mediaUrl('2026/my-post/clip.mp4')).toBe(`${MEDIA_ORIGIN}/2026/my-post/clip.mp4`);
  });

  it('strips a leading slash before prefixing', () => {
    expect(mediaUrl('/2026/my-post/clip.mp4')).toBe(`${MEDIA_ORIGIN}/2026/my-post/clip.mp4`);
  });

  it('strips multiple leading slashes before prefixing', () => {
    expect(mediaUrl('///2026/my-post/clip.mp4')).toBe(`${MEDIA_ORIGIN}/2026/my-post/clip.mp4`);
  });

  it('passes an already-absolute http(s) url through unchanged', () => {
    expect(mediaUrl('https://example.com/clip.mp4')).toBe('https://example.com/clip.mp4');
    expect(mediaUrl('http://example.com/clip.mp4')).toBe('http://example.com/clip.mp4');
  });

  it('exposes the media origin as a constant', () => {
    expect(MEDIA_ORIGIN).toBe('https://assets.davidlowelarsson.com');
  });
});
