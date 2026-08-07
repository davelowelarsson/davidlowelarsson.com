import { readFileSync } from 'node:fs';

/**
 * The kitchen-sink Fixtures double as the authoring reference: every example
 * shows the rendered result AND the source an author would write to get it.
 *
 * That only stays true if the two cannot drift, and they will — a snippet is
 * prose about code, which is the thing this codebase distrusts most. So the
 * relationship is parsed rather than trusted: a component example with no
 * adjacent snippet, an import nothing uses, or a `md`-tagged snippet reaching
 * for a component are all findable, and `authoring-snippets.test.ts` finds them.
 *
 * The snippet can never be asserted EQUAL to the usage — the fixture writes
 * `src={testCardWide}` against its own import while an author writes their own
 * name — so the guarantee is deliberately the weaker, checkable one: the
 * snippet exists, sits next to the example, and names the component it is for.
 */

/** The component tier's Fixture: `.mdx`, where components are available. */
export const COMPONENT_FIXTURE = 'src/content/posts/2026/kitchen-sink/index.mdx';

/** The Markdown tier's Fixture: `.md`, where they are not. */
export const MARKDOWN_FIXTURE = 'src/content/posts/2026/kitchen-sink-markdown/index.md';

/** The languages an authoring snippet may be tagged with, one per tier. */
export const SNIPPET_LANGS = ['mdx', 'md'] as const;

export type SnippetLang = (typeof SNIPPET_LANGS)[number];

export interface Fence {
  readonly lang: string;
  readonly body: string;
  /** 0-based line the opening ``` sits on. */
  readonly line: number;
}

export interface Usage {
  readonly name: string;
  /** 0-based line the opening tag sits on. */
  readonly line: number;
}

/**
 * Every fenced block, with the line its fence opens on.
 *
 * Hand-rolled rather than regex'd because the thing being parsed contains
 * fences that contain component tags, and a regex that finds "a component tag"
 * cannot tell the example from the snippet describing it. Line positions are
 * what make "adjacent" answerable at all.
 */
export function fences(source: string): Fence[] {
  const lines = source.split('\n');
  const found: Fence[] = [];
  let open: { lang: string; line: number; body: string[] } | null = null;

  lines.forEach((line, index) => {
    const fence = /^\s*```(\S*)\s*$/.exec(line);
    if (!fence) {
      if (open) open.body.push(line);
      return;
    }
    if (open) {
      found.push({ lang: open.lang, body: open.body.join('\n'), line: open.line });
      open = null;
      return;
    }
    open = { lang: (fence[1] as string).toLowerCase(), line: index, body: [] };
  });

  return found;
}

/** The same source with every fenced block blanked out, line numbering intact. */
export function withoutFences(source: string): string {
  const lines = source.split('\n');
  let inside = false;
  return lines
    .map((line) => {
      if (/^\s*```(\S*)\s*$/.test(line)) {
        inside = !inside;
        return '';
      }
      return inside ? '' : line;
    })
    .join('\n');
}

/**
 * Every component actually rendered by the file — capitalised tags only, and
 * never one inside a fence.
 *
 * MDX distinguishes a component from an HTML element by case alone, which is
 * also why `<div>` and `<img>` are correctly ignored here without a list.
 */
export function componentUsages(source: string): Usage[] {
  return withoutFences(source)
    .split('\n')
    .flatMap((line, index) =>
      [...line.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((match) => ({
        name: match[1] as string,
        line: index,
      })),
    );
}

/** Every component name imported from an `.astro` file. */
export function componentImports(source: string): string[] {
  return [...source.matchAll(/^import\s+([A-Z][A-Za-z0-9]*)\s+from\s+['"][^'"]+\.astro['"]/gm)].map(
    (match) => match[1] as string,
  );
}

/** The fences that are authoring snippets — `mdx` or `md` — rather than output. */
export function snippets(source: string): Fence[] {
  return fences(source).filter((fence) =>
    (SNIPPET_LANGS as readonly string[]).includes(fence.lang),
  );
}

/**
 * For each component the file renders, the first authoring snippet that follows
 * its first usage — or `null` where there is none.
 *
 * "The next snippet after it" rather than "a snippet within N lines": a line
 * budget is a number nobody can defend, and it would go stale the moment an
 * example grew a paragraph of explanation.
 */
export function snippetFor(source: string, component: string): Fence | null {
  const usage = componentUsages(source).find((entry) => entry.name === component);
  if (!usage) return null;
  return (
    snippets(source).find(
      (fence) => fence.line > usage.line && fence.body.includes(`<${component}`),
    ) ?? null
  );
}

export function readFixture(path: string): string {
  return readFileSync(path, 'utf8');
}
