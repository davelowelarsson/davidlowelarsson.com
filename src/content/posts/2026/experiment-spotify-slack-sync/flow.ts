import { parseProcessRailConfig } from '../../../../lib/process-rail';

export const syncFlowConfig = parseProcessRailConfig({
  id: 'spotify-slack-sync',
  title: 'One cron run, three boring steps',
  steps: [
    {
      id: 'fetch-slack',
      label: 'Fetch Friday songs from Slack',
      hint: 'Read links and IDs from the channel thread.',
    },
    {
      id: 'diff',
      label: 'Compute what Spotify is missing',
      hint: 'Only the gap moves forward.',
    },
    {
      id: 'add-spotify',
      label: 'Add missing tracks to playlist',
      hint: 'No duplicates, no manual cleanup.',
    },
  ],
});

export const wrappedSnapshot = {
  generatedAt: '2026-07-08',
  totals: {
    runs: 524,
    autoAddedTracks: 1839,
    busiestFridayAdds: 22,
    longestThemeStreakWeeks: 17,
  },
} as const;
