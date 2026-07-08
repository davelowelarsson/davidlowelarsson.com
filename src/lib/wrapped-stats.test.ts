import { describe, expect, it } from 'vitest';
import { parseWrappedStats } from './wrapped-stats';

describe('parseWrappedStats', () => {
  it('accepts anonymized yearly wrapped stats', () => {
    const parsed = parseWrappedStats({
      years: [
        {
          year: 2024,
          playlist: 'Fredagslistan 2024',
          tracks: 55,
          top_genres: ['swedish pop'],
          top_artists: ['kent'],
          contributors: 25,
          slack_shares: 1145,
        },
      ],
      totals: {
        years_covered: 1,
        total_tracks: 55,
        total_slack_shares: 1145,
        peak_year_contributors: 25,
        biggest_year_tracks: 55,
      },
    });

    expect(parsed.years[0]?.top_genres).toEqual(['swedish pop']);
    expect(parsed.totals.total_slack_shares).toBe(1145);
  });

  it('rejects empty year sets', () => {
    expect(() =>
      parseWrappedStats({
        years: [],
        totals: {
          years_covered: 0,
          total_tracks: 0,
          total_slack_shares: 0,
          peak_year_contributors: 0,
          biggest_year_tracks: 0,
        },
      }),
    ).toThrow();
  });
});
