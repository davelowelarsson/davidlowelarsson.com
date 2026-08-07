# 0012 — The legibility floor: a diagram stops shrinking before it stops being readable

Date: 2026-08-07
Status: accepted
Supersedes: ADR 0006 §1, in part

## Context

ADR 0006 set out a trilemma and resolved it by giving up one corner. A diagram
should be legible inline, on desktop and phone, with no horizontal scroll —
and a complex enough diagram cannot have all three. 0006 chose to keep "no
horizontal scroll" absolute and let inline legibility be "good enough, tap to
examine" on a phone.

Two things have changed since.

**The escape hatch was never operable.** 0006's answer for the phone case is
the lightbox, and the lightbox cannot be opened from a keyboard at all (#75).
So the reading experience the trade-off assumed — shrink inline, tap to examine
— held for a reader with a pointer and simply failed for everyone else. A
trade-off that gives up legibility in exchange for an inaccessible fallback is
not the trade-off that was agreed.

**The rule was stricter than accessibility requires.** WCAG 1.4.10 Reflow
explicitly exempts content requiring two-dimensional layout for its meaning.
A diagram is the textbook example. 0006 states its own reasoning plainly:
horizontal scroll is *"exactly the swiping we want to avoid."* That is taste,
and 0006 says so. It is a good taste — but it is what the goal is now in
tension with, and taste loses to a reader who cannot read the diagram.

The concrete cost: at 390px a diagram drawn with 12px labels lands near 4px.
That is not a small diagram. It is a picture of a diagram.

## Decision

**A diagram shrinks to fit its container until its label text would fall below
a legibility floor. At that point it stops shrinking, renders at the width that
puts its labels exactly on the floor, and scrolls inside its own container.**

The floor is **9px**. Nine rather than ten because the floor decides when to
*start* scrolling, so a lower value keeps more diagrams in the no-scroll common
case; and 9px of a geometric sans at phone viewing distance is small but
readable. It is a floor, not a target — most diagrams never approach it.

Three things follow, and the third is the reason this gives up less than a
straight reversal of 0006 §1:

1. **Simple diagrams — the common case — never scroll.** The floor only binds
   when fitting would have been illegible. Everywhere 0006 §1 was right, it
   still applies, unchanged and for the same reasons.
2. **The page never scrolls sideways.** The scroll lives one level inside the
   diagram's own box. WCAG's exemption covers the diagram; it does not cover
   the page around it, and neither do we.
3. **A scrolling diagram is keyboard-operable and announced.** The container is
   focusable and carries `role="region"` with a name — but *only while it
   actually scrolls*. A tab stop that goes nowhere and a named region with
   nothing to reach are both worse than nothing.

### The decision is arithmetic, and it lives in the logic layer

```
decideRender({ naturalWidth, containerWidth, baseLabelPx, floorPx })
  -> { mode: 'fit' | 'scroll', renderWidth }
```

`src/lib/legibility.ts`, unit-tested at its boundaries: exactly on the floor, a
pixel either side, absurdly wide, absurdly narrow, and a container narrower than
the floor can ever satisfy. Those are the cases that decide whether the rule is
right, and they are precisely the cases a browser cannot be made to produce
reliably. A render script would have hidden them.

Two properties of the function are worth naming because they are not obvious:

- **It never stretches a diagram past its natural size.** A small diagram in a
  wide column stays small rather than being upscaled to fill it.
- **The floor is a floor, not a ceiling.** A diagram authored with 6px labels is
  illegible even unshrunk, so the same arithmetic *grows* it. `scroll` does not
  mean "too big"; it means "wider than the container, because that is what
  legibility costs here".

Every input is measured from the DOM, so "not measurable" is reachable — a
diagram that has not laid out, a label element that is not there. All of those
fall back to `fit`, which is the behaviour that already shipped and can never
introduce a scroll the reader did not need.

### The guarantee the e2e suite makes is rewritten, not dropped

From *"a diagram never scrolls"* to *"a diagram never scrolls unless the
legibility floor would be breached, and the page never scrolls either way."*

This is **stronger** than what it replaces. The old assertion was a proxy: it
watched `scrollWidth <= clientWidth` and inferred legibility. The new one
measures rendered label size against the floor directly, on both a simple
diagram and a complex one — because a suite with only simple diagrams would
leave the floor's entire reason for existing unexercised.

The measurement is deliberately font-metric-free. It reads the viewBox-to-CSS
scale and multiplies the declared label size by it, rather than measuring a
rendered text box — three assertions in the #11 design pass shipped defects
because they measured text that `system-ui` sets differently on macOS and on
CI's Linux.

## Status of ADR 0006

0006 is **edited, not archived**. Its status now points forward. Specifically:

- **§1 is superseded in part.** "Inline stays fit-to-container — never
  horizontal scroll" holds for every diagram that can be fitted legibly, which
  is most of them. It no longer holds when fitting would breach the floor.
- **§2 stands unchanged.** `.breakout` at 60rem is untouched, still the layout
  axis, still ADR-governed. The floor operates *inside* whatever width breakout
  gives it.
- **§3 is amended by #122**, not here — the lightbox survives, with its purpose
  restated and its keyboard gap closed.
- **§4's deferral of selective image breakout is discharged by #119**, with a
  refusal rather than a mechanism: breakout is a component gesture, and a plain
  Markdown image does not get one.

## Consequences

**Good.** A complex diagram is readable on a phone for the first time, by
scrolling a region that says what it is, from a pointer or a keyboard. The
author keeps the freedom 0006 wanted to protect — draw whatever explains best —
without the implicit "…as long as it stays simple enough to fit".

**Good.** 0006's trilemma resolution — *"if a diagram can't be made legible
within a ~60rem breakout, that's a signal to simplify or split it"* — was advice
the code could not give. The floor gives it: a diagram that scrolls is telling
the author something, visibly, on every phone.

**Cost.** Sideways swiping now exists on the site, in one place, deliberately.
0006 was right that it is unpleasant; it is simply less unpleasant than a
diagram nobody can read.

**Cost.** The decision is re-made on every resize (a `ResizeObserver` per
diagram). Without that, a phone rotation leaves the diagram sized for a width
that no longer exists. The observers are per-diagram and do nothing on pages
without one.

**Limit.** The floor governs Mermaid diagrams, which are the only media whose
label size is knowable from the DOM. A raster screenshot of a diagram cannot be
measured this way and is not covered — the answer there remains "do not ship a
screenshot of text".
