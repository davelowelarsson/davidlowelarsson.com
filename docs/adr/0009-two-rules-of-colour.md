# 0009 — Two rules of colour: tints name Categories, the accent means state

Date: 2026-08-07
Status: accepted

## Context

The #11 design pass replaced an ad-hoc palette with a locked one: green-biased
neutrals carrying a trace of the accent's hue, so the greys read as chosen
rather than as leftover `#888`. Adopting the values is the easy half. The half
that rots without a written rule is *what each colour is allowed to mean*.

Two failure modes were close enough to reach for during the design work, and
both would have been reasonable-looking mistakes:

**Using a Category tint as a swatch.** The four tints are built to be legible
as text and distinguishable as words. They are not built to be distinguishable
as adjacent blocks of colour. Measured: `til` (`#0f766e`) and `experiment`
(`#155e75`) sit **ΔE 6.7 apart in normal vision** — a difference that is
obvious when it separates two *words* and invisible when it separates two bar
segments. Any chart that encodes Category as colour is unreadable by
construction, and worse for a reader with a colour-vision deficiency, for whom
the two collapse entirely.

**Letting the accent creep into decoration.** The design reserves exactly one
colour for *state*. Before this ADR the codebase had a `--focus` token as well,
which is the same idea under a second name — and a second name is how a colour
acquires a second meaning. If the accent also marks headings, or rules, or
"important" things, then the focus ring stops being a signal and becomes part
of the wallpaper.

## Decision

**Rule 1 — A Category tint colours the Category word. Never a swatch, never a
chart segment.**

The word carries the meaning; the tint is a scanning aid layered on top of it.
Wherever a tint appears, the Category name is present as text. A chart that
needs to distinguish series uses one hue and varies something else — position,
shape, label, lightness within a single ramp.

**Rule 2 — The accent means state. Link, focus, current, scheduled. Nothing
else.**

`--focus` is retired; `--accent` is the only token for this. A thing painted
with the accent is a thing the reader can act on or is currently on.

## Consequences

- `--focus` is gone. Its three consumers in the global sheet and the one in
  `ProcessStepCard.astro` use `--accent`. A test asserts no `--focus` survives
  anywhere in `src/` — a leftover reference resolves to nothing and paints the
  element invisible, which is exactly the failure a rename leaves behind.
- Category-by-colour-alone is prevented by an e2e assertion, not by memory:
  every tinted badge must contain its Category word as text.
- The rules are cheap to follow now and expensive to retrofit, which is why
  they are written down at the point the palette freezes rather than after the
  first chart wants four colours.
- Rule 1 constrains #123's compare-mode prototype and any future dataviz: those
  get one hue.

## Notes

Two measurements sit behind the palette and are worth keeping next to the rules.
**Both notes below were written before the media tickets landed and both were
stale; corrected here by #124 (ADR 0013) rather than left reading as debt.**

- `--tint-til` at the locked design's `#0f766e` measured **5.28:1** against the
  locked light ground — short of this project's 5.5:1 floor, though comfortably
  clear of WCAG AA. The locked design's own contrast note records the tint range
  as "5.3–7.6" while setting the floor at 5.5, so the design contradicts itself
  by 0.22; #94 carries that finding.

  **That value never shipped.** The token was darkened to `#0c665e` before
  adoption (ΔE 0.4 from the locked hue) and measures **6.58:1** on the light
  ground and **5.97:1** on `--chip`. There is no `BELOW_FLOOR` list in
  `src/lib/palette.ts` — an earlier version of this note pointed at one, and it
  does not exist. **Every text token clears 5.5:1 on both grounds in both
  schemes.** The tightest margin in the system is `tint-project` on `--chip` at
  **5.53**, 0.03 above the floor — worth knowing before anyone nudges a tint or
  a surface.

- `--plate` (`#eef0ed` light) is part of the locked palette and is **not
  adopted, here or later**. It was deferred for want of a consumer that would
  not break the floor: `muted`, `accent` and `warn` measure 5.17, 5.43 and 5.27
  against the plate, and the prototype only ever puts a plate behind a
  screenshot, which carries no text.

  **That consumer arrived and did not need the token.** The `screenshot` kind
  (#124) plates with `--chip`, which over the light ground resolves to
  `#eff0ef` against the locked plate's `#eef0ed` — the same colour to within
  (1, 0, 2) of 255. The locked plate was already in the palette under another
  name, and unlike `--plate` it has a dark value and is already validated as a
  ground. No token is owed.
