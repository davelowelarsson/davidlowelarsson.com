import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ScrollProcessRail from './ScrollProcessRail.astro';

describe('ScrollProcessRail', () => {
  const steps = [
    { id: 'fetch-slack', label: 'Fetch Slack messages', hint: 'Read channel posts for the day' },
    { id: 'diff', label: 'Compute diff' },
    { id: 'add-spotify', label: 'Add missing songs' },
  ];

  it('renders rail metadata and all steps', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ScrollProcessRail, {
      props: {
        config: {
          id: 'spotify-sync',
          title: 'How one run works',
          steps,
        },
      },
      slots: {
        default: '<section data-process-step="fetch-slack"><h3>Fetch</h3></section>',
      },
    });

    expect(html).toContain('data-process-rail-id="spotify-sync"');
    expect(html).toContain('How one run works');
    expect(html).toContain('data-process-step-id="fetch-slack"');
    expect(html).toContain('data-process-step-id="diff"');
    expect(html).toContain('data-process-step-id="add-spotify"');
  });

  it('marks the first step active by default', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ScrollProcessRail, {
      props: { config: { id: 'spotify-sync', steps } },
      slots: {
        default: '<section data-process-step="fetch-slack"><h3>Fetch</h3></section>',
      },
    });

    expect(html).toContain('data-process-active-step="fetch-slack"');
    expect(html).toContain('data-process-active="true"');
  });
});
