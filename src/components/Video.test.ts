import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { MEDIA_ORIGIN } from '../lib/media';
import Video from './Video.astro';

// A stand-in for an `import poster from './poster.jpg'` ImageMetadata value
// — same shape as the `cover` fixture in PostList.test.ts / YouTube.test.ts.
const poster = { src: '/_astro/poster.hash.jpg', width: 1280, height: 720, format: 'jpg' as const };

describe('Video', () => {
  it('renders a native, controllable video element pointed at the R2 origin', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Video, {
      props: { src: '2026/my-post/clip.mp4', poster },
    });

    expect(html).toContain('<video');
    expect(html).toContain('controls');
    expect(html).toContain('preload="metadata"');
    expect(html).toContain(`src="${MEDIA_ORIGIN}/2026/my-post/clip.mp4"`);
  });

  it('passes an already-absolute src through mediaUrl unchanged', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Video, {
      props: { src: 'https://example.com/clip.mp4', poster },
    });

    expect(html).toContain('src="https://example.com/clip.mp4"');
  });

  it('shows a poster image before load', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Video, {
      props: { src: '2026/my-post/clip.mp4', poster },
    });

    // Astro's <Image> routes a processed ImageMetadata source through its
    // (URL-encoded) image endpoint rather than the raw path, so match on the
    // filename rather than the literal `/_astro/...` string.
    expect(html).toContain('poster.hash.jpg');
  });

  it('accepts a plain path string poster as well as ImageMetadata', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Video, {
      props: { src: '2026/my-post/clip.mp4', poster: '/images/poster.jpg' },
    });

    expect(html).toContain('poster="/images/poster.jpg"');
  });

  it('can omit the poster and let the browser show video metadata/first frame', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Video, {
      props: { src: '2026/my-post/clip.mp4' },
    });

    expect(html).toContain('<video');
    expect(html).toContain('preload="metadata"');
    expect(html).not.toContain('poster=');
  });

  it('defaults the source type to video/mp4', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Video, {
      props: { src: '2026/my-post/clip.mp4', poster },
    });

    expect(html).toContain('type="video/mp4"');
  });

  it('accepts an explicit type override', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Video, {
      props: { src: '2026/my-post/clip.webm', poster, type: 'video/webm' },
    });

    expect(html).toContain('type="video/webm"');
  });

  it('reserves layout space via an aspect-ratio wrapper — no CLS', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Video, {
      props: { src: '2026/my-post/clip.mp4', poster, width: 1280, height: 720 },
    });

    expect(html).toContain('aspect-ratio');
  });

  it('passes slotted caption tracks through to the video element', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Video, {
      props: { src: '2026/my-post/clip.mp4', poster },
      slots: {
        default:
          '<track kind="captions" src="/captions/clip.en.vtt" srclang="en" label="English" />',
      },
    });

    expect(html).toContain('<track');
    expect(html).toContain('kind="captions"');
    expect(html).toContain('src="/captions/clip.en.vtt"');
  });
});
