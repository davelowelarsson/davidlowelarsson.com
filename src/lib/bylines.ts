// Rotating tagline for the home page. The first entry is the canonical byline
// rendered server-side (and seen by crawlers / no-JS visitors); a tiny client
// script swaps in a random one on each load as a small "sign of life".
//
// Voice: first-person, laid-back, opinions held loosely — direct, but never
// "my way or the highway". Keep entries similar in length to avoid layout shift.
export const BYLINES = [
  'a notebook about how software gets made',
  'a notebook about how I think software gets made',
  'a notebook about how I build software, at least sometimes',
  'how I build software — until something better comes along',
  'notes on making software, opinions held loosely',
  'how I make software, for now',
  'a notebook about building things, and the reasons behind them',
  'how software gets made, from where I’m standing',
  'what I’ve figured out about building software, so far',
  'a notebook about making software — subject to change',
] as const;

// Pure and deterministic: given a random value in [0, 1), return one byline.
// Clamps defensively so an edge value of exactly 1 can't index out of bounds.
export function pickByline(bylines: readonly string[], random: number): string {
  const index = Math.floor(random * bylines.length);
  const safe = Math.min(Math.max(index, 0), bylines.length - 1);
  return bylines[safe];
}
