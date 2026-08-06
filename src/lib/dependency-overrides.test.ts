import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// `miniflare` (via `wrangler`) pins `undici` to an EXACT version, so when an
// undici advisory lands, npm's only resolution path is to walk `wrangler`
// backwards — which is why Dependabot's security job errored out daily instead
// of opening a PR (see docs/adr/0008). We hold undici forward with a root
// `overrides` entry instead. This test is the tripwire: if the override is ever
// dropped, or a transitive bump reintroduces a version below the advisory
// floor, it fails here rather than in a red Dependabot run nobody reads.

/** Lowest undici release with no known advisory against it (GHSA-8xcm-r25x-g524 et al). */
const UNDICI_ADVISORY_FLOOR = '7.29.0';

/** Compare two dotted numeric versions. Prerelease tags are ignored. */
function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.split('-')[0].split('.').map(Number);
  const [left, right] = [parse(a), parse(b)];
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function packageJson() {
  return JSON.parse(readFileSync('package.json', 'utf8'));
}

/** Every `undici` version the lockfile actually resolves, keyed by tree path. */
function resolvedUndiciVersions(): Array<[string, string]> {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  return Object.entries(lock.packages as Record<string, { version?: string }>)
    .filter(([path]) => path.endsWith('node_modules/undici'))
    .map(([path, meta]) => [path, meta.version ?? ''] as [string, string]);
}

describe('undici override', () => {
  it('is declared in package.json overrides', () => {
    const override = packageJson().overrides?.undici;
    expect(
      override,
      'root overrides.undici was removed — Dependabot security runs will start failing again',
    ).toBeDefined();
  });

  it('holds the override at or above the advisory floor', () => {
    const override = String(packageJson().overrides?.undici ?? '').replace(/^[\^~>=]+/, '');
    expect(compareVersions(override, UNDICI_ADVISORY_FLOOR)).toBeGreaterThanOrEqual(0);
  });

  it('resolves every undici in the lockfile at or above the advisory floor', () => {
    const resolved = resolvedUndiciVersions();
    expect(resolved.length, 'no undici in the lockfile — has wrangler dropped it?').toBeGreaterThan(
      0,
    );
    for (const [path, version] of resolved) {
      expect(
        compareVersions(version, UNDICI_ADVISORY_FLOOR),
        `${path} resolves undici@${version}, below the ${UNDICI_ADVISORY_FLOOR} advisory floor`,
      ).toBeGreaterThanOrEqual(0);
    }
  });
});
