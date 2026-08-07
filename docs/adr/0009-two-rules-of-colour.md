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

Two measurements sit behind the palette and are worth keeping next to the rules:

- `--tint-til` at its locked `#0f766e` measures **5.28:1** against the locked
  light ground — short of this project's 5.5:1 floor, though comfortably clear
  of WCAG AA. The locked design's own contrast note records the tint range as
  "5.3–7.6" while setting the floor at 5.5, so the design contradicts itself by
  0.22. Rather than change a locked hex mid-implementation, the token is
  carried on `BELOW_FLOOR` in `src/lib/palette.ts` and reported on #94.
- `--plate` (`#eef0ed` light) is part of the locked palette but is **not
  adopted here**, because it has no consumer yet that would not break the
  floor: `muted`, `accent` and `warn` measure 5.17, 5.43 and 5.27 against the
  plate. The prototype only ever puts a plate behind a screenshot, which
  carries no text. It arrives with the media tickets (#117/#118), for
  text-free surfaces.
