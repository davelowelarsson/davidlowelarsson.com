import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { meetsFloor } from './version-floor';

// `miniflare` (via `wrangler`) pins `undici` to an EXACT version, so when an
// undici advisory lands, npm's only resolution path is to walk `wrangler`
// backwards — which is why Dependabot's security job errored out daily instead
// of opening a PR (see docs/adr/0008). We hold undici forward with an override
// scoped to the wrangler subtree. This test is the tripwire: if the override is
// ever dropped, or a transitive bump reintroduces a version below the advisory
// floor, it fails here rather than in a red Dependabot run nobody reads.

/** Lowest undici release with no known advisory against it (GHSA-8xcm-r25x-g524 et al). */
const UNDICI_ADVISORY_FLOOR = '7.29.0';

function packageJson() {
  return JSON.parse(readFileSync('package.json', 'utf8'));
}

/** The override range as declared, e.g. "^7.29.0". */
function declaredOverride(): string | undefined {
  return packageJson().overrides?.wrangler?.undici;
}

/** Every `undici` version the lockfile actually resolves, keyed by tree path. */
function resolvedUndiciVersions(): Array<[string, string]> {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  return Object.entries(lock.packages as Record<string, { version?: string }>)
    .filter(([path]) => path.endsWith('node_modules/undici'))
    .map(([path, meta]) => [path, meta.version ?? ''] as [string, string]);
}

describe('undici override', () => {
  it('is declared under the wrangler subtree', () => {
    expect(
      declaredOverride(),
      'overrides.wrangler.undici was removed — Dependabot security runs will start failing again',
    ).toBeDefined();
  });

  it('declares a floor at or above the advisory floor', () => {
    const bare = String(declaredOverride() ?? '').replace(/^[\^~>=\s]+/, '');
    expect(meetsFloor(bare, UNDICI_ADVISORY_FLOOR)).toBe(true);
  });

  it('stays inside undici 7 rather than opening the door to a major bump', () => {
    // miniflare pins undici exactly; holding it forward is already a liberty.
    // Letting the range drift into 8.x would be a different, larger bet.
    expect(String(declaredOverride() ?? '')).toMatch(/^\^7\./);
  });

  it('resolves every undici in the lockfile at or above the advisory floor', () => {
    const resolved = resolvedUndiciVersions();
    expect(resolved.length, 'no undici in the lockfile — has wrangler dropped it?').toBeGreaterThan(
      0,
    );
    for (const [path, version] of resolved) {
      expect(
        meetsFloor(version, UNDICI_ADVISORY_FLOOR),
        `${path} resolves undici@${version}, below the ${UNDICI_ADVISORY_FLOOR} advisory floor`,
      ).toBe(true);
    }
  });
});
