import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { parseProcessRailConfig } from '../lib/process-rail';
import ProcessStepCard from './ProcessStepCard.astro';

describe('ProcessStepCard', () => {
  const config = parseProcessRailConfig({
    id: 'spotify-sync',
    steps: [
      {
        id: 'fetch-slack',
        label: 'Fetch Slack links',
        system: 'slack',
        sample: {
          operation: 'Extract track IDs from channel links',
          left: ['open.spotify.com/track/abc · First track'],
          result: ['track:abc'],
        },
      },
      {
        id: 'diff',
        label: 'Compute what Spotify is missing',
        hint: 'Only the gap moves forward.',
        system: 'diff',
        sample: {
          operation: 'missing = slack_ids - playlist_ids',
          leftLabel: 'Slack IDs',
          left: ['a', 'b'],
          rightLabel: 'Playlist IDs',
          right: ['b'],
          resultLabel: 'Diff (to add)',
          result: ['a'],
        },
      },
      {
        id: 'add-spotify',
        label: 'Add missing songs',
        system: 'spotify',
        sample: {
          operation: 'POST /playlist/tracks with diff IDs',
          left: ['track:abc'],
          result: ['302 · First track'],
        },
      },
    ],
  });

  const step = config.steps[1];

  it('renders a single inline explanation card for one process step', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProcessStepCard, {
      props: { step },
    });

    expect(html).toContain('data-process-step-card-id="diff"');
    expect(html).toContain('Compute what Spotify is missing');
    expect(html).toContain('missing = slack_ids - playlist_ids');
    expect(html).toContain('Slack IDs');
    expect(html).toContain('Diff (to add)');
  });

  it('does not ship a scroll observer or floating rail state', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProcessStepCard, {
      props: { step },
    });

    expect(html).not.toContain('IntersectionObserver');
    expect(html).not.toContain('data-process-floating');
    expect(html).not.toContain('data-process-active-step');
  });

  it('renders local brand marks and cleaned UI-style surfaces for Slack and Spotify steps', async () => {
    const container = await AstroContainer.create();
    const slackHtml = await container.renderToString(ProcessStepCard, {
      props: { step: config.steps[0] },
    });
    const spotifyHtml = await container.renderToString(ProcessStepCard, {
      props: { step: config.steps[2] },
    });

    expect(slackHtml).toContain('data-brand-mark="slack"');
    expect(slackHtml).toContain('Anonymized Slack message preview');
    expect(slackHtml).toContain('person 1');
    expect(spotifyHtml).toContain('data-brand-mark="spotify"');
    expect(spotifyHtml).toContain('Anonymized Spotify playlist preview');
    expect(spotifyHtml).toContain('auto-added from Slack');
  });
});
