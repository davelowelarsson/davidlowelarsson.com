# 0006 — Diagrams: break out inline, examine in the lightbox

Date: 2026-07-08
Status: accepted

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
2. **Diagrams break out wider than the prose column.** A reusable `.breakout`
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
4. **Compare-mode and selective image-breakout are explicitly deferred.**
   Before/after is a recurring shape in the author's writing, so a side-by-side
   "compare mode" is plausible future work — but building a general pairing
   feature for a single post is gold-plating. Likewise, plain Markdown
   `![](…)` can't opt one image into breakout without an authoring convention
   (an MDX `<Figure>`, a marker, or a blanket rule). Both are captured on
   issue #11; the `.breakout` foundation is already in place for them to adopt.

## Consequences

- Diagrams are legible inline on desktop and "good enough, tap to examine" on
  mobile, with zero horizontal scroll — the guarantee is locked by e2e specs
  (`scrollWidth <= clientWidth` for every `.mermaid-diagram`, plus a
  page-level no-overflow assertion, at 390px and 1280px).
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
