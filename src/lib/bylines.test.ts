import { describe, expect, it } from 'vitest';
import { BYLINES, pickByline } from './bylines';

describe('BYLINES', () => {
  it('keeps the original byline first (canonical, server-rendered)', () => {
    expect(BYLINES[0]).toBe('a notebook about how software gets made');
  });

  it('offers around ten distinct options to rotate through', () => {
    expect(BYLINES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(BYLINES).size).toBe(BYLINES.length);
  });

  it('has no empty entries', () => {
    for (const byline of BYLINES) {
      expect(byline.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('pickByline', () => {
  const sample = ['a', 'b', 'c', 'd'] as const;

  it('returns the first entry at random = 0', () => {
    expect(pickByline(sample, 0)).toBe('a');
  });

  it('returns the last entry as random approaches 1', () => {
    expect(pickByline(sample, 0.999)).toBe('d');
  });

  it('maps evenly across the range', () => {
    expect(pickByline(sample, 0.25)).toBe('b');
    expect(pickByline(sample, 0.5)).toBe('c');
    expect(pickByline(sample, 0.75)).toBe('d');
  });

  it('clamps an edge value of exactly 1 instead of indexing out of bounds', () => {
    expect(pickByline(sample, 1)).toBe('d');
  });
});
