import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { parseWrappedStats } from '../lib/wrapped-stats';
import WrappedSnapshot from './WrappedSnapshot.astro';

const stats = parseWrappedStats({
  years: [
    {
      year: 2024,
      playlist: 'Fredagslistan 2024',
      tracks: 55,
      top_genres: ['swedish pop', 'underground hip hop'],
      top_artists: ['kent', 'Petter'],
      contributors: 25,
      slack_shares: 1145,
    },
    {
      year: 2025,
      playlist: 'Fredagslistan 2024-25',
      tracks: 1284,
      top_genres: ['swedish pop', 'dansband'],
      top_artists: ['Bob Dylan', 'Hakan Hellstrom'],
      contributors: 21,
      slack_shares: 462,
      caveat: 'spans more than one calendar year',
    },
  ],
  totals: {
    years_covered: 2,
    total_tracks: 1339,
    total_slack_shares: 1607,
    peak_year_contributors: 25,
    biggest_year_tracks: 1284,
  },
});

describe('WrappedSnapshot', () => {
  it('renders aggregate wrapped stats without contributor names', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(WrappedSnapshot, {
      props: { stats },
    });

    expect(html).toContain('Fredagslistan wrapped, carefully');
    expect(html).toContain('1,607');
    expect(html).toContain('swedish pop');
    expect(html).toContain('spans more than one calendar year');
    expect(html).toContain('data-share-ratio="100"');
    expect(html).not.toContain('top contributors');
  });
});
