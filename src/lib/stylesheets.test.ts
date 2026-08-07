import { describe, expect, it } from 'vitest';
import {
  allCssSources,
  GLOBAL_STYLESHEET,
  mediaBlocks,
  selectorsIn,
  stripComments,
  styleSourceFiles,
  withoutMediaBlocks,
} from './stylesheets';

describe('styleSourceFiles', () => {
  const files = styleSourceFiles();

  it('finds the global stylesheet', () => {
    expect(files).toContain(GLOBAL_STYLESHEET);
  });

  it('finds components that carry their own styles', () => {
    expect(files).toContain('src/components/Prose.astro');
    expect(files).toContain('src/components/PostList.astro');
    expect(files).toContain('src/layouts/Base.astro');
  });

  it('ignores everything that cannot contribute CSS', () => {
    expect(files.filter((path) => /\.(ts|md|mdx|png|svg)$/.test(path))).toEqual([]);
  });
});

describe('allCssSources', () => {
  const sources = new Map(allCssSources());

  it('reads a .css file whole', () => {
    expect(sources.get(GLOBAL_STYLESHEET)).toContain('--measure:');
  });

  it('reads the <style> block out of an .astro file', () => {
    expect(sources.get('src/components/Prose.astro')).toContain('.prose');
    // The frontmatter and template are not CSS and must not be scanned as if
    // they were — a `#` in a prop default would read as a hex colour.
    expect(sources.get('src/components/Prose.astro')).not.toContain('<slot');
  });

  it('drops files with no styles at all', () => {
    expect(sources.has('src/lib/stylesheets.ts')).toBe(false);
  });
});

describe('selectorsIn', () => {
  it('splits a comma group and drops at-rule preludes', () => {
    const css = `@media (min-width: 40rem) { .a, .b { color: red } }`;
    expect(selectorsIn(css)).toEqual(['.a', '.b']);
  });

  it('ignores selectors that only appear inside a comment', () => {
    expect(selectorsIn('/* .ghost { color: red } */ .real { margin: 0 }')).toEqual(['.real']);
  });
});

describe('mediaBlocks', () => {
  it('brace-matches rather than trusting indentation', () => {
    // The same rule is indented differently in a .css file and inside an
    // .astro <style> block. A guard anchored to "\n  }" matches one and not
    // the other, which is how a moved rule stops being checked.
    const flat = `@media (prefers-color-scheme: dark) {\n:root { color: red }\n}\n.after {}`;
    const nested = `  @media (prefers-color-scheme: dark) {\n    :root { color: red }\n  }\n  .after {}`;
    expect(mediaBlocks(flat, /prefers-color-scheme:\s*dark/)).toHaveLength(1);
    expect(mediaBlocks(nested, /prefers-color-scheme:\s*dark/)).toHaveLength(1);
    expect(selectorsIn(mediaBlocks(nested, /prefers-color-scheme:\s*dark/)[0] as string)).toEqual([
      ':root',
    ]);
  });

  it('finds every block, not just the first', () => {
    const css = `@media (x) { .a {} } .mid {} @media (x) { .b {} }`;
    expect(mediaBlocks(css, /x/)).toHaveLength(2);
  });
});

describe('withoutMediaBlocks', () => {
  it('removes the block and keeps everything around it', () => {
    const css = `.before {}\n@media (prefers-color-scheme: dark) {\n  .inside {}\n}\n.after {}`;
    const out = withoutMediaBlocks(css, /prefers-color-scheme:\s*dark/);
    expect(out).toContain('.before');
    expect(out).toContain('.after');
    expect(out).not.toContain('.inside');
  });
});

describe('stripComments', () => {
  it('removes block comments', () => {
    expect(stripComments('a { /* #fff */ color: var(--ink) }')).not.toContain('#fff');
  });
});
