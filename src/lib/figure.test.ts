import { describe, expect, it } from 'vitest';
import {
  BREAKOUT_CLASS,
  figureClass,
  isMediaKind,
  MEDIA_CLASS,
  MEDIA_KINDS,
  type MediaKind,
} from './figure';
import { cssIn, selectorsIn, stripComments } from './stylesheets';

const CONTRACT_STYLESHEET = 'src/styles/media.css';

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

  it('styles the kinds it claims to, one selector each', () => {
    // The claim #114 makes for this contract is that adding a seventh kind is
    // ONE SELECTOR rather than a redesign. That is only true while every kind
    // that exists is reached the same way — so a kind with framing must be
    // reached by `[data-media='<kind>']` and nothing more exotic.
    const styled = MEDIA_KINDS.filter((kind: MediaKind) =>
      selectors.some((selector) => selector.includes(`[data-media='${kind}']`)),
    );
    expect(styled.length, 'no kind has framing yet').toBeGreaterThan(0);
    expect(styled, 'the tracer-bullet kind is not styled').toContain('photo');
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
