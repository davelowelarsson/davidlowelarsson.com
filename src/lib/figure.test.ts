import { describe, expect, it } from 'vitest';
import {
  BREAKOUT_CLASS,
  figureClass,
  isMediaKind,
  MEDIA_CLASS,
  MEDIA_KINDS,
  type MediaKind,
} from './figure';
import { allCssSources, cssIn, selectorsIn, stripComments } from './stylesheets';

const CONTRACT_STYLESHEET = 'src/styles/media.css';
const PROSE_COMPONENT = 'src/components/Prose.astro';

/** Every `filter:` value declared in a file, in source order. */
function filters(path: string): string[] {
  return [...stripComments(cssIn(path)).matchAll(/filter:\s*([^;}]+)/g)].map((match) =>
    (match[1] as string).trim(),
  );
}

describe('MEDIA_KINDS', () => {
  it('is the six kinds the spec names, and nothing else', () => {
    expect([...MEDIA_KINDS]).toEqual([
      'diagram',
      'chart',
      'screenshot',
      'photo',
      'sketch',
      'embed',
    ]);
  });

  it('recognises a kind and rejects a near-miss', () => {
    expect(isMediaKind('photo')).toBe(true);
    // `image` and `figure` are the words someone reaches for when they have not
    // read the contract. They are not kinds; the kind says what the thing IS.
    expect(isMediaKind('image')).toBe(false);
    expect(isMediaKind('figure')).toBe(false);
    expect(isMediaKind('')).toBe(false);
  });
});

describe('figureClass', () => {
  it('always carries the contract class', () => {
    expect(figureClass('article-image').split(' ')).toContain(MEDIA_CLASS);
  });

  it('keeps the component class alongside it', () => {
    expect(figureClass('article-image')).toBe('media article-image');
  });

  it('adds the existing breakout primitive when asked, and nothing else', () => {
    expect(figureClass('article-image', { breakout: true })).toBe(
      `${MEDIA_CLASS} article-image ${BREAKOUT_CLASS}`,
    );
  });

  it('omits breakout by default — wide is a decision, not a default', () => {
    expect(figureClass('article-image')).not.toContain(BREAKOUT_CLASS);
  });

  // The design's proposed wide-media class never appears: the breakout
  // primitive already does that job, is ADR 0006-governed and is tested.
  it('never invents a wide-media class', () => {
    expect(figureClass('article-image', { breakout: true })).not.toContain('media--wide');
  });
});

describe('the contract stylesheet', () => {
  const selectors = selectorsIn(cssIn(CONTRACT_STYLESHEET));

  /**
   * Kinds that are real but are NOT reached through `[data-media]`, and why.
   *
   * Both are consequences of the two-tier contract rather than oversights, and
   * naming them is the point: an unexplained gap and a deliberate one look
   * identical until someone writes the difference down.
   *
   *   diagram — emitted by Mermaid.astro, client-side, as `.mermaid-diagram`.
   *     It was deliberately outside #118's migration list, and #121 draws it
   *     from the design tokens directly, so its "framing" is the diagram
   *     itself. Adding an empty `[data-media='diagram']` rule to satisfy this
   *     test would be writing a rule to please a guard.
   *   sketch — has no component and is not expected to get one. Sketches are
   *     authored as plain Markdown (#119), so they are reached by path
   *     (`*.excalidraw.svg`) in the Prose component's Markdown tier. A kind
   *     with no component is exactly the limit #114 calls the two-tier
   *     contract.
   */
  const REACHED_ELSEWHERE: readonly MediaKind[] = ['diagram', 'sketch'];

  // Both directions, since #124. The original only checked that no kind is
  // styled which the contract does not declare — which a kind with NO framing
  // passes trivially. `screenshot` sat declared and unstyled through four
  // tickets that way: the contract promised six kinds and delivered five, and
  // nothing said so.
  it('accounts for every kind it declares', () => {
    const unaccounted = MEDIA_KINDS.filter(
      (kind: MediaKind) =>
        !REACHED_ELSEWHERE.includes(kind) &&
        !selectors.some((selector) => selector.includes(`[data-media='${kind}']`)),
    );
    expect(
      unaccounted,
      'a kind is declared in MEDIA_KINDS but has no framing and no reason — a promise the contract does not keep',
    ).toEqual([]);
  });

  it('reaches the kinds that have no component, somewhere', () => {
    // The exception list is not a way to stop checking. A kind excused from the
    // contract still has to be styled SOMEWHERE, or it is simply missing.
    const sources = allCssSources();
    for (const kind of REACHED_ELSEWHERE) {
      const marker = kind === 'diagram' ? 'mermaid-diagram' : 'excalidraw';
      expect(
        sources.some(([, css]) => css.includes(marker)),
        `${kind} is excused from the contract but styled nowhere`,
      ).toBe(true);
    }
  });

  it('names no kind the contract does not define', () => {
    // Comments first: this file documents its own selector shape, and a
    // `[data-media='<kind>']` in prose is not a rule. (The first version of
    // this test reported the placeholder from its own header comment.)
    const named = [
      ...stripComments(cssIn(CONTRACT_STYLESHEET)).matchAll(/\[data-media='([^']+)'\]/g),
    ].map((match) => match[1] as string);
    expect(
      [...new Set(named)].filter((kind) => !isMediaKind(kind)),
      'the stylesheet styles a kind that is not in MEDIA_KINDS',
    ).toEqual([]);
  });
});

// ── The two tiers must not drift apart ──
//
// #114 promises plain Markdown images "equivalent framing" to the component
// tier. Equivalent has to MEAN equivalent, and the two live in different files
// for good reasons — the contract is global, the Markdown rules are scoped to
// the Prose component because that is the only thing slotted content can be
// scoped to. Nothing but a test keeps the values in step.
describe('the Markdown tier matches the component tier', () => {
  it('dims a raster by the same amount in both tiers', () => {
    const contract = filters(CONTRACT_STYLESHEET).filter((value) => value.includes('brightness'));
    const markdown = filters(PROSE_COMPONENT).filter((value) => value.includes('brightness'));

    expect(contract.length, 'the contract dims no raster').toBeGreaterThan(0);
    expect(markdown.length, 'the Markdown tier dims no raster').toBeGreaterThan(0);
    expect(
      new Set([...contract, ...markdown]).size,
      `the two tiers dim differently: ${[...new Set([...contract, ...markdown])].join(' vs ')}`,
    ).toBe(1);
  });

  it('leaves a drawn vector alone in both tiers', () => {
    // A vector is already ink on the page's own ground. Dimming or inverting it
    // would be treating a drawing as a photograph.
    const css = stripComments(cssIn(PROSE_COMPONENT));
    expect(css, 'the raster treatment is not excluding SVGs').toContain("img:not([src$='.svg'])");
  });
});
