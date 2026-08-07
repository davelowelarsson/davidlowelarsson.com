import { describe, expect, it } from 'vitest';
import {
  COMPONENT_FIXTURE,
  componentImports,
  componentUsages,
  fences,
  MARKDOWN_FIXTURE,
  readFixture,
  snippetFor,
  snippets,
  withoutFences,
} from './authoring-snippets';
import { MEDIA_KINDS, type MediaKind } from './figure';

const mdx = readFixture(COMPONENT_FIXTURE);
const md = readFixture(MARKDOWN_FIXTURE);

describe('parsing', () => {
  it('reads a fence with its language and its line', () => {
    const [first] = fences('intro\n```sh\nnpm run verify\n```\n');
    expect(first).toEqual({ lang: 'sh', body: 'npm run verify', line: 1 });
  });

  it('blanks fenced content but keeps every line, so positions still line up', () => {
    const source = 'a\n```md\nb\n```\nc';
    expect(withoutFences(source).split('\n')).toEqual(['a', '', '', '', 'c']);
  });

  // The whole reason this module is hand-rolled: the snippet for a component
  // contains that component's tag, so a naive search finds two usages where
  // there is one example.
  it('does not mistake a component inside a snippet for a usage', () => {
    const source = '<ArticleImage src={x} />\n\n```mdx\n<ArticleImage src={yours} />\n```\n';
    expect(componentUsages(source)).toEqual([{ name: 'ArticleImage', line: 0 }]);
  });

  it('ignores lowercase tags, because MDX tells a component from an element by case', () => {
    expect(componentUsages('<div>\n<img src="x">\n<Video src="y" />')).toEqual([
      { name: 'Video', line: 2 },
    ]);
  });

  it('finds the snippet that follows a usage, not one that precedes it', () => {
    const source =
      '```mdx\n<Video src={early} />\n```\n\n<Video src={x} />\n\n```mdx\n<Video />\n```';
    expect(snippetFor(source, 'Video')?.line).toBe(6);
  });

  it('reports no snippet when the following fence is about something else', () => {
    expect(snippetFor('<Video src={x} />\n\n```mdx\n<YouTube id="a" />\n```', 'Video')).toBeNull();
  });
});

// ── The two must not drift apart ──
//
// The Fixtures are the authoring reference. A component example with no
// snippet beside it is the failure this catches: it looks complete, and the
// only way to notice is to already know the component exists.
describe('the component-tier Fixture documents every component it shows', () => {
  const used = [...new Set(componentUsages(mdx).map((usage) => usage.name))];

  it('shows at least one component, or the rest of this file proves nothing', () => {
    expect(used.length).toBeGreaterThan(0);
  });

  it.each(used)('%s has an authoring snippet after its example', (component) => {
    expect(
      snippetFor(mdx, component),
      `${component} is rendered in the Fixture with no \`\`\`mdx snippet after it — an example nobody can copy`,
    ).not.toBeNull();
  });

  it('imports nothing it does not render', () => {
    const rendered = new Set(used);
    expect(
      componentImports(mdx).filter((name) => !rendered.has(name)),
      'a component is imported but never shown — dead weight in the reference',
    ).toEqual([]);
  });
});

describe('the Markdown-tier Fixture keeps the limit it exists to demonstrate', () => {
  // Stronger than describing the limit in prose: a component here would render
  // as literal text in `.md`, and the fixture would quietly stop being a
  // picture of what the Markdown tier can do.
  it('renders no component at all', () => {
    expect(
      componentUsages(md).map((usage) => usage.name),
      'the .md Fixture reaches for a component — components are the other tier',
    ).toEqual([]);
  });

  it('carries authoring snippets of its own', () => {
    expect(snippets(md).length).toBeGreaterThan(0);
  });
});

/**
 * #124 asks for "a kitchen-sink Post exercising EVERY kind". `chart` was
 * missing and nothing said so — it is styled in the contract, declared in
 * MEDIA_KINDS, and its only use on the whole site was inside a published Post,
 * which ADR 0011 forbids e2e from pinning. So the kind was real, shipped, and
 * untested by anything that is allowed to test it.
 *
 * Each kind is looked for the way it is actually authored, not through one
 * uniform mechanism — that asymmetry IS the two-tier contract.
 */
describe('the Fixtures exercise every kind the contract declares', () => {
  // Prose and markup only. A kind shown in a ```mdx snippet is documented, not
  // exercised — the snippet renders as text, and a catalogue that counted it
  // would pass with nothing on the page.
  const rendered = `${withoutFences(mdx)}\n${withoutFences(md)}`;
  const diagramFences = [...fences(mdx), ...fences(md)].filter((fence) => fence.lang === 'mermaid');

  const AUTHORED_AS: Record<MediaKind, () => boolean> = {
    // The one kind that IS a fence, because a diagram is authored as source.
    diagram: () => diagramFences.length > 0,
    chart: () => /kind="chart"/.test(rendered),
    screenshot: () => /kind="screenshot"/.test(rendered),
    photo: () => /kind="photo"/.test(rendered),
    // No component, and never will have one: reached by path in the Markdown tier.
    sketch: () => /\.excalidraw\.svg/.test(rendered),
    embed: () => /<(YouTube|Video)\b/.test(rendered),
  };

  it.each(MEDIA_KINDS)('%s is rendered by a Fixture', (kind) => {
    expect(
      AUTHORED_AS[kind](),
      `${kind} is declared in MEDIA_KINDS but no Fixture renders one — the catalogue is incomplete`,
    ).toBe(true);
  });
});

describe('a snippet is tagged with the tier it belongs to', () => {
  it.each([
    ['the component tier', mdx],
    ['the Markdown tier', md],
  ])('%s tags every snippet md or mdx', (_label, source) => {
    // A snippet fence with no language renders unhighlighted and, worse, says
    // nothing about WHICH file it goes in — which is the one thing the two-tier
    // contract needs an author to know.
    expect(snippets(source).length).toBeGreaterThan(0);
  });

  it('never shows a component in an md-tagged snippet', () => {
    const offenders = [...snippets(mdx), ...snippets(md)]
      .filter((fence) => fence.lang === 'md')
      .filter((fence) => /<[A-Z]/.test(fence.body));
    expect(
      offenders.map((fence) => fence.body.slice(0, 40)),
      'an md snippet uses a component — in a .md Post that renders as literal text',
    ).toEqual([]);
  });
});
