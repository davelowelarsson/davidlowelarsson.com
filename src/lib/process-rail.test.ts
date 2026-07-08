import { describe, expect, it } from 'vitest';
import { parseProcessRailConfig } from './process-rail';

describe('parseProcessRailConfig', () => {
  it('accepts a valid config and normalizes optional fields', () => {
    const parsed = parseProcessRailConfig({
      id: 'spotify-sync',
      title: 'Friday sync flow',
      steps: [
        { id: 'fetch-slack', label: 'Fetch Slack messages' },
        { id: 'diff', label: 'Compute missing tracks', hint: 'Only add what is missing' },
      ],
    });

    expect(parsed.id).toBe('spotify-sync');
    expect(parsed.steps).toHaveLength(2);
    expect(parsed.steps[0]?.hint).toBeUndefined();
    expect(parsed.steps[1]?.hint).toBe('Only add what is missing');
  });

  it('rejects duplicate step ids', () => {
    expect(() =>
      parseProcessRailConfig({
        id: 'spotify-sync',
        steps: [
          { id: 'fetch-slack', label: 'Fetch Slack messages' },
          { id: 'fetch-slack', label: 'Duplicate id' },
        ],
      }),
    ).toThrow();
  });

  it('rejects an empty step list', () => {
    expect(() => parseProcessRailConfig({ id: 'spotify-sync', steps: [] })).toThrow();
  });
});
