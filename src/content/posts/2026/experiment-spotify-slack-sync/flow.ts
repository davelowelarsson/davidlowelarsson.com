import { parseProcessRailConfig } from '../../../../lib/process-rail';
import { parseWrappedStats } from '../../../../lib/wrapped-stats';

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
        left: [
          'open.spotify.com/track/3Oc66...d10 · I’m In The Band',
          'open.spotify.com/track/00syd...4e40 · Search and Destroy',
          'open.spotify.com/track/3ZOEy...b42 · Can’t Stop',
        ],
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
        result: ['302 · I’m In The Band', '303 · Search and Destroy', '304 · Can’t Stop'],
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

export const wrappedStats = parseWrappedStats({
  years: [
    {
      year: 2024,
      playlist: 'Fredagslistan! 2024!',
      tracks: 55,
      top_genres: [
        'swedish pop',
        'underground hip hop',
        'hardcore hip hop',
        'stoner rock',
        'stoner metal',
      ],
      top_artists: [
        'The Tallest Man On Earth',
        'Petter',
        'Queens of the Stone Age',
        'Thirty Seconds To Mars',
        'kent',
      ],
      contributors: 25,
      slack_shares: 1145,
    },
    {
      year: 2025,
      playlist: 'Fredagslistan ! 2024-25 !',
      tracks: 1284,
      top_genres: ['swedish pop', 'dansband', 'classic rock', 'metal', 'punk'],
      top_artists: ['Bob Dylan', 'Håkan Hellström', 'In Flames', 'BTS', 'Hofmästarn'],
      contributors: 21,
      slack_shares: 462,
      caveat: 'playlist spans more than one calendar year, so tracks are context, not a race',
    },
    {
      year: 2026,
      playlist: 'Fredagslistan 2026 🎶',
      tracks: 311,
      top_genres: ['swedish pop', 'rock', 'classic rock', 'punk', 'proto-punk'],
      top_artists: ['Robyn', 'Bob Dylan', 'kent', 'Galenskaparna & After Shave', 'Rihanna'],
      contributors: 20,
      slack_shares: 367,
    },
  ],
  totals: {
    years_covered: 3,
    total_tracks: 1650,
    total_slack_shares: 1974,
    peak_year_contributors: 25,
    biggest_year_tracks: 1284,
  },
});
