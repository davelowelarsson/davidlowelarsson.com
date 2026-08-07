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
        kind: 'chart',
        placement: 'right',
        caption: 'My simplified view of the published estimates.',
        sourceHref: 'https://example.com/research',
        sourceLabel: 'Data: Example Research',
      },
      slots: { default: '<p>The finding needs some context.</p>' },
    });

    expect(html).toContain('data-placement="right"');
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
      props: { src: rasterImage, alt: 'Research chart', kind: 'chart', placement: 'left' },
      slots: { default: '<p>Context before media.</p>' },
    });

    expect(html).toContain('media-aside--left');
    expect(html).toContain('data-placement="left"');
    expect(html.indexOf('Context before media.')).toBeLessThan(html.indexOf('Research chart'));
  });

  it('disables responsive copies for vector images', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(MediaAside, {
      props: { src: vectorImage, alt: 'Vector research chart', kind: 'chart' },
      slots: { default: '<p>Chart context.</p>' },
    });

    expect(html).toContain('src="/_astro/research.hash.svg"');
    expect(html).not.toContain('srcset=');
    expect(html).not.toContain('sizes=');
  });

  // #118. `data-media-side` was renamed to `data-placement`: it was one
  // character of MEANING away from `data-media`, and a reader had to know which
  // of the two named a position and which named a kind. The assertions moved
  // with the name rather than being dropped.
  it('emits the figure contract on the figure, and placement on the wrapper', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(MediaAside, {
      props: { src: rasterImage, alt: 'Research chart', kind: 'chart', placement: 'left' },
      slots: { default: '<p>Context.</p>' },
    });

    // Kind belongs to the figure; placement and layout to the wrapper it sits
    // in. Keeping them on separate elements is what stops one from being read
    // as the other.
    expect(html).toMatch(/<figure[^>]*class="[^"]*\bmedia\b/);
    expect(html).toContain('data-media="chart"');
    expect(html).toContain('media__body');
    expect(html).toContain('data-placement="left"');
    expect(html).not.toContain('data-media-side');
    // A figure inside a figure would be the obvious wrong way to do this.
    expect(html.match(/<figure/g)).toHaveLength(1);
  });
});
