import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findUnpinnedPostSlugs } from './e2e-fixtures';

const FIXTURES = ['kitchen-sink', 'kitchen-sink-markdown'];

describe('findUnpinnedPostSlugs', () => {
  it('reports a published slug named by a spec', () => {
    const source = `await page.goto('/posts/essay-ai-code-ownership/');`;
    expect(findUnpinnedPostSlugs(source, FIXTURES)).toEqual([
      { line: 1, slug: 'essay-ai-code-ownership', text: source },
    ]);
  });

  it('allows a fixture slug', () => {
    expect(findUnpinnedPostSlugs(`await page.goto('/posts/kitchen-sink/');`, FIXTURES)).toEqual([]);
  });

  it('allows the /posts/ index route', () => {
    expect(findUnpinnedPostSlugs(`await page.goto('/posts/');`, FIXTURES)).toEqual([]);
  });

  it('allows a published slug opted out on the same line', () => {
    const source = `await page.goto('/posts/maya-scene-python-to-xml/'); // content-pinned: archive embeds`;
    expect(findUnpinnedPostSlugs(source, FIXTURES)).toEqual([]);
  });

  it('allows a published slug opted out on the line above', () => {
    const source = [
      '// content-pinned: RSS completeness',
      `'/posts/essay-dora-five-years-after-deploy-fear/',`,
    ].join('\n');
    expect(findUnpinnedPostSlugs(source, FIXTURES)).toEqual([]);
  });

  it('allows a marker anywhere in the comment block directly above', () => {
    const source = [
      '// This asserts the feed, which only ever carries published Posts.',
      '// content-pinned: a draft fixture is absent from RSS by construction.',
      '// So there is nothing else to point at.',
      `await page.goto('/posts/essay-ai-code-ownership/');`,
    ].join('\n');
    expect(findUnpinnedPostSlugs(source, FIXTURES)).toEqual([]);
  });

  it('does not reach past a blank line to find a marker', () => {
    const source = [
      '// content-pinned: about a different line entirely',
      '',
      `await page.goto('/posts/essay-ai-code-ownership/');`,
    ].join('\n');
    expect(findUnpinnedPostSlugs(source, FIXTURES).map((v) => v.slug)).toEqual([
      'essay-ai-code-ownership',
    ]);
  });

  it('does not let one marker exempt a whole file', () => {
    const source = [
      '// content-pinned: RSS completeness',
      `'/posts/essay-dora-five-years-after-deploy-fear/',`,
      `'/posts/essay-ai-code-ownership/',`,
    ].join('\n');
    expect(findUnpinnedPostSlugs(source, FIXTURES).map((v) => v.slug)).toEqual([
      'essay-ai-code-ownership',
    ]);
  });

  it('reports every slug on a line, not just the first', () => {
    const source = `const PAGES = ['/posts/essay-vanity-url-shorteners/', '/posts/hello-world-again/'];`;
    expect(findUnpinnedPostSlugs(source, FIXTURES).map((v) => v.slug)).toEqual([
      'essay-vanity-url-shorteners',
      'hello-world-again',
    ]);
  });

  it('reports a slug that no longer exists — a stale pin is the failure it prevents', () => {
    const source = `await page.goto('/posts/til-astro-7-zod-moved/');`;
    expect(findUnpinnedPostSlugs(source, FIXTURES).map((v) => v.slug)).toEqual([
      'til-astro-7-zod-moved',
    ]);
  });
});

describe('the e2e suite', () => {
  const e2eDir = 'e2e';
  const specs = readdirSync(e2eDir).filter((name) => name.endsWith('.spec.ts'));

  it('has specs to scan — a vacuous pass here would hide every violation', () => {
    expect(specs.length).toBeGreaterThan(10);
  });

  it('names no published Post without an explicit content-pinned reason', () => {
    const violations = specs.flatMap((name) =>
      findUnpinnedPostSlugs(readFileSync(join(e2eDir, name), 'utf8'), FIXTURES).map(
        (violation) => `${name}:${violation.line}  ${violation.slug}\n    ${violation.text}`,
      ),
    );

    expect(
      violations,
      'render-focused e2e must target a fixture; pin published content only with a reason',
    ).toEqual([]);
  });

  it('pins exactly the fixtures that exist as permanent drafts', () => {
    for (const slug of FIXTURES) {
      const source = readFileSync(
        join('src/content/posts/2026', slug, `index.${slug.endsWith('markdown') ? 'md' : 'mdx'}`),
        'utf8',
      );
      expect(source, `${slug} must stay a permanent draft`).toMatch(/^draft:\s*true$/m);
    }
  });
});
