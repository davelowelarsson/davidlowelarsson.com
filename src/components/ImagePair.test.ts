import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ImagePair from './ImagePair.astro';

const left = { src: '/_astro/left.hash.jpg', width: 1200, height: 900, format: 'jpg' as const };
const right = { src: '/_astro/right.hash.jpg', width: 1200, height: 900, format: 'jpg' as const };

describe('ImagePair', () => {
  it('renders two processed images in a breakout pair layout', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ImagePair, {
      props: {
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
  });
});
