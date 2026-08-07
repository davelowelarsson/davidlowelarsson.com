import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { postFrontmatterSchema } from './post-schema';

function frontmatterOf(markdown: string): unknown {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error('no frontmatter block found');
  return parse(match[1] as string);
}

describe('postFrontmatterSchema', () => {
  it('accepts a minimal post', () => {
    const parsed = postFrontmatterSchema.parse({ title: 'Hi', pubDate: '2026-07-07' });

    expect(parsed.category).toBe('til');
    expect(parsed.draft).toBe(false);
    expect(parsed.tags).toEqual([]);
  });

  it('rejects a post without a title', () => {
    expect(() => postFrontmatterSchema.parse({ pubDate: '2026-07-07' })).toThrow();
  });

  it('rejects an unknown category', () => {
    expect(() =>
      postFrontmatterSchema.parse({ title: 'Hi', pubDate: '2026-07-07', category: 'rant' }),
    ).toThrow();
  });

  it('accepts a valid liveFrom (bare date and with a time)', () => {
    for (const liveFrom of ['2026-07-20', '2026-07-20T09:00', '2026-12-31T23:59']) {
      expect(
        postFrontmatterSchema.parse({ title: 'Hi', pubDate: '2026-07-07', liveFrom }).liveFrom,
      ).toBe(liveFrom);
    }
  });

  it('normalizes a YAML Date (unquoted bare date) to its calendar string', () => {
    // YAML parses `liveFrom: 2026-07-09` into a Date; the schema converts it back.
    expect(
      postFrontmatterSchema.parse({
        title: 'Hi',
        pubDate: '2026-07-07',
        liveFrom: new Date(Date.UTC(2026, 6, 9)),
      }).liveFrom,
    ).toBe('2026-07-09');
  });

  it('rejects impossible or malformed liveFrom values', () => {
    for (const liveFrom of [
      '2026-13-40', // no month 13 / day 40
      '2026-02-31', // Feb has no 31st
      '2026-07-20T99:99', // out-of-range time
      '2026-07-20T24:00', // hour 24 not allowed
      '2026-7-2', // not zero-padded
      '2026/07/20', // wrong separators
      '2026-07-20 09:00', // space instead of T
      '2026-07-20T09:00:00', // seconds not supported
    ]) {
      expect(() =>
        postFrontmatterSchema.parse({ title: 'Hi', pubDate: '2026-07-07', liveFrom }),
      ).toThrow();
    }
  });
});

describe('the post templates', () => {
  const TEMPLATES = [
    ['templates/new-post', 'index.md'],
    ['templates/new-post-mdx', 'index.mdx'],
  ] as const;

  it.each(TEMPLATES)(
    '%s is always a valid post — the template IS the frontmatter contract example',
    (dir, file) => {
      const template = readFileSync(join(process.cwd(), dir, file), 'utf8');

      const parsed = postFrontmatterSchema.parse(frontmatterOf(template));

      expect(parsed.draft).toBe(true);
      expect(parsed.title.length).toBeGreaterThan(0);
      expect(parsed.description).toBeTruthy();
    },
  );

  /**
   * The reason the `.mdx` template is its own directory rather than a second
   * file beside `index.md`.
   *
   * `postIdFromEntry` derives a post's identity from its FOLDER, so a bundle
   * holding both `index.md` and `index.mdx` is two entries claiming one id.
   * The documented flow is `cp -r <template> src/content/posts/…`, which would
   * copy both — so the collision would be created by following the
   * instructions, and it would surface as a duplicate-id warning rather than
   * as anything that names the cause.
   */
  it.each(TEMPLATES)('%s holds exactly one index file', (dir) => {
    const indexes = readdirSync(join(process.cwd(), dir)).filter((name) =>
      /^index\.mdx?$/.test(name),
    );
    expect(indexes, `${dir} must hold exactly one index — a bundle is one post`).toHaveLength(1);
  });

  it('offers a template for each tier of the figure contract', () => {
    expect(TEMPLATES.map(([, file]) => file)).toEqual(['index.md', 'index.mdx']);
  });
});

describe('Git and AI ownership publication pair', () => {
  it('schedules the archive Post immediately before the current essay', () => {
    const essay = readFileSync(
      join(process.cwd(), 'src/content/posts/2026/essay-ai-code-ownership/index.mdx'),
      'utf8',
    );
    const gitPost = readFileSync(
      join(process.cwd(), 'src/content/posts/2013/git-the-new-svn/index.md'),
      'utf8',
    );

    const parsedEssay = postFrontmatterSchema.parse(frontmatterOf(essay));
    const parsedGitPost = postFrontmatterSchema.parse(frontmatterOf(gitPost));

    expect(parsedEssay).toMatchObject({
      title: 'Who owns the code AI writes?',
      category: 'essay',
      draft: false,
      liveFrom: '2026-07-23',
    });
    expect(parsedGitPost).toMatchObject({
      title: 'Git, the new SVN?',
      draft: false,
      liveFrom: '2026-07-21',
    });
    expect(gitPost).toContain('/posts/essay-ai-code-ownership/');
    expect(parsedEssay.pubDate.toISOString()).toBe('2026-07-19T00:00:00.000Z');
  });

  it('moves the July tooling archive Posts after the pair', () => {
    const mayaPost = readFileSync(
      join(process.cwd(), 'src/content/posts/2013/maya-scene-python-to-xml/index.mdx'),
      'utf8',
    );
    const cgfxPost = readFileSync(
      join(process.cwd(), 'src/content/posts/2013/cgfx-and-glsl/index.mdx'),
      'utf8',
    );

    expect(postFrontmatterSchema.parse(frontmatterOf(mayaPost)).liveFrom).toBe('2026-07-28');
    expect(postFrontmatterSchema.parse(frontmatterOf(cgfxPost)).liveFrom).toBe('2026-07-31');
  });
});
