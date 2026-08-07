import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Where the CSS is, now that there is more than one place.
 *
 * Before #116 every rule lived in one `<style is:global>` block inside
 * `Base.astro`, and the guards that police the stylesheet — the palette
 * mirror, the forced-theme companions, the prose-list scoping — each reached
 * into that block by regex. Splitting the CSS into three layers would have
 * quietly narrowed all three to a file that no longer holds what they were
 * looking for: they would have kept passing while checking almost nothing.
 *
 * So the guards ask this module instead, and it answers with EVERY source that
 * can contribute CSS. A rule that moves into a component stays inside the
 * guard; a new component with its own styles is covered the day it is written,
 * without anyone remembering to add it.
 */

/** Layer 1: tokens, reset, and shared chrome. The only global stylesheet. */
export const GLOBAL_STYLESHEET = 'src/styles/global.css';

/** Every file under `root` that can contribute CSS to a page. */
export function styleSourceFiles(root = 'src'): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root, { recursive: true }) as string[]) {
    const path = join(root, entry.toString());
    if (!/\.(css|astro)$/.test(path)) continue;
    if (statSync(path).isDirectory()) continue;
    files.push(path);
  }
  return files.sort();
}

/**
 * The CSS a single file contributes: the whole file for `.css`, and every
 * `<style>` block for `.astro` — scoped and `is:global` alike, because both
 * reach the page and both can define a colour or forget a theme companion.
 */
export function cssIn(path: string): string {
  const source = readFileSync(path, 'utf8');
  if (path.endsWith('.css')) return normalizeQuotes(source);
  return unwrapGlobal(
    normalizeQuotes(
      [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
        .map((match) => match[1])
        .join('\n'),
    ),
  );
}

/** Every stylesheet source, as `[path, css]` pairs — so a failure can name the file. */
export function allCssSources(root = 'src'): [string, string][] {
  return styleSourceFiles(root)
    .map((path): [string, string] => [path, cssIn(path)])
    .filter(([, css]) => css.trim().length > 0);
}

/**
 * Runs of whitespace collapsed to single spaces.
 *
 * A formatter wraps a long selector across lines wherever it likes, so any
 * guard comparing selector text literally has to flatten it first — otherwise
 * the check passes or fails on where biome chose to break the line.
 */
export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ');
}

/** Comments removed — prose about a colour is not a colour. */
export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Attribute-selector quotes normalised to single.
 *
 * `[data-theme='dark']` and `[data-theme="dark"]` are the same selector, and
 * the formatter picks a different one in a `.css` file than in an `.astro`
 * `<style>` block. A guard that matches the literal text of a selector must not
 * be able to fail — or worse, silently stop matching — because a formatter
 * changed its mind about quoting. Found the moment `biome check --write`
 * touched the new stylesheet.
 */
export function normalizeQuotes(css: string): string {
  return css.replace(/"/g, "'");
}

/**
 * `:global(…)` wrappers removed, leaving what Astro will actually compile —
 * minus the scope attribute it adds.
 *
 * A guard that matches selector TEXT must see the selector the browser sees.
 * `.prose :global(ul)` and `.prose ul` are the same rule; so are
 * `:global(:root[data-theme='dark']) .prose` and
 * `:root[data-theme='dark'] .prose`. Reading the source form means every guard
 * has to know about a syntax that exists only inside `.astro` files — and the
 * theme guard did not, so it looked for a forced-dark companion that was
 * present and reported it missing.
 */
export function unwrapGlobal(css: string): string {
  let out = '';
  for (let i = 0; i < css.length; ) {
    if (!css.startsWith(':global(', i)) {
      out += css[i];
      i += 1;
      continue;
    }
    // Copy the wrapped selector, dropping the wrapper's own parentheses.
    let depth = 1;
    let j = i + ':global('.length;
    for (; j < css.length && depth > 0; j++) {
      if (css[j] === '(') depth++;
      else if (css[j] === ')') depth--;
      if (depth > 0) out += css[j];
    }
    i = j;
  }
  return out;
}

/**
 * Every selector in a block of CSS, split on commas and trimmed. At-rule
 * preludes (`@media …`) are dropped; the rules nested inside them are not.
 *
 * A rule can open after `{` as well as after `}` — the FIRST rule inside an
 * at-rule has an `{` behind it, not a `}`. The earlier version of this regex
 * only looked behind for `}` or start-of-input, so it walked past the first
 * rule in every `@media` block it was pointed at. That is precisely where the
 * theme and reduced-motion rules live.
 *
 * A lookbehind, not a capture: consuming the delimiter makes it unavailable to
 * the next match, so back-to-back rules would be found only every other time.
 */
export function selectorsIn(css: string): string[] {
  return [...stripComments(css).matchAll(/(?<=^|[{}])([^{}]+)\{/g)]
    .flatMap(([, group]) => splitSelectorGroup(group as string))
    .map((selector) => selector.trim())
    .filter((selector) => selector.length > 0 && !selector.startsWith('@'));
}

/**
 * Split `a, b` on TOP-LEVEL commas only.
 *
 * A functional pseudo-class carries its own commas — `:is(img, picture)`,
 * `:where(ul, ol)`, `:not(a, button)`. Splitting on every comma tears those in
 * half and hands the guards fragments like `picture)`, which match nothing they
 * are looking for and are reported as violations that do not exist. Found the
 * moment the figure contract used `:is()`.
 */
function splitSelectorGroup(group: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < group.length; i++) {
    const char = group[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === ',' && depth === 0) {
      parts.push(group.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(group.slice(start));
  return parts;
}

/**
 * The bodies of every `@media (<condition>)` block, brace-matched so nested
 * rules count as inside. Brace matching rather than an indentation-anchored
 * regex: the same rule is indented differently in a `.css` file and in an
 * `.astro` `<style>` block, and a guard that depended on that would silently
 * stop matching the moment a rule moved between layers.
 */
export function mediaBlocks(css: string, condition: RegExp): string[] {
  const clean = stripComments(css);
  const opener = new RegExp(`@media\\s*\\(${condition.source}\\)\\s*\\{`, 'g');
  const blocks: string[] = [];

  for (let match = opener.exec(clean); match !== null; match = opener.exec(clean)) {
    let depth = 1;
    let index = match.index + match[0].length;
    const start = index;
    while (index < clean.length && depth > 0) {
      if (clean[index] === '{') depth++;
      else if (clean[index] === '}') depth--;
      index++;
    }
    blocks.push(clean.slice(start, index - 1));
  }
  return blocks;
}

/** The same CSS with every matching `@media` block removed, brace-matched. */
export function withoutMediaBlocks(css: string, condition: RegExp): string {
  const clean = stripComments(css);
  const opener = new RegExp(`@media\\s*\\(${condition.source}\\)\\s*\\{`, 'g');
  let out = '';
  let cursor = 0;

  for (let match = opener.exec(clean); match !== null; match = opener.exec(clean)) {
    let depth = 1;
    let index = match.index + match[0].length;
    while (index < clean.length && depth > 0) {
      if (clean[index] === '{') depth++;
      else if (clean[index] === '}') depth--;
      index++;
    }
    out += clean.slice(cursor, match.index);
    cursor = index;
    opener.lastIndex = index;
  }
  return out + clean.slice(cursor);
}
