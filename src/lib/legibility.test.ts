import { describe, expect, it } from 'vitest';
import { decideRender, LEGIBILITY_FLOOR_PX, type RenderInput } from './legibility';

// The cases a browser cannot be made to produce reliably: exactly at the floor,
// one pixel either side, and the absurd ends. This is why the decision is
// arithmetic in the logic layer rather than a few lines inside a render script.

/** A diagram 800 user-units wide whose labels are set at 16px in those units. */
const BASE: RenderInput = {
  naturalWidth: 800,
  containerWidth: 800,
  baseLabelPx: 16,
  floorPx: LEGIBILITY_FLOOR_PX,
};

describe('LEGIBILITY_FLOOR_PX', () => {
  it('is in the 9–10px band the spec names', () => {
    expect(LEGIBILITY_FLOOR_PX).toBeGreaterThanOrEqual(9);
    expect(LEGIBILITY_FLOOR_PX).toBeLessThanOrEqual(10);
  });
});

describe('decideRender', () => {
  it('fits a diagram that is already narrower than its container', () => {
    // …and does not stretch it past its natural size. Upscaling a small diagram
    // to fill a wide column makes it blurry-looking and enormous for no reason.
    expect(decideRender({ ...BASE, naturalWidth: 400, containerWidth: 800 })).toEqual({
      mode: 'fit',
      renderWidth: 400,
    });
  });

  it('fits a diagram that exactly fills its container', () => {
    expect(decideRender(BASE)).toEqual({ mode: 'fit', renderWidth: 800 });
  });

  // ── The boundary ──
  // At floor 9 and labels 16px, the smallest legible scale is 9/16 = 0.5625,
  // so an 800-unit diagram stays legible down to exactly 450px of container.

  const smallestLegibleContainer = (800 * LEGIBILITY_FLOOR_PX) / 16;

  it('fits when the labels land EXACTLY on the floor', () => {
    const decision = decideRender({ ...BASE, containerWidth: smallestLegibleContainer });
    expect(decision.mode).toBe('fit');
    expect(decision.renderWidth).toBeCloseTo(smallestLegibleContainer, 6);
  });

  it('fits one pixel above the floor', () => {
    expect(decideRender({ ...BASE, containerWidth: smallestLegibleContainer + 1 }).mode).toBe(
      'fit',
    );
  });

  it('scrolls one pixel below the floor', () => {
    expect(decideRender({ ...BASE, containerWidth: smallestLegibleContainer - 1 }).mode).toBe(
      'scroll',
    );
  });

  it('scrolls at exactly the width that puts labels on the floor, not at natural size', () => {
    // The point of the floor: stop shrinking AT the floor. Rendering at natural
    // size instead would scroll further than necessary for no extra legibility.
    const decision = decideRender({ ...BASE, containerWidth: 390 });
    expect(decision.mode).toBe('scroll');
    expect(decision.renderWidth).toBeCloseTo(smallestLegibleContainer, 6);
    expect(decision.renderWidth, 'scrolls further than the floor requires').toBeLessThan(800);
  });

  it('scrolls when the container is narrower than the floor can ever satisfy', () => {
    const decision = decideRender({ ...BASE, containerWidth: 50 });
    expect(decision.mode).toBe('scroll');
    expect(decision.renderWidth).toBeCloseTo(smallestLegibleContainer, 6);
  });

  it('never renders narrower than the container when it fits', () => {
    // A fitted diagram that reported a width smaller than the container would
    // leave a gap that reads as a layout bug.
    for (const containerWidth of [200, 390, 640, 1280]) {
      const decision = decideRender({ ...BASE, naturalWidth: 100, containerWidth });
      expect(decision.mode).toBe('fit');
      expect(decision.renderWidth).toBeLessThanOrEqual(containerWidth);
    }
  });

  it('handles an absurdly wide diagram', () => {
    const decision = decideRender({ ...BASE, naturalWidth: 100_000, containerWidth: 390 });
    expect(decision.mode).toBe('scroll');
    expect(decision.renderWidth).toBeCloseTo((100_000 * LEGIBILITY_FLOOR_PX) / 16, 6);
  });

  it('handles an absurdly narrow diagram', () => {
    expect(decideRender({ ...BASE, naturalWidth: 1, containerWidth: 390 })).toEqual({
      mode: 'fit',
      renderWidth: 1,
    });
  });

  it('upscales when the labels are already below the floor at natural size', () => {
    // A diagram drawn with 6px labels is illegible even unshrunk. The floor is a
    // floor, not a ceiling: it is reached by growing as well as by not shrinking.
    const decision = decideRender({ ...BASE, baseLabelPx: 6, containerWidth: 800 });
    expect(decision.mode).toBe('scroll');
    expect(decision.renderWidth).toBeGreaterThan(800);
  });

  // ── Degenerate input ──
  // The measurements come from the DOM, so zero and NaN are reachable: a
  // diagram that has not laid out yet, or a label element that is not there.
  // Falling back to `fit` is the safe answer — it is today's behaviour, and it
  // can never introduce a scroll that the reader did not need.

  it('falls back to fitting when the label size cannot be measured', () => {
    for (const baseLabelPx of [0, Number.NaN, -1]) {
      expect(
        decideRender({ ...BASE, baseLabelPx, containerWidth: 390 }).mode,
        `${baseLabelPx}`,
      ).toBe('fit');
    }
  });

  it('falls back to fitting when the diagram has no measurable width', () => {
    for (const naturalWidth of [0, Number.NaN]) {
      expect(
        decideRender({ ...BASE, naturalWidth, containerWidth: 390 }).mode,
        `${naturalWidth}`,
      ).toBe('fit');
    }
  });

  it('falls back to fitting when the container has not been laid out', () => {
    expect(decideRender({ ...BASE, containerWidth: 0 }).mode).toBe('fit');
  });
});
