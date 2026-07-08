import { z } from 'astro/zod';

const wrappedYearSchema = z.object({
  year: z.number().int().min(2000),
  playlist: z.string().min(1),
  tracks: z.number().int().nonnegative(),
  top_genres: z.array(z.string().min(1)).min(1),
  top_artists: z.array(z.string().min(1)).min(1),
  contributors: z.number().int().nonnegative(),
  slack_shares: z.number().int().nonnegative(),
  note: z.string().min(1).optional(),
  caveat: z.string().min(1).optional(),
});

export const wrappedStatsSchema = z.object({
  years: z.array(wrappedYearSchema).min(1),
  totals: z.object({
    years_covered: z.number().int().positive(),
    total_tracks: z.number().int().nonnegative(),
    total_slack_shares: z.number().int().nonnegative(),
    peak_year_contributors: z.number().int().nonnegative(),
    biggest_year_tracks: z.number().int().nonnegative(),
  }),
});

export type WrappedStats = z.infer<typeof wrappedStatsSchema>;
export type WrappedYear = WrappedStats['years'][number];

export function parseWrappedStats(input: unknown): WrappedStats {
  return wrappedStatsSchema.parse(input);
}
