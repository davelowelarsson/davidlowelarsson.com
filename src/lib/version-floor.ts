/**
 * Just enough semver to answer one question honestly: is this resolved version
 * at or above a security floor?
 *
 * The naive form of this (split on '-', take the numbers) gets the two cases
 * that matter here exactly backwards: it reads `7.29.0-alpha.1` as equal to
 * `7.29.0`, so a prerelease that *precedes* the patched release passes the
 * floor, and it turns build metadata into NaN. Both are silent failures in a
 * check whose whole job is to not fail silently — hence a real comparator.
 */

type Parsed = { release: number[]; prerelease: string[] };

/** Split a version into release numbers and prerelease identifiers, dropping build metadata. */
export function parseVersion(version: string): Parsed {
  const withoutBuild = version.trim().replace(/\+.*$/, '');
  const firstDash = withoutBuild.indexOf('-');
  const releasePart = firstDash === -1 ? withoutBuild : withoutBuild.slice(0, firstDash);
  const prereleasePart = firstDash === -1 ? '' : withoutBuild.slice(firstDash + 1);
  return {
    release: releasePart.split('.').map((part) => Number.parseInt(part, 10) || 0),
    prerelease: prereleasePart === '' ? [] : prereleasePart.split('.'),
  };
}

/** Compare prerelease identifier lists per semver §11: numeric < alphanumeric, more fields wins. */
function comparePrerelease(a: string[], b: string[]): number {
  // No prerelease outranks any prerelease: 1.0.0 > 1.0.0-rc.1.
  if (a.length === 0 && b.length === 0) return 0;
  if (a.length === 0) return 1;
  if (b.length === 0) return -1;

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const [left, right] = [a[i], b[i]];
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    const [leftNumeric, rightNumeric] = [/^\d+$/.test(left), /^\d+$/.test(right)];
    if (leftNumeric && rightNumeric) {
      const diff = Number(left) - Number(right);
      if (diff !== 0) return diff < 0 ? -1 : 1;
    } else if (leftNumeric !== rightNumeric) {
      return leftNumeric ? -1 : 1;
    } else if (left !== right) {
      return left < right ? -1 : 1;
    }
  }
  return 0;
}

/** Negative if `a` precedes `b`, positive if it follows, zero if equivalent. */
export function compareVersions(a: string, b: string): number {
  const [left, right] = [parseVersion(a), parseVersion(b)];
  for (let i = 0; i < Math.max(left.release.length, right.release.length); i++) {
    const diff = (left.release[i] ?? 0) - (right.release[i] ?? 0);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  return comparePrerelease(left.prerelease, right.prerelease);
}

/** True when `version` is at or above `floor`. Prereleases of `floor` are below it. */
export function meetsFloor(version: string, floor: string): boolean {
  return compareVersions(version, floor) >= 0;
}
