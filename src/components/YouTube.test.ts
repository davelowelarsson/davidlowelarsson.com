import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import YouTube from './YouTube.astro';

// A stand-in for an `import poster from './poster.jpg'` ImageMetadata value
// — same shape as the `cover` fixture in PostList.test.ts.
const poster = { src: '/_astro/poster.hash.jpg', width: 1280, height: 720, format: 'jpg' as const };

describe('YouTube', () => {
  it('renders a click-to-load facade, not a live embed', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(YouTube, {
      props: { id: 'dQw4w9WgXcQ', title: 'A test video', poster },
    });

    // Nothing from Google/YouTube loads until the reader clicks.
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('youtube-nocookie.com/embed');
    expect(html).not.toContain('youtube.com/embed');
  });

  it('shows the poster image', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(YouTube, {
      props: { id: 'dQw4w9WgXcQ', title: 'A test video', poster },
    });

    // Astro's <Image> routes a processed ImageMetadata source through its
    // (URL-encoded) image endpoint rather than the raw path, so match on the
    // filename rather than the literal `/_astro/...` string.
    expect(html).toContain('poster.hash.jpg');
    expect(html).toContain('<img');
  });

  it('exposes a real, keyboard-activatable button labelled with the title', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(YouTube, {
      props: { id: 'dQw4w9WgXcQ', title: 'A test video', poster },
    });

    expect(html).toMatch(/<button[^>]*aria-label="[^"]*A test video[^"]*"/);
  });

  it('carries the video id and optional start time as data for the client script', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(YouTube, {
      props: { id: 'dQw4w9WgXcQ', title: 'A test video', poster, start: 42 },
    });

    expect(html).toContain('data-youtube-id="dQw4w9WgXcQ"');
    expect(html).toContain('data-youtube-start="42"');
  });

  it('accepts a plain relative-path string poster as well as ImageMetadata', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(YouTube, {
      props: { id: 'dQw4w9WgXcQ', title: 'A test video', poster: '/images/poster.jpg' },
    });

    expect(html).toContain('/images/poster.jpg');
    expect(html).not.toContain('<iframe');
  });

  it('always provides a distinctly labelled direct YouTube link', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(YouTube, {
      props: { id: 'dQw4w9WgXcQ', title: 'A test video', poster },
    });

    expect(html).toContain('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
    expect(html).toContain('aria-label="Open &quot;A test video&quot; on YouTube"');
    expect(html).toContain('Open on YouTube');
  });
});
