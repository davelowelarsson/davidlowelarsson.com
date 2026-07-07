import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Guards against accidentally deleting or gutting public/_headers, which is
// how Cloudflare Workers static assets applies security headers at the edge
// (see docs/astro-field-guide.md). This does NOT verify header correctness
// against securityheaders.com — only that the file exists and still
// declares the headers issue #12 asked for.

const headers = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');

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
