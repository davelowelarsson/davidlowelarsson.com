# 0006 — Diagrams: break out inline, examine in the lightbox

Date: 2026-07-08
Status: accepted, amended — §1 superseded in part by ADR 0012
Superseded in part by: [ADR 0012 — The legibility floor](0012-the-legibility-floor.md) (§1)

> **Read this first.** §1's absolute ban on inline horizontal scroll no longer
> holds for a diagram that cannot be fitted legibly; ADR 0012 replaces it with a
> legibility floor. §2 (`.breakout` at 60rem) stands unchanged. §3's lightbox
> survives with its purpose restated and its keyboard gap closed (#122, which
> also closes #75). §4's deferral of selective image breakout
> is discharged — with a refusal, not a mechanism — as is §4's compare-mode
> deferral (#123, prototyped and answered without shipping the feature). Each
> section below is marked.

## Context

The first published post carrying Mermaid diagrams
(`experiment-home-lab-topology`) shipped with diagrams that render too small to
read. Two forces both shrink a diagram to the 42rem prose measure: Mermaid's
`useMaxWidth` defaults to `true` (it scales the SVG to 100% of its container),
and `.mermaid-diagram svg { max-width: 100% }` does the same. A wide
`flowchart LR` with long node labels then fits ~672px at ~6px text.

The goal the author actually wants is hard: **always legible inline**, on
desktop *and* phone, with **no horizontal scroll** (we don't want to encourage
sideways swiping), for diagrams that may be genuinely complex. Those three can't
all hold at once — a complex-enough diagram needs width to stay legible, and
forbidding horizontal scroll denies it that width. So the diagram has to be as
large as the layout allows inline, with an escape hatch for the corner cases
(like this long, linear traffic path) where inline can only ever be "good
enough".

Authors keep freedom to pick `flowchart LR` or `TD` per whatever explains best;
this is a rendering/layout decision, not an authoring constraint.

## Decision

1. **Inline stays fit-to-container — never horizontal scroll.** `useMaxWidth`
   stays `true`; the SVG always fits its box. We do *not* switch to
   natural-size-with-scroll inline, because a horizontal scrollbar mid-prose is
   exactly the swiping we want to avoid.

   > **Superseded in part by [ADR 0012](0012-the-legibility-floor.md).** This
   > holds for every diagram that *can* be fitted legibly — most of them, and
   > the reasoning above is still why. It no longer holds when fitting would put
   > label text below the 9px legibility floor: such a diagram stops shrinking
   > and scrolls inside its own container. The page still never scrolls, and
   > `useMaxWidth` is now overridden per diagram rather than trusted.
2. **Diagrams break out wider than the prose column.** *(Stands unchanged —
   the legibility floor operates inside whatever width this gives it.)*
   A reusable `.breakout`
   class (`width: min(60rem, 100vw - 2rem)`, re-centred on the viewport with
   `left: 50%` + `translateX(-50%)`) lets a figure exceed the 42rem measure
   without restructuring the single-column `<body>` (which also holds the
   header/footer). On desktop the diagram gets ~960px instead of ~672px — a real
   legibility gain; on mobile it's full-width-minus-gutter (unchanged); it's
   never wide enough to push the *page* into horizontal scroll. `60rem` is a
   deliberately gentle first cap — a full-bleed visual language is a design
   decision deferred to the #11 typography pass, reachable by raising this one
   number.
3. **A minimal, dependency-free lightbox is the escape hatch.** The existing
   native-`<dialog>` image lightbox is generalised to also open a **clone of the
   inline diagram SVG at natural size** (the `useMaxWidth` cap stripped,
   intrinsic dimensions pinned from the `viewBox`), panned by scrolling the
   dialog. No pan/zoom library and no custom gesture code: native `<dialog>`
   already gives Escape, focus trapping and the backdrop, and browser pinch-zoom
   still works on the dialog content. If real use proves this insufficient,
   pinch-to-zoom is the documented next step — not built now.

   > **Amended by #122 — purpose restated, keyboard gap closed.** ADR 0012's
   > legibility floor removes the justification written above: a diagram no
   > longer needs an escape hatch to be readable. The lightbox survives anyway,
   > because its real constituency was never diagrams — it is bound to every
   > article image, and there are 41 of those against 3 diagrams. What it is
   > FOR is: **examine any figure full-screen.**
   >
   > It was also pointer-only (#75), which is a capability that exists for
   > mouse users and not for keyboard users — not something that can ship into
   > a frozen accessibility floor. Each examinable figure now carries its own
   > button, visually hidden until focused, in the same idiom as the skip link.
   > A sibling button rather than a wrapper, for two reasons: an `<img>` given
   > `role="button"` stops being announced as an image, and a diagram already
   > contains the focusable scroll region ADR 0012 adds, so wrapping it would
   > nest interactive content inside interactive content.
   >
   > The "no pan/zoom library, no custom gesture code" constraint above still
   > stands and is unchanged. Panning from the keyboard needed no library: the
   > dialog is the scroll container, so focusing it on open makes the arrow keys
   > pan. Pinch-to-zoom remains the documented next step, still not built.
4. **Compare-mode and selective image-breakout are explicitly deferred.**
   Before/after is a recurring shape in the author's writing, so a side-by-side
   "compare mode" is plausible future work — but building a general pairing
   feature for a single post is gold-plating. Likewise, plain Markdown
   `![](…)` can't opt one image into breakout without an authoring convention
   (an MDX `<Figure>`, a marker, or a blanket rule). Both are captured on
   issue #11; the `.breakout` foundation is already in place for them to adopt.

   > **Both deferrals discharged.**
   >
   > *Selective image breakout* (#119) — with a REFUSAL rather than a mechanism.
   > Breakout is a component gesture; a plain Markdown image does not get one.
   > No authoring convention was invented, which is the outcome this section was
   > worried about.
   >
   > *Compare-mode* (#123) — prototyped and answered, without shipping the
   > feature. The figure shape holds unchanged: a `figure.media` with a
   > `data-media` kind, a `.media__body` and a caption accommodates two pieces
   > of media in a relationship, because the body already held one child or
   > several. Two findings came out of it and both are worth having before the
   > freeze:
   >
   > 1. **Compare is not a kind.** The media being compared are screenshots;
   >    `data-media` says what a thing IS, and comparison is how two of them are
   >    PRESENTED. A `data-media="compare"` would be a position wearing a kind's
   >    name — the same collision that turned `data-media-side` into
   >    `data-placement`. The pairing belongs on the layout axis, beside
   >    `.breakout`.
   > 2. **A figure may contain an operable control**, which the contract did not
   >    anticipate. A wipe needs a slider and a toggle needs buttons, and neither
   >    the body nor the caption is the right home — the control sits as a
   >    sibling. It costs nothing today, but a figure holding a control is no
   >    longer purely presentational, and that is now written down.
   >
   > The feature itself stays deferred on #55, which is still open. Building a
   > general pairing mechanism for zero current Posts is the gold-plating that
   > deleted the audio component.

## Consequences

- ~~Diagrams are legible inline on desktop and "good enough, tap to examine" on
  mobile, with zero horizontal scroll — the guarantee is locked by e2e specs
  (`scrollWidth <= clientWidth` for every `.mermaid-diagram`, plus a
  page-level no-overflow assertion, at 390px and 1280px).~~
  **Amended by ADR 0012.** "Good enough, tap to examine" assumed an escape hatch
  that was never keyboard-operable, and the e2e guarantee was a proxy: it watched
  for scroll and inferred legibility. Both are replaced — the diagram stays
  legible inline at any width, and the suite measures rendered label size against
  the floor directly.
- The lightbox is now media-type-agnostic via one delegated click listener on
  `<article>` — which also fixes a latent ordering bug: Mermaid swaps its
  diagrams in *after* the Lightbox script runs, so the old one-shot
  `querySelectorAll('article img')` could never have seen a diagram anyway.
- `.breakout` is a general layout primitive, not Mermaid-specific; images and
  other figures can adopt it later with no rework (issue #11).
- The trilemma is resolved by pushing the constraint onto *complexity*: if a
  diagram can't be made legible within a ~60rem breakout, that's a signal to
  simplify or split it, or lean on the examine-modal — not to widen the page.
- Still client-side rendered (ADR-adjacent to the `Mermaid.astro` note): pages
  without a diagram never fetch the mermaid chunk, and that guard test stays.
