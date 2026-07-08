import { describe, expect, it } from 'vitest';
import {
  type ExperimentSummary,
  formatCompact,
  formatTally,
  normalizeCheckedAt,
  parseSummary,
} from './saltast';

const summary = (overrides: Partial<ExperimentSummary> = {}): ExperimentSummary => ({
  total: 7,
  up: 5,
  down: 1,
  unknown: 1,
  checkedAt: 1_751_000_000_000,
  ...overrides,
});

describe('normalizeCheckedAt', () => {
  it('passes milliseconds through', () => {
    expect(normalizeCheckedAt(1_751_000_000_000)).toBe(1_751_000_000_000);
  });

  it('scales seconds up to milliseconds', () => {
    expect(normalizeCheckedAt(1_751_000_000)).toBe(1_751_000_000_000);
  });
});

describe('parseSummary', () => {
  it('accepts a well-formed payload and normalizes checkedAt', () => {
    expect(
      parseSummary({ total: 7, up: 5, down: 1, unknown: 1, checkedAt: 1_751_000_000 }),
    ).toEqual({ total: 7, up: 5, down: 1, unknown: 1, checkedAt: 1_751_000_000_000 });
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

  it('tolerates a missing checkedAt (→ NaN, UI omits the "as of")', () => {
    const parsed = parseSummary({ total: 1, up: 1, down: 0, unknown: 0 });
    expect(parsed?.total).toBe(1);
    expect(Number.isNaN(parsed?.checkedAt)).toBe(true);
  });
});

describe('formatCompact', () => {
  it('summarizes total + up, pluralized', () => {
    expect(formatCompact(summary())).toBe('7 experiments · 5 up');
    expect(formatCompact(summary({ total: 1, up: 1, down: 0, unknown: 0 }))).toBe(
      '1 experiment · 1 up',
    );
  });
});

describe('formatTally', () => {
  it('lists every non-empty bucket', () => {
    expect(formatTally(summary())).toBe('5 up · 1 down · 1 unknown');
  });

  it('omits empty buckets to stay calm', () => {
    expect(formatTally(summary({ total: 5, up: 5, down: 0, unknown: 0 }))).toBe('5 up');
    expect(formatTally(summary({ total: 6, up: 5, down: 1, unknown: 0 }))).toBe('5 up · 1 down');
  });
});
