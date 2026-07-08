/**
 * saltast.com is where David hosts his experiments — a live dashboard with a
 * public `GET /api/summary` endpoint returning the tally. This site links to it
 * and, as a progressive enhancement, shows the current status inline once the
 * client script has fetched it (issue: experiment count). The pure helpers here
 * (validate + format) are unit-tested; the fetch + DOM live in a bundled script.
 */
export const SALTAST_URL = 'https://saltast.com';
export const SALTAST_SUMMARY_URL = `${SALTAST_URL}/api/summary`;

export interface ExperimentSummary {
  total: number;
  up: number;
  down: number;
  unknown: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Validate the `/api/summary` shape. Returns null on anything unexpected so a
 * bad payload degrades to "offline" in the UI rather than throwing.
 */
export function parseSummary(data: unknown): ExperimentSummary | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (
    !isFiniteNumber(d.total) ||
    !isFiniteNumber(d.up) ||
    !isFiniteNumber(d.down) ||
    !isFiniteNumber(d.unknown)
  ) {
    return null;
  }
  return {
    total: d.total,
    up: d.up,
    down: d.down,
    unknown: d.unknown,
  };
}

export type StatKey = 'up' | 'down' | 'unknown';

/**
 * The non-empty status buckets in a stable order (up, down, unknown) — the
 * client renders each as a colored dot + label. Structured rather than a
 * formatted string so the coloring lives in CSS and this stays unit-testable.
 */
export function experimentStats(
  summary: ExperimentSummary,
): Array<{ key: StatKey; count: number }> {
  const keys: StatKey[] = ['up', 'down', 'unknown'];
  return keys.map((key) => ({ key, count: summary[key] })).filter((stat) => stat.count > 0);
}

/** "4 experiments" / "1 experiment" — the muted lead above the colored stats. */
export function totalLabel(summary: ExperimentSummary): string {
  return `${summary.total} experiment${summary.total === 1 ? '' : 's'}`;
}
