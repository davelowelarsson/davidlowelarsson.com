import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Teaser from './Teaser.astro';

describe('Teaser', () => {
  it('renders the post title', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Teaser, {
      props: { title: 'A Post From The Future', liveFrom: '2099-03-05' },
    });

    expect(html).toContain('A Post From The Future');
  });

  it('uses soft "expected" wording, never a promise', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Teaser, {
      props: { title: 'Anything', liveFrom: '2099-03-05' },
    });

    expect(html).toContain('expected');
  });

  it('shows the formatted go-live date', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Teaser, {
      props: { title: 'Anything', liveFrom: '2099-03-05' },
    });

    expect(html).toContain('Mar 5');
  });

  it('marks the schedule with the badge-scheduled class', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Teaser, {
      props: { title: 'Anything', liveFrom: '2099-03-05' },
    });

    expect(html).toContain('badge-scheduled');
  });

  it('links home and to the posts index, like the 404 page', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Teaser, {
      props: { title: 'Anything', liveFrom: '2099-03-05' },
    });

    expect(html).toContain('href="/"');
    expect(html).toContain('href="/posts/"');
  });
});
