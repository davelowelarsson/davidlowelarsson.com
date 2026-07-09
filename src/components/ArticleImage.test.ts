import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ArticleImage from './ArticleImage.astro';

const image = { src: '/_astro/arduino.hash.jpg', width: 1200, height: 900, format: 'jpg' as const };

describe('ArticleImage', () => {
  it('renders a processed image in a constrained article figure', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ArticleImage, {
      props: { src: image, alt: 'Arduino project close-up' },
    });

    expect(html).toContain('article-image');
    expect(html).toContain('Arduino project close-up');
    expect(html).toContain('arduino.hash.jpg');
    expect(html).toContain('data-image-layout="constrained-single"');
    expect(html).toContain('sizes="min(34rem, calc(100vw - 2.5rem))"');
  });
});
