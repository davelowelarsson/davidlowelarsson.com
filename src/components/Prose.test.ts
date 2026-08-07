import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { cssIn, selectorsIn } from '../lib/stylesheets';
import Prose from './Prose.astro';

// Article prose had no test coverage of any kind before #116, because there
// was nothing to render: the rules lived in a global block and the markup
// arrived from the markdown pipeline. Housing them in a component does not make
// them scopable — slotted content still carries no scope attribute — but it
// does make them REACHABLE, which is the whole argument for the component.

const PROSE_COMPONENT = 'src/components/Prose.astro';

/**
 * A selector with its `:global()` wrappers removed and its whitespace collapsed
 * — i.e. what Astro will actually compile it into, minus the scope attribute.
 * Reading the source form instead means matching against `:global(` noise and
 * against wherever the formatter chose to wrap a long selector across lines.
 */
function normalize(selector: string): string {
  return selector
    .replace(/:global\(/g, '')
    .replace(/\)(?=\s|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function render(html: string): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Prose, { slots: { default: html } });
}

describe('Prose', () => {
  it('wraps slotted content in exactly one .prose element', async () => {
    const html = await render('<p>Body text.</p>');
    expect(html).toContain('class="prose"');
    expect(html.match(/class="prose"/g)).toHaveLength(1);
  });

  it('passes rendered markdown through untouched', async () => {
    // Markdown reaches here as finished HTML. Prose styles it; it must not
    // rewrite it, or the pipeline gains a second opinion about the markup.
    const body = '<h2 id="tldr">TL;DR</h2><ul><li>One</li><li>Two</li></ul>';
    expect(await render(body)).toContain(body);
  });

  it('puts the content inside the wrapper, not beside it', async () => {
    const html = await render('<p>Inside.</p>');
    const opening = html.indexOf('class="prose"');
    const closing = html.lastIndexOf('</div>');
    const content = html.indexOf('<p>Inside.</p>');
    expect(content).toBeGreaterThan(opening);
    expect(content).toBeLessThan(closing);
  });

  it('carries a scope attribute on the wrapper — the thing that scopes the rules', async () => {
    // `.prose :global(ul)` compiles to `.prose[data-astro-cid-…] ul`. If the
    // wrapper ever stopped carrying that attribute, every prose rule would
    // widen to the whole document at once and this would be the only place it
    // showed up before a reader did.
    expect(await render('<p>x</p>')).toMatch(/data-astro-cid-[\w-]+/);
  });

  // ── The Markdown tier (#119) ──
  it('addresses each of the three path conventions', () => {
    const css = cssIn(PROSE_COMPONENT);
    // A sketch, a drawn vector and a raster are told apart by PATH, because the
    // element is the only hook a plain Markdown image offers.
    expect(css, 'no sketch rule').toContain("img[src*='excalidraw']");
    expect(css, 'raster rule does not exclude vectors').toContain("img:not([src$='.svg'])");
  });

  it('frames only images that arrived as Markdown, never a component figure', () => {
    // A component emits `figure.media > .media__body > img`, which is neither a
    // direct child of the wrapper nor inside a paragraph. The Markdown rules
    // must stay shaped so they cannot reach it — otherwise the two tiers fight
    // over the same element and the component tier loses to source order.
    const framing = selectorsIn(cssIn(PROSE_COMPONENT))
      .map(normalize)
      .filter((selector) => /img(?:\[|:not)/.test(selector));

    expect(framing.length, 'no Markdown image rules found to check').toBeGreaterThan(0);
    expect(
      framing.filter((selector) => !/\.prose > img|\.prose p > img|\.prose img\[/.test(selector)),
      'a Markdown image rule is not anchored on a direct child or a paragraph child',
    ).toEqual([]);
    expect(
      framing.filter((selector) => selector.includes('media__body')),
      'a Markdown image rule reaches into a component figure',
    ).toEqual([]);
  });

  it('introduces no authoring syntax — the rules key on the path alone', () => {
    const css = cssIn(PROSE_COMPONENT);
    // A marker class or data attribute would mean editing 35 published Posts.
    expect(css).not.toMatch(/img\[(?:class|data-)/);
  });

  it('keeps every one of its rules inside .prose', () => {
    // A rule written as bare `:global(table)` would compile to `table` and
    // reach every page on the site. The component is only a boundary while
    // every selector passes through the wrapper.
    //
    // A theme-dependent rule is allowed to be PREFIXED by `:root[data-theme=…]`
    // — that is a state of the document, not an escape from the component — so
    // the requirement is that `.prose` appears, not that it comes first.
    const loose = selectorsIn(cssIn(PROSE_COMPONENT))
      .map(normalize)
      .filter((selector) => !/(^|\s):root\b/.test(selector) && !selector.startsWith('.prose'));
    expect(loose, 'a rule in Prose.astro escapes the component').toEqual([]);

    const themed = selectorsIn(cssIn(PROSE_COMPONENT))
      .map(normalize)
      .filter((selector) => /(^|\s):root\b/.test(selector));
    expect(
      themed.filter((selector) => !selector.includes('.prose')),
      'a theme-prefixed rule leaves the component entirely',
    ).toEqual([]);
  });
});
