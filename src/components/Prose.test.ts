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

  it('anchors every one of its rules on .prose', () => {
    // A rule written as bare `:global(table)` would compile to `table` and
    // reach every page on the site. The component is only a boundary while all
    // of its selectors start at the wrapper.
    const loose = selectorsIn(cssIn(PROSE_COMPONENT)).filter(
      (selector) => !selector.startsWith('.prose'),
    );
    expect(loose, 'a rule in Prose.astro escapes the component').toEqual([]);
  });
});
