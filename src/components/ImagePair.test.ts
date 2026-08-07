import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ImagePair from './ImagePair.astro';

const left = { src: '/_astro/left.hash.jpg', width: 1200, height: 900, format: 'jpg' as const };
const right = { src: '/_astro/right.hash.jpg', width: 1200, height: 900, format: 'jpg' as const };

describe('ImagePair', () => {
  it('renders two processed images in a compact cropped pair layout', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ImagePair, {
      props: {
        kind: 'photo',
        images: [
          { src: left, alt: 'Left image' },
          { src: right, alt: 'Right image' },
        ],
      },
    });

    expect(html).toContain('image-pair');
    expect(html).toContain('Left image');
    expect(html).toContain('Right image');
    expect(html).toContain('left.hash.jpg');
    expect(html).toContain('right.hash.jpg');
    expect(html).not.toContain('breakout');
    expect(html).toContain('sizes="(min-width: 44rem) 17rem, calc(100vw - 2.5rem)"');
  });

  // #118. These assertions MIGRATED from `data-image-layout="compact-pair"` and
  // `data-image-crop="4:3"` rather than being deleted: the first said what the
  // layout was, which the contract expresses as kind plus the breakout
  // primitive; the second described a CSS decision in markup where nothing
  // could read it. Coverage moves; it does not dip.
  it('emits the figure contract with its kind', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ImagePair, {
      props: {
        kind: 'photo',
        images: [
          { src: left, alt: 'Left image' },
          { src: right, alt: 'Right image' },
        ],
      },
    });

    expect(html).toMatch(/<figure[^>]*class="[^"]*\bmedia\b/);
    expect(html).toContain('data-media="photo"');
    expect(html).toContain('media__body');
    expect(html).not.toContain('data-image-layout');
    expect(html).not.toContain('data-image-crop');
  });

  it('captions the pair as a whole, and only when asked', async () => {
    const container = await AstroContainer.create();
    const images = [
      { src: left, alt: 'Left image' },
      { src: right, alt: 'Right image' },
    ];
    const bare = await container.renderToString(ImagePair, { props: { kind: 'photo', images } });
    expect(bare).not.toContain('media__caption');

    const captioned = await container.renderToString(ImagePair, {
      props: { kind: 'photo', images, caption: 'Two views of the same build.' },
    });
    // One caption for the pair, not one per image — the pair is one figure.
    expect(captioned.match(/media__caption/g)).toHaveLength(1);
    expect(captioned).toContain('Two views of the same build.');
  });
});
