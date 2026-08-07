import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Guards against accidentally deleting or gutting public/_headers, which is
// how Cloudflare Workers static assets applies security headers at the edge
// (see docs/astro-field-guide.md). This does NOT verify header correctness
// against securityheaders.com — only that the file exists and still
// declares the headers issue #12 asked for.

const headers = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');

// The no-flash theme control (#106, ADR 0010) needs an INLINE classic script
// to run before first paint. That only works because `script-src` still allows
// `'unsafe-inline'` — and nothing connected the two, so tightening the CSP
// would have looked safe: every test stays green, Playwright runs against
// `astro preview` which never applies `_headers`, and the breakage appears
// only in Production as a flash plus three dead theme buttons.
//
// Either the directive stays, or the theme script gets a nonce/hash. This
// fails if someone removes it without doing the second thing.
describe('inline scripts the CSP has to allow', () => {
  const layout = readFileSync(new URL('../layouts/Base.astro', import.meta.url), 'utf8');

  it('keeps script-src compatible with the pre-paint theme script', () => {
    const inlineScripts = layout.match(/<script\b[^>]*\bis:inline\b[^>]*>/g) ?? [];
    const nonced = inlineScripts.every((tag) => /\bnonce=/.test(tag));
    if (nonced) return;

    const scriptSrc = /script-src([^;]*)/.exec(headers)?.[1] ?? '';
    expect(inlineScripts.length, 'expected inline scripts to guard').toBeGreaterThan(0);
    expect(
      scriptSrc,
      'Base.astro has inline scripts but script-src no longer allows them — the theme would flash and its buttons would be inert in Production only',
    ).toContain("'unsafe-inline'");
  });
});

describe('public/_headers', () => {
  it('applies rules to every path', () => {
    expect(headers).toMatch(/^\/\*/m);
  });

  it('sets the required security headers', () => {
    for (const name of [
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ]) {
      expect(headers, `expected ${name} header`).toContain(`${name}:`);
    }
  });
});
