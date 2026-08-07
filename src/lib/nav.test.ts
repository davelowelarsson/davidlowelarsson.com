import { describe, expect, it } from 'vitest';
import { isCurrentPage, MASTHEAD_NAV } from './nav';

describe('the masthead navigation', () => {
  it('points every entry at a real route shape', () => {
    expect(MASTHEAD_NAV.length).toBeGreaterThan(1);
    for (const { href, label } of MASTHEAD_NAV) {
      expect(href, label).toMatch(/^\/([\w-]+\/)*$/);
      expect(label.trim()).toBe(label);
    }
  });
});

describe('isCurrentPage', () => {
  it('marks an exact match', () => {
    expect(isCurrentPage('/posts/', '/posts/')).toBe(true);
    expect(isCurrentPage('/category/essay/', '/category/essay/')).toBe(true);
  });

  it('ignores a missing or doubled trailing slash', () => {
    expect(isCurrentPage('/posts/', '/posts')).toBe(true);
    expect(isCurrentPage('/posts', '/posts/')).toBe(true);
  });

  // The home link is `/`, which is a prefix of literally every path. Matching
  // by prefix would light it up on every page of the site.
  it('does not let home match everything', () => {
    expect(isCurrentPage('/', '/')).toBe(true);
    expect(isCurrentPage('/', '/posts/')).toBe(false);
    expect(isCurrentPage('/', '/category/essay/')).toBe(false);
  });

  // A post lives under /posts/ but is not the archive. `aria-current="page"`
  // means THIS page; claiming it for an ancestor would be a lie to a screen
  // reader, so a post page simply has nothing marked.
  it('does not claim a section for one of its children', () => {
    expect(isCurrentPage('/posts/', '/posts/hello-world-again/')).toBe(false);
    expect(isCurrentPage('/category/essay/', '/posts/essay-ai-code-ownership/')).toBe(false);
  });

  it('is not fooled by a shared prefix', () => {
    expect(isCurrentPage('/posts/', '/posts-archive/')).toBe(false);
    expect(isCurrentPage('/category/essay/', '/category/essays/')).toBe(false);
  });
});
