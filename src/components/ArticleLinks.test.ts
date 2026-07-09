import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ArticleLinks from './ArticleLinks.astro';

describe('ArticleLinks', () => {
  it('renders a standardized list of important article links', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ArticleLinks, {
      props: {
        links: [
          {
            label: 'Source repository',
            href: 'https://github.com/davelowelarsson/spotify-slack-sync-fredagslistan',
            description: 'Python cronjob that syncs Slack track shares into Spotify.',
          },
        ],
      },
    });

    expect(html).toContain('Main links');
    expect(html).toContain('Source repository');
    expect(html).toContain('spotify-slack-sync-fredagslistan');
    expect(html).toContain('Python cronjob that syncs Slack track shares into Spotify.');
  });

  it('marks external links safely', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ArticleLinks, {
      props: {
        links: [{ label: 'Source repository', href: 'https://github.com/example/repo' }],
      },
    });

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
  });
});
