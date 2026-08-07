/**
 * The legibility floor: how wide to draw a diagram.
 *
 * The old rule was "a diagram always shrinks to fit its column, and never
 * scrolls" (ADR 0006 §1). It is stricter than accessibility requires — WCAG
 * 1.4.10 Reflow explicitly exempts content needing two-dimensional layout,
 * which a diagram is — and 0006 states its own reasoning as taste: "exactly
 * the swiping we want to avoid."
 *
 * Taste is what the goal is now in tension with. Fit-to-container on a phone
 * does not make a complex diagram good enough; it makes it a thumbnail. At
 * 390px a 12px label lands near 4px, and the reader's only recourse today is a
 * lightbox that cannot be opened from a keyboard.
 *
 * The new rule gives up less than a straight reversal: a diagram shrinks to fit
 * until its labels would fall below the floor, and only then stops shrinking
 * and scrolls inside its own container. Simple diagrams — the common case —
 * never scroll at all, so 0006's intent survives everywhere it was right and
 * swiping appears only when the alternative is illegibility. The page itself
 * never scrolls either way.
 *
 * This is arithmetic, so it lives here rather than inside a render script:
 * exactly at the floor, a pixel either side, and the absurd ends are cases a
 * browser cannot be made to produce reliably, and they are the cases that
 * matter.
 */

/**
 * Below this, a label is present but not readable.
 *
 * 9px rather than 10: the floor decides when to START scrolling, so a lower
 * value keeps more diagrams in the no-scroll common case, and 9px of a
 * geometric sans at typical phone viewing distance is small but legible. It is
 * a floor, not a target — most diagrams never approach it.
 */
export const LEGIBILITY_FLOOR_PX = 9;

export interface RenderInput {
  /** The diagram's own width, in its own units (its viewBox width). */
  naturalWidth: number;
  /** The width available to it on the page. */
  containerWidth: number;
  /** Label size at natural scale, in the same units as `naturalWidth`. */
  baseLabelPx: number;
  /** The smallest label size that still counts as readable. */
  floorPx: number;
}

export interface RenderDecision {
  /** `fit` never scrolls; `scroll` scrolls INSIDE the diagram's own container. */
  mode: 'fit' | 'scroll';
  /** The width to draw the diagram at, in CSS pixels. */
  renderWidth: number;
}

/** A measurement that came back as 0, NaN or negative is a measurement we do not have. */
function isMeasured(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function decideRender({
  naturalWidth,
  containerWidth,
  baseLabelPx,
  floorPx,
}: RenderInput): RenderDecision {
  // Every input is read from the DOM, so "not measurable" is reachable: a
  // diagram that has not laid out yet, or a label element that is not there.
  // Falling back to `fit` is the safe answer — it is the behaviour that already
  // shipped, and it can never introduce a scroll the reader did not need.
  if (!isMeasured(naturalWidth) || !isMeasured(containerWidth) || !isMeasured(baseLabelPx)) {
    return { mode: 'fit', renderWidth: Math.max(containerWidth, 0) || 0 };
  }

  // Never stretch a diagram past its own size just because the column is wide.
  const fittedWidth = Math.min(containerWidth, naturalWidth);

  // The floor is a floor, not a ceiling: a diagram drawn with 6px labels is
  // illegible even unshrunk, so this can be greater than 1 and grow it.
  const smallestLegibleScale = floorPx / baseLabelPx;
  const legibleWidth = naturalWidth * smallestLegibleScale;

  if (fittedWidth >= legibleWidth) return { mode: 'fit', renderWidth: fittedWidth };

  // Stop shrinking AT the floor. Rendering at natural size instead would scroll
  // further than necessary and buy no extra legibility.
  return { mode: 'scroll', renderWidth: legibleWidth };
}
