import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const chart = readFileSync(new URL('./metr-productivity-estimates.svg', import.meta.url), 'utf8');

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
});
