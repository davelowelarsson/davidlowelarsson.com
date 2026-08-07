/**
 * The figure contract, as data.
 *
 * Every piece of framed media on the site is described by three separately
 * named axes, so that adding a kind never touches layout and moving something
 * never changes what it is:
 *
 *   Layout — how wide.  The existing `.breakout` primitive, unchanged at 60rem
 *                       (ADR 0006). Never a `.media--wide` class: the primitive
 *                       already does that job and is tested.
 *   Kind   — what it is. `data-media`, one of MEDIA_KINDS below.
 *   Placement — where it sits. The existing side attribute, unchanged here.
 *
 * The point of naming the kinds here rather than inline in each component is
 * the claim the contract has to earn: **adding a seventh kind is one selector,
 * not a redesign.** A list in one place is what makes that checkable — the
 * stylesheet must carry a rule for every kind, and a test can say so.
 */

/** What a figure IS. Not how wide it is, and not where it sits. */
export const MEDIA_KINDS = ['diagram', 'chart', 'screenshot', 'photo', 'sketch', 'embed'] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

/** The class every figure in the contract carries, whatever its kind. */
export const MEDIA_CLASS = 'media';

/** The layout primitive a figure opts into to break past the reading measure. */
export const BREAKOUT_CLASS = 'breakout';

export function isMediaKind(value: string): value is MediaKind {
  return (MEDIA_KINDS as readonly string[]).includes(value);
}

/**
 * The class list for a figure: the contract's own class, whatever the component
 * calls itself, and the breakout primitive when it is asked for.
 *
 * Kept out of the components so that "a figure is `.media`, and wide is
 * `.breakout`" is stated once. A component that assembled this string itself
 * could quietly stop being part of the contract.
 */
export function figureClass(componentClass: string, options: { breakout?: boolean } = {}): string {
  return [MEDIA_CLASS, componentClass, options.breakout ? BREAKOUT_CLASS : null]
    .filter(Boolean)
    .join(' ');
}
