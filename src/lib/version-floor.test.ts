import { describe, expect, it } from 'vitest';
import { compareVersions, meetsFloor, parseVersion } from './version-floor';

describe('parseVersion', () => {
  it('splits release numbers from prerelease identifiers', () => {
    expect(parseVersion('7.29.0')).toEqual({ release: [7, 29, 0], prerelease: [] });
    expect(parseVersion('7.29.0-alpha.1')).toEqual({
      release: [7, 29, 0],
      prerelease: ['alpha', '1'],
    });
  });

  it('drops build metadata, which carries no ordering', () => {
    expect(parseVersion('7.29.0+20260806')).toEqual({ release: [7, 29, 0], prerelease: [] });
    expect(parseVersion('7.29.0-rc.1+sha.abc')).toEqual({
      release: [7, 29, 0],
      prerelease: ['rc', '1'],
    });
  });
});

describe('compareVersions', () => {
  it('orders by release numbers first', () => {
    expect(compareVersions('7.29.0', '7.28.0')).toBeGreaterThan(0);
    expect(compareVersions('7.28.0', '7.29.0')).toBeLessThan(0);
    expect(compareVersions('8.0.0', '7.29.0')).toBeGreaterThan(0);
    expect(compareVersions('7.29.0', '7.29.0')).toBe(0);
  });

  it('ranks a prerelease BELOW its own release', () => {
    // The bug this whole module exists to prevent: 7.29.0-alpha.1 precedes
    // 7.29.0, so it does NOT clear a 7.29.0 security floor.
    expect(compareVersions('7.29.0-alpha.1', '7.29.0')).toBeLessThan(0);
    expect(compareVersions('7.29.0-rc.1', '7.29.0')).toBeLessThan(0);
    expect(compareVersions('7.29.0', '7.29.0-rc.1')).toBeGreaterThan(0);
  });

  it('orders prerelease identifiers per semver', () => {
    expect(compareVersions('7.29.0-alpha.1', '7.29.0-alpha.2')).toBeLessThan(0);
    expect(compareVersions('7.29.0-alpha', '7.29.0-beta')).toBeLessThan(0);
    // Numeric identifiers rank below alphanumeric ones.
    expect(compareVersions('7.29.0-1', '7.29.0-alpha')).toBeLessThan(0);
    // A larger identifier set wins when all preceding fields match.
    expect(compareVersions('7.29.0-alpha', '7.29.0-alpha.1')).toBeLessThan(0);
  });

  it('ignores build metadata when ordering', () => {
    expect(compareVersions('7.29.0+build.1', '7.29.0')).toBe(0);
    expect(compareVersions('7.29.0+build.1', '7.28.0')).toBeGreaterThan(0);
  });

  it('treats a missing patch segment as zero', () => {
    expect(compareVersions('7.29', '7.29.0')).toBe(0);
    expect(compareVersions('7.30', '7.29.9')).toBeGreaterThan(0);
  });
});

describe('meetsFloor', () => {
  it('accepts the floor itself and anything after it', () => {
    expect(meetsFloor('7.29.0', '7.29.0')).toBe(true);
    expect(meetsFloor('7.29.1', '7.29.0')).toBe(true);
    expect(meetsFloor('8.0.0', '7.29.0')).toBe(true);
  });

  it('rejects anything before the floor, prereleases of it included', () => {
    expect(meetsFloor('7.28.0', '7.29.0')).toBe(false);
    expect(meetsFloor('7.29.0-alpha.1', '7.29.0')).toBe(false);
    expect(meetsFloor('7.29.0-rc.1', '7.29.0')).toBe(false);
  });
});
