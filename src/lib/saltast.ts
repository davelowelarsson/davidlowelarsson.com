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
  /** Normalized to ms since epoch. */
  checkedAt: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * saltast may send `checkedAt` in seconds or milliseconds — normalize to ms.
 * Anything below 1e12 is treated as seconds (1e12 ms ≈ year 33658; unix
 * seconds won't reach it for millennia, so the split is unambiguous).
 */
export function normalizeCheckedAt(value: number): number {
  return value < 1e12 ? value * 1000 : value;
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
    checkedAt: isFiniteNumber(d.checkedAt) ? normalizeCheckedAt(d.checkedAt) : Number.NaN,
  };
}

/** Footer: a compact one-glance tally. */
export function formatCompact(summary: ExperimentSummary): string {
  return `${summary.total} experiment${summary.total === 1 ? '' : 's'} · ${summary.up} up`;
}

/** Experiments page: fuller breakdown, omitting empty buckets to stay calm. */
export function formatTally(summary: ExperimentSummary): string {
  const parts = [`${summary.up} up`];
  if (summary.down > 0) parts.push(`${summary.down} down`);
  if (summary.unknown > 0) parts.push(`${summary.unknown} unknown`);
  return parts.join(' · ');
}
