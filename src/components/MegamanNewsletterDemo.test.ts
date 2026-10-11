import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import MegamanNewsletterDemo from './MegamanNewsletterDemo.astro';

async function render(props: Record<string, unknown> = {}) {
  const container = await AstroContainer.create();
  return container.renderToString(MegamanNewsletterDemo, { props });
}

describe('MegamanNewsletterDemo', () => {
  it('emits the figure contract under the embed kind', async () => {
    const html = await render();

    expect(html).toMatch(/<figure[^>]*class="[^"]*\bmedia\b/);
    expect(html).toContain('data-media="embed"');
    expect(html).toContain('media__body');
    expect(html).toContain('<figcaption');
  });

  it('renders a labelled email input with the original placeholder and an Ok button', async () => {
    const html = await render();

    expect(html).toMatch(/<label[^>]*>[\s\S]*<input[^>]*type="email"/);
    expect(html).toContain('placeholder="Nyhetsbrev ..."');
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>\s*Ok\s*<\/button>/);
  });

  it('references both sprites and starts still', async () => {
    const html = await render();

    expect(html).toContain('megaman-still');
    expect(html).toContain('megaman-rocking');
    expect(html).toContain('data-rocking="false"');
  });

  it('keeps the GIF as a GIF rather than routing it through the image pipeline', async () => {
    const html = await render();

    expect(html).toMatch(/megaman-rocking[^"')]*\.gif/);
    expect(html).not.toContain('/_image');
    expect(html).not.toContain('.webp');
  });

  it('has no external URL, no action, and nothing a submit could serialise', async () => {
    const html = await render();

    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toMatch(/<form[^>]*\saction=/);
    expect(html).not.toMatch(/<input[^>]*\sname=/);
  });

  it('says it is a recreation and sends nothing', async () => {
    const html = await render();

    expect(html).toContain('A recreation. Nothing is sent anywhere.');
  });

  it('credits the GIF, and adds the caption before the credit when one is given', async () => {
    const plain = await render();
    expect(plain).toContain('MegaMan rocking GIF by MegamanMaster64');

    const captioned = await render({ caption: 'The old signup, rebuilt.' });
    expect(captioned).toContain('The old signup, rebuilt.');
    expect(captioned).toContain('MegaMan rocking GIF by MegamanMaster64');
    expect(captioned.indexOf('The old signup, rebuilt.')).toBeLessThan(
      captioned.indexOf('MegaMan rocking GIF by MegamanMaster64'),
    );
  });

  it('hides the sprites from assistive technology', async () => {
    const html = await render();

    expect(html).toMatch(/class="[^"]*megaman-demo__sprite[^"]*"[^>]*aria-hidden="true"/);
  });

  it('scopes behaviour by element, with no ids to collide on a page with two demos', async () => {
    const html = await render();

    expect(html).toContain('data-megaman-demo');
    expect(html).not.toMatch(/\sid="/);
  });
});
