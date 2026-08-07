# 0013 — The figure contract: three axes, six kinds, and its two-tier limit

Date: 2026-08-07
Status: accepted
Amends: ADR 0006 §4 (discharged), ADR 0009 (Notes corrected — see below)

## Context

Before this effort, every component that showed something invented its own
framing. `ArticleImage`, `MediaAside`, `ImagePair`, `WrappedSnapshot`, `Video`,
`YouTube` and `ProcessStepCard` each decided independently how wide a thing was,
whether it had a border, whether it dimmed on a dark ground and what a caption
looked like. Nothing was shared, so nothing could be reasoned about: "make
screenshots consistent" meant editing seven files and hoping.

The corpus is also mostly **not** components. 41 plain Markdown images across 35
Posts carry no syntax at all — just `![alt](path)`. Any contract that only
governs components governs a minority of the media on the site.

#114 specified one framing vocabulary. This records what it turned out to be,
what it deliberately does not cover, and the two things it refuses.

## Decision

### Three axes, named separately

A figure is described by three things that are allowed to vary independently:

| Axis | Expressed as | Question it answers |
|---|---|---|
| **Layout** | `.breakout` | *how wide* |
| **Kind** | `data-media` | *what it is* |
| **Placement** | the side attribute (`data-placement`) | *where it sits* |

They are separate so that **adding a kind never touches layout, and moving
something never changes what it is**. The axes live as data in
`src/lib/figure.ts`, not inline in each component, because the claim the whole
contract rests on — *adding a seventh kind is one selector, not a redesign* —
is only checkable if the list exists in one place. `src/lib/figure.test.ts`
checks it in both directions: no kind is styled that the contract does not
declare, and no kind is declared that has no framing and no stated reason.

Layout is the **existing** `.breakout` primitive at 60rem, unchanged and still
governed by ADR 0006 §2. The design's proposed `.media--wide` never appears; a
test asserts it never will. A second name for a mechanism that already exists and
is already tested is a liability, not a convenience.

**Placement was one character of meaning away from being wrong.** It was briefly
`data-media-side`, which reads as a variant of the kind. `data-media` says what a
thing *is*; `data-placement` says where it sits. They are not merged back.

### Six kinds, and what makes something a kind

`diagram`, `chart`, `screenshot`, `photo`, `sketch`, `embed`.

A kind is not a synonym for a file type. **Something earns a kind when it answers
the framing questions differently from every existing kind** — and the pair that
proves the rule is `photo` and `screenshot`, which answer *every* question the
opposite way:

| | `photo` | `screenshot` |
|---|---|---|
| Cropping | harmless | destroys the subject |
| Dimming on a dark ground | yes — a bright raster glares | never — it contains text |
| An edge from the page | not needed | required |

Behind the whole inversion: a screenshot is captured in **one** theme and the
reader may be in the other, and unlike a `sketch` it cannot simply be inverted to
match — inverting a UI destroys its brand colour, its syntax highlighting and any
photograph inside it. So it is framed as a picture of *a different surface*
rather than made to pretend it belongs to this one. `embed` is its own kind for a
related reason: **the page controls the box and never the interior**, so its
treatment is entirely box and deliberately reaches nothing inside.

Two kinds are reached without `data-media`, and both are consequences of the
tiering rather than oversights:

- **`diagram`** is emitted client-side by `Mermaid.astro` as `.mermaid-diagram`,
  and #121 draws it from the design tokens directly — its framing *is* the
  diagram. An empty `[data-media='diagram']` rule would be a rule written to
  please a guard.
- **`sketch`** has no component and is not expected to get one. Sketches are
  authored as plain Markdown and reached by path (`*.excalidraw.svg`).

The test that excuses them does not stop checking them: an excused kind must
still be styled *somewhere*, or it is simply missing.

### The two-tier limit — stated, not glossed

**The contract has two tiers, and they are not equal.**

- **The component tier** emits the full figure: a `<figure class="media">` with a
  `data-media` kind, a `.media__body`, and a caption.
- **The Markdown tier** gives a plain image *equivalent framing through CSS*, and
  nothing else. Those images **never become a `<figure>`, never carry a kind, and
  never take a caption.**

So #11's "one contract for all media" is **true for components and approximately
true for Markdown**. The approximation is the whole limit, and it is written here
so it is known rather than discovered.

The Markdown tier is keyed on the image **path**, which is not a trick — it is
the only door available (see the first refusal). The corpus already follows
conventions, so the path is enough:

```
*.excalidraw.svg   sketch  — inverted on a dark ground
other .svg         drawn   — no plate, no dimming; it is already ink
raster             one framed treatment, dimmed on a dark ground
```

**`photo` versus `screenshot` is deliberately not inferred from a filename** —
too fragile for the gain, and one raster treatment serves both. That is the
sharpest illustration of the limit: the distinction the component tier considers
important enough to justify a separate kind is one the Markdown tier cannot make
at all.

"Equivalent" has to *mean* equivalent, and the two tiers live in different files
for good reasons — the contract is global, the Markdown rules are scoped to the
Prose component because slotted content cannot be scoped to anything else.
Nothing but a test keeps their values in step, so there is one: both tiers must
dim a raster by the identical amount, and both must leave a drawn vector alone.

### The two refusals

Recorded because **a refusal nobody wrote down gets re-proposed**. Both of these
already have been, repeatedly.

**1. No remark, rehype or unified. Ever, for styling reasons.** Astro's native
Markdown processor has no plugin hooks. Adding "a plugin" therefore does not add
a plugin — it migrates the entire content pipeline onto unified, changing how
every one of 35 Posts is parsed, to adjust how images look. The cost is a
pipeline migration and the benefit is CSS. Refused three times.

**2. Breakout on a plain Markdown image is a no.** Not "not yet" — a no.
Breakout is a **component gesture**: choosing to break the reading measure is a
deliberate act with a caption-alignment consequence, and it belongs where an
author is already making deliberate choices. Offering it in Markdown would mean
inventing authoring syntax for it, which is refusal 1 wearing a hat. This
discharges ADR 0006 §4's deferral of selective image breakout **with a refusal
rather than a mechanism**.

### A figure may contain an operable control

Discovered by #123's compare-mode prototype and recorded before it can bite: a
figure holding a control is no longer purely presentational. The control sits as
a **sibling** of `.media__body` — not inside it, and not in the caption. Nothing
today needs this; it costs nothing to have written down and would be expensive to
discover later.

Relatedly, and for the same reason `data-placement` is not `data-media-side`:
**compare is not a kind.** The things being compared are screenshots, or photos,
or diagrams. Comparison is how two of them are *presented*, so it goes on the
layout axis beside `.breakout`. #55 carries the feature and stays open.

## The record this corrects

### ADR 0006

Its status already points forward and stays that way: §1 superseded in part by
ADR 0012, §2 unchanged, §3 amended by #122, §4 discharged in both halves —
selective image breakout by the refusal above, compare-mode by #123.

### ADR 0009's Notes were stale in two places

Both are corrected in that file rather than left to read as outstanding debt.

- **`--tint-til` is not below the floor and is not on an exemption list.** The
  note describes the *locked design's* `#0f766e` at 5.28:1. That value was
  darkened to `#0c665e` before adoption and never shipped; the token measures
  **6.58:1** on the light ground and **5.97:1** on `--chip`. The `BELOW_FLOOR`
  list the note points at no longer exists in `src/lib/palette.ts`.
- **`--plate` did not arrive with #117/#118, and does not need to.** The note
  promises it for text-free surfaces. `screenshot` is that consumer, and it uses
  `--chip`, which over the light ground resolves to `#eff0ef` against the locked
  plate's `#eef0ed` — the same colour to within (1, 0, 2) of 255. The locked
  plate was already in the palette under another name, and unlike `--plate` it
  has a dark value and is already validated as a ground.

Every text token now clears the project's 5.5:1 floor on both grounds in both
schemes. The tightest margin in the system is **`tint-project` on `--chip` at
5.53** — 0.03 above the floor. Worth knowing before anyone nudges a tint or a
surface.

## Consequences

**Good.** "Make every screenshot sit on a plate" is one selector in one file.
The claim was stress-tested rather than asserted: #123 threw the hardest
available case at it — two pieces of media in a relationship, with a control
between them — and the figure shape held with no structural change.

**Good.** The 41 plain Markdown images are framed with no author edits and no
syntax to remember, which is the only way a framing rule reaches a corpus written
before the rule existed.

**Cost.** Two tiers means two places, kept in step by a test rather than by
construction. If the test is deleted the tiers drift silently — which is exactly
why the test asserts values match rather than merely that both exist.

**Cost.** The Markdown tier reads paths, so it depends on Astro rewriting a
processed raster to `/_astro/<name>.<hash>.webp` while leaving an SVG as `.svg`,
keeping the original basename in both. That is a documented behaviour of the
build, not a guess, but it is a dependency on a build detail and it is named here
so a future Astro upgrade knows to check it.

**Limit.** Astro's scope attributes outrank global rules, so a component's scoped
style beats `src/styles/media.css`. A kind can never override a component from
outside — the component has to defer
(`.article-image:not([data-media='screenshot'])`). The contract governs by
agreement of the components, not by force.
