import { parseProcessRailConfig } from '../../../../lib/process-rail';

export const syncFlowConfig = parseProcessRailConfig({
  id: 'spotify-slack-sync',
  title: 'One cron run, three boring steps',
  steps: [
    {
      id: 'fetch-slack',
      label: 'Fetch Friday songs from Slack',
      hint: 'Read links and IDs from the channel thread.',
      system: 'slack',
      sample: {
        operation: 'Extract track IDs from channel links',
        leftLabel: 'Slack links',
        left: ['3Oc66...d10', '00syd...4e40', '3ZOEy...b42'],
        resultLabel: 'Parsed track IDs',
        result: ['track:3Oc66...d10', 'track:00syd...4e40', 'track:3ZOEy...b42'],
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
        left: ['3Oc66...d10', '00syd...4e40', '3ZOEy...b42'],
        rightLabel: 'Playlist IDs',
        right: ['3Oc66...d10', '7DGmP...a91'],
        resultLabel: 'Diff (to add)',
        result: ['00syd...4e40', '3ZOEy...b42'],
      },
    },
    {
      id: 'add-spotify',
      label: 'Add missing tracks to playlist',
      hint: 'No duplicates, no manual cleanup.',
      system: 'spotify',
      sample: {
        operation: 'POST /playlist/tracks with diff IDs',
        leftLabel: 'Payload',
        left: ['00syd...4e40', '3ZOEy...b42'],
        resultLabel: 'Playlist tail after write',
        result: ['...existing tracks', '00syd...4e40', '3ZOEy...b42'],
      },
    },
  ],
});

function requireStep(id: string) {
  const step = syncFlowConfig.steps.find((candidate) => candidate.id === id);
  if (!step) throw new Error(`Missing process step: ${id}`);
  return step;
}

export const syncSteps = {
  fetchSlack: requireStep('fetch-slack'),
  diff: requireStep('diff'),
  addSpotify: requireStep('add-spotify'),
};

export const wrappedSnapshot = {
  generatedAt: '2026-07-08',
  totals: {
    runs: 524,
    autoAddedTracks: 1839,
    busiestFridayAdds: 22,
    longestThemeStreakWeeks: 17,
  },
} as const;
