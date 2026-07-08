import { describe, expect, it } from 'vitest';
import { type ExperimentSummary, experimentStats, parseSummary, totalLabel } from './saltast';

const summary = (overrides: Partial<ExperimentSummary> = {}): ExperimentSummary => ({
  total: 7,
  up: 5,
  down: 1,
  unknown: 1,
  ...overrides,
});

describe('parseSummary', () => {
  it('accepts a well-formed payload', () => {
    expect(parseSummary({ total: 7, up: 5, down: 1, unknown: 1 })).toEqual({
      total: 7,
      up: 5,
      down: 1,
      unknown: 1,
    });
  });

  it('ignores extra fields like checkedAt', () => {
    expect(
      parseSummary({ total: 4, up: 2, down: 2, unknown: 0, checkedAt: 1_751_000_000 }),
    ).toEqual({ total: 4, up: 2, down: 2, unknown: 0 });
  });

  it('rejects a missing or non-numeric field', () => {
    expect(parseSummary({ total: 7, up: 5, down: 1 })).toBeNull();
    expect(parseSummary({ total: '7', up: 5, down: 1, unknown: 1 })).toBeNull();
  });

  it('rejects non-objects', () => {
    expect(parseSummary(null)).toBeNull();
    expect(parseSummary('nope')).toBeNull();
    expect(parseSummary(undefined)).toBeNull();
  });
});

describe('totalLabel', () => {
  it('pluralizes the total', () => {
    expect(totalLabel(summary())).toBe('7 experiments');
    expect(totalLabel(summary({ total: 1, up: 1, down: 0, unknown: 0 }))).toBe('1 experiment');
    expect(totalLabel(summary({ total: 0, up: 0, down: 0, unknown: 0 }))).toBe('0 experiments');
  });
});

describe('experimentStats', () => {
  it('returns non-empty buckets in up/down/unknown order', () => {
    expect(experimentStats(summary())).toEqual([
      { key: 'up', count: 5 },
      { key: 'down', count: 1 },
      { key: 'unknown', count: 1 },
    ]);
  });

  it('omits empty buckets so nothing colorless is rendered', () => {
    expect(experimentStats(summary({ total: 5, up: 5, down: 0, unknown: 0 }))).toEqual([
      { key: 'up', count: 5 },
    ]);
    expect(experimentStats(summary({ total: 3, up: 2, down: 1, unknown: 0 }))).toEqual([
      { key: 'up', count: 2 },
      { key: 'down', count: 1 },
    ]);
  });
});
