import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ArticleImage from './ArticleImage.astro';

// The figure contract, asserted at its first call site (#117). What is being
// pinned here is the SHAPE — figure, contract class, kind, body, optional
// caption — because four more components are about to be committed to it.

const image = { src: '/_astro/arduino.hash.jpg', width: 1200, height: 900, format: 'jpg' as const };

async function render(props: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ArticleImage, {
    props: { src: image, alt: 'Arduino project close-up', kind: 'photo', ...props },
  });
}

describe('ArticleImage emits the figure contract', () => {
  it('renders a <figure> carrying the contract class', async () => {
    const html = await render({});
    expect(html).toMatch(/<figure[^>]*class="[^"]*\bmedia\b/);
    expect(html).toContain('article-image');
  });

  it('declares its kind as data-media', async () => {
    expect(await render({ kind: 'photo' })).toContain('data-media="photo"');
    expect(await render({ kind: 'screenshot' })).toContain('data-media="screenshot"');
  });

  it('puts the image in a body element rather than loose in the figure', async () => {
    const html = await render({});
    const body = html.indexOf('media__body');
    expect(body).toBeGreaterThan(-1);
    expect(html.indexOf('arduino.hash.jpg')).toBeGreaterThan(body);
  });

  it('renders a caption only when one is supplied', async () => {
    expect(await render({})).not.toContain('media__caption');
    const captioned = await render({ caption: 'Alice wiring the board.' });
    expect(captioned).toContain('media__caption');
    expect(captioned).toContain('Alice wiring the board.');
  });

  it('keeps the alt text on the image, never on the caption', async () => {
    const html = await render({ caption: 'A caption is not alt text.' });
    expect(html).toContain('alt="Arduino project close-up"');
    expect(html).toContain('A caption is not alt text.');
  });

  // The layout axis is the EXISTING primitive. `.media--wide` never appears —
  // the breakout is ADR 0006-governed and already tested at 60rem.
  it('opts into the existing breakout primitive, and never invents a wide class', async () => {
    expect(await render({})).not.toContain('breakout');
    const wide = await render({ breakout: true });
    expect(wide).toContain('breakout');
    expect(wide).not.toContain('media--wide');
  });

  // The constrained case is what the one published Post using this component
  // renders. Its candidates and `sizes` must not move.
  it('preserves the constrained image sizing exactly', async () => {
    expect(await render({})).toContain('sizes="min(34rem, calc(100vw - 2.5rem))"');
  });

  it('asks for wider candidates when it breaks out', async () => {
    expect(await render({ breakout: true })).toContain('sizes="min(60rem, calc(100vw - 2rem))"');
  });

  // The retired vocabulary. #114 retires the image-layout attribute into
  // `data-media`; this component is the first to complete that move, and the
  // assertion migrates with it rather than being deleted.
  it('no longer emits the retired image-layout attribute', async () => {
    expect(await render({})).not.toContain('data-image-layout');
  });
});
