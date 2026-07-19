import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import MediaAside from './MediaAside.astro';

const vectorImage = {
  src: '/_astro/research.hash.svg',
  width: 1000,
  height: 600,
  format: 'svg' as const,
};

const rasterImage = {
  src: '/_astro/research.hash.png',
  width: 1200,
  height: 800,
  format: 'png' as const,
};

describe('MediaAside', () => {
  it('renders text before sourced media with selectable desktop placement', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(MediaAside, {
      props: {
        src: rasterImage,
        alt: 'A simplified research chart',
        side: 'right',
        caption: 'My simplified view of the published estimates.',
        sourceHref: 'https://example.com/research',
        sourceLabel: 'Data: Example Research',
      },
      slots: { default: '<p>The finding needs some context.</p>' },
    });

    expect(html).toContain('data-media-side="right"');
    expect(html.indexOf('The finding needs some context.')).toBeLessThan(
      html.indexOf('A simplified research chart'),
    );
    expect(html).toContain('My simplified view of the published estimates.');
    expect(html).toContain('href="https://example.com/research"');
    expect(html).toContain('Data: Example Research');
    expect(html).toContain('<div class="media-aside media-aside--right breakout"');
    expect(html).not.toContain('<section');
    expect(html).toContain(
      'sizes="(min-width: 62rem) 28.75rem, (min-width: 52rem) calc((100vw - 4.5rem) / 2), calc(100vw - 2rem)"',
    );
  });

  it('exposes the left-side desktop option without changing semantic order', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(MediaAside, {
      props: { src: rasterImage, alt: 'Research chart', side: 'left' },
      slots: { default: '<p>Context before media.</p>' },
    });

    expect(html).toContain('media-aside--left');
    expect(html).toContain('data-media-side="left"');
    expect(html.indexOf('Context before media.')).toBeLessThan(html.indexOf('Research chart'));
  });

  it('disables responsive copies for vector images', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(MediaAside, {
      props: { src: vectorImage, alt: 'Vector research chart' },
      slots: { default: '<p>Chart context.</p>' },
    });

    expect(html).not.toContain('srcset=');
    expect(html).not.toContain('sizes=');
  });
});
