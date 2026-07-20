import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const chart = readFileSync(new URL('./metr-productivity-estimates.svg', import.meta.url), 'utf8');

function coordinate(label: string, axis: 'x' | 'y'): number {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = chart.match(new RegExp(`<text[^>]*\\b${axis}="([0-9.]+)"[^>]*>${escaped}</text>`));
  if (!match) throw new Error(`No ${axis} coordinate found for "${label}"`);
  return Number(match[1]);
}

describe('METR productivity estimates chart', () => {
  it('states the study periods, cohorts, estimates, and confidence intervals', () => {
    for (const fact of [
      'Initial study',
      'Feb-Jun 2025',
      '16 developers, 246 tasks',
      '19% slower',
      '95% CI: 2% to 39% slower',
      'Follow-up, repeat participants',
      'Follow-up, new participants',
      'Aug 2025-Feb 2026',
      '10 developers, 137 tasks',
      '18% faster',
      '95% CI: 38% faster to 9% slower',
      '47 developers, 690 tasks',
      '4% faster',
      '95% CI: 15% faster to 9% slower',
    ]) {
      expect(chart).toContain(fact);
    }

    expect(chart).not.toContain('Late 2025');
  });

  it('reads chronologically top to bottom and from slower to faster left to right', () => {
    expect(chart).toContain('Studies run top to bottom; faster outcomes point right');

    expect(coordinate('Initial study', 'y')).toBeLessThan(
      coordinate('Follow-up, repeat participants', 'y'),
    );
    expect(coordinate('Follow-up, repeat participants', 'y')).toBeLessThan(
      coordinate('Follow-up, new participants', 'y'),
    );

    expect(coordinate('40% slower', 'x')).toBeLessThan(coordinate('No change', 'x'));
    expect(coordinate('No change', 'x')).toBeLessThan(coordinate('40% faster', 'x'));
    expect(coordinate('19% slower', 'x')).toBeLessThan(coordinate('No change', 'x'));
    expect(coordinate('18% faster', 'x')).toBeGreaterThan(coordinate('No change', 'x'));
    expect(coordinate('4% faster', 'x')).toBeGreaterThan(coordinate('No change', 'x'));
  });
});
