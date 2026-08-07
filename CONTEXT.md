# Domain Glossary

## Post

A single piece of writing on the site. Every Post lives in the `posts` content
collection as one markdown file with frontmatter. A Post's identity (its URL,
`/posts/<slug>/`) never encodes its Category — recategorizing never breaks links.

## Category

A frontmatter attribute of a Post describing its kind. Categories drive
presentation and filtering, never identity. Default is `til` — the
lowest-friction kind. Each Category has a listing page (`/category/<name>/`)
whose one-line description **teaches the term** — jargon is allowed in
category names because the page that collects them explains them.

- **essay** — longer, opinionated long-form (the personal-essay tradition:
  Graham, Reilly), not "articles" (journalism) or "blog posts" (says nothing).
- **til** — Today I Learned: one thing learned, written close to the moment,
  short and unpolished. Domain-free — code, parenting, cooking, woodwork; the
  tags carry the subject. May wrap a copyable block (a manifest, a command, a
  recipe). The name is a genre term from dev culture (Willison's TILs), kept
  even though the subjects range wider.
- **experiment** — a write-up from the lab, with measurements and honest notes.
- **project** — a write-up of a finished piece of work (client job, art piece,
  side-build): what it was, the tools, and the author's part in it. Kind, not
  age — an old project is still a project; `pubDate` alone says "archive".

The experiment/project boundary is decided once, at writing time, by the
litmus test: **if the thing had failed, would the post still exist?** Yes →
experiment; no → project. Origin and done-ness are irrelevant, and the
category is changed only for genuine misfiles — never to track the work's
status over time (ADR 0007).

## Draft

A Post with `draft: true` in frontmatter. Drafts are visible on Preview
Deployments and invisible in Production. Draft status is orthogonal to Category.

## TL;DR

An optional 3–5 bullet summary near the start of a Post. Author it as ordinary
Markdown: `## TL;DR` immediately followed by a list. That single shape works in
both `.md` and `.mdx`, and the Core Site styles the rendered `#tldr` heading and
adjacent list as one summary band. It is not a blockquote — David is summarizing
his own Post, not quoting another source. Its styling is part of the frozen
non-media style (see Frozen Style below).

## Fixture

A Post that exists only to be tested against, kept `draft: true` forever. There
are two — `kitchen-sink` (`.mdx`) and `kitchen-sink-markdown` (`.md`) — one per
markdown processor, holding one of every block the site can render. A Fixture's
prose is placeholder text describing the block below it: it never reaches a
reader, so it is not voice-bearing and does not go through `/draft-post`. Its
node labels, captions and asset names *are* load-bearing and change like code.
Every e2e spec that is about rendering targets a Fixture; a spec that is
genuinely about published content pins it with a `content-pinned:` reason
(ADR 0011).

## Scheduled Post

A non-draft Post with a future `liveFrom`. Merged and committed — it publishes
itself when its time arrives. Shown in full on Preview Deployments (with a
scheduled badge); in Production its URL serves a Teaser until it goes live.

## Teaser

The page served in Production at a Scheduled Post's URL before its `liveFrom`
arrives: the Post's title and its **expected** date, but no content. It exists
so a deliberate inbound link never dead-ends on a 404. Reachable only by direct
link — never listed, fed, or shown to search engines. Replaced by the real
Post once it is live.

## Preview Deployment

A build of the site from a non-main branch, published at an obscure URL with
drafts visible. Used to review content and code from any device before merging.

## Research Visual

A chart or diagram that explains findings from external research. The default is
an original, deliberately simplified interpretation of the cited data, visibly
labelled with and linked to its primary source. It must never imply that David
performed the research. Reproduce an original third-party visual only when that
visual itself is being discussed and its license allows reuse; keep its branding
intact and name the creator, license, and source in a visible caption. Alt text
describes the image for accessibility — it is never the attribution.

## Figure

Any piece of framed media in a Post. A Figure is described by **three axes**,
named separately so that adding a Kind never touches layout and moving something
never changes what it is (ADR 0013):

- **Layout** — *how wide.* The `.breakout` primitive at 60rem (ADR 0006 §2).
  Breaking the reading measure is a deliberate act, so it is a component gesture:
  a plain Markdown image does not get one.
- **Kind** — *what it is.* The `data-media` attribute, one of the six Kinds below.
- **Placement** — *where it sits.* The `data-placement` attribute. Distinct from
  Kind on purpose: Kind says what a thing **is**, Placement says where it sits.

## Kind

What a Figure **is** — never how wide it is, and never where it sits. There are
six, and the list is closed until something earns a seventh: a Kind exists only
when it answers the framing questions **differently from every existing Kind**.

- **diagram** — a Mermaid diagram, drawn from the design tokens so it follows
  the reader's theme. Subject to the legibility floor (ADR 0012).
- **chart** — a drawn data visual, typically a Research Visual. Framed and
  otherwise left alone: dimming a drawing treats it as a photograph.
- **screenshot** — a picture of an interface. Never cropped, never dimmed, and
  given an edge by the page — every answer the opposite of **photo**, which is
  what makes it a Kind rather than a photograph with a different caption.
- **photo** — a photograph. Framed, not restyled; dimmed slightly on a dark
  ground so a bright raster does not glare.
- **sketch** — an Excalidraw drawing (`*.excalidraw.svg`), inverted on a dark
  ground. Authored as plain Markdown; it has no component and is not getting one.
- **embed** — a third-party iframe or a video. Its own Kind because **the page
  controls the box and never the interior**.

**Compare is not a Kind.** The things being compared are screenshots, or photos,
or diagrams; comparison is how two of them are *presented*, so it belongs on the
Layout axis. The feature is #55 and is not built.

## The two-tier contract

The figure contract covers components and plain Markdown images **unequally**,
and the inequality is deliberate rather than unfinished work (ADR 0013):

- **The component tier** emits the whole Figure — a `<figure class="media">`
  carrying a Kind, a body, and a caption.
- **The Markdown tier** gives a plain `![alt](path)` image *equivalent framing
  through CSS* and nothing more. Those images never become a `<figure>`, never
  carry a Kind, and never take a caption.

So "one contract for all media" is true for components and **approximately** true
for Markdown. Say "the component tier" or "the Markdown tier" when the difference
matters — most of the surprises in this system live exactly on that line.

## Breakout

A Figure that runs wider than the reading measure. It is the Layout axis, and
the only width decision a Post can make — there is no half-step and no
full-bleed. Breaking out is a deliberate authorial act, which is why it is a
component gesture and a plain Markdown image is never offered one (ADR 0013).
_Avoid_: "wide media", "full-bleed" — the first names a mechanism that does not
exist, the second a width deliberately not offered.

## Legibility floor

The smallest a diagram's label text is allowed to become. A diagram shrinks to
fit its container until its labels would fall below the floor; at that point it
stops shrinking and scrolls inside its own container instead, while the page
around it never scrolls sideways (ADR 0012).

The floor is why an author keeps the freedom to draw whatever explains best: a
diagram that scrolls is telling its author it has grown too complex, visibly and
on every phone. It governs diagrams only — a screenshot of text cannot be
measured this way, and the answer there is not to ship one.

## Examine

Opening any Figure full-screen to look at it closely — by pointer or by
keyboard. Deliberately *not* "the diagram escape hatch", which is what it was
before #122 restated its purpose: its real constituency is the site's images,
not its handful of diagrams. The surface it opens into is the **Lightbox**.

## Authoring snippet

The copyable source shown beside an example in a Fixture, tagged with the tier
it belongs to so it says *which kind of file it goes in*. Fixtures are therefore
the authoring reference as well as the test target, and a guard keeps a snippet
from drifting away from the example it documents.

## Cousin Post

An archive piece published as a companion to a current one — the tactic that
lets old writing re-enter the feed without pretending to be new. A Cousin Post
is an ordinary Post; the word describes *why it is scheduled when it is*, not a
property of the writing. See `docs/publishing-routine.md`.

## Cycle

The unit of publishing cadence: roughly two weeks, tracked by exactly one open
issue whose last checkbox opens the next Cycle — so the routine renews itself
rather than needing to be restarted. A Cycle is a *container for a cadence*, not
a deadline for a Post: one Post a month is the floor, not a failure.

A Post counts as published when it is verified against the production feed.
Merging is not publishing — see Scheduled Post.

## Production

The build of the `main` branch served at davidlowelarsson.com, with drafts
hidden.

## Core Site

This repository: davidlowelarsson.com. Stable, fast, text-first. The
professional narrative and the writing. Experiments do not live here.

## Sandbox

saltast.com (separate, future). The landing zone for home-lab experiments and
interactive playgrounds. Absorbs all risk so the Core Site stays boring.

## Frozen Style

The non-media visual design settled by issue #11: the palette, the contrast
floor, the rhythm, the masthead, the theme control, the Post header and the
section dividers. Frozen means future issues do not adjust it in passing — a
change to any of it is its own decision, with its own reason.

What is frozen, and where it is decided:

- **Colour** — `src/lib/palette.ts` is the only place a colour is defined; the
  stylesheet mirrors it and a test enforces both directions. Two rules govern
  what colours *mean*: ADR 0009.
- **The contrast floor** — 5.5:1 for text, deliberately above WCAG AA's 4.5:1
  so a token cannot drift into "technically passing". WCAG AA is a second floor
  with no exceptions at all.
- **Theme** — three states, auto being the absence of `data-theme`: ADR 0010.
- **Rhythm** — measure, type size, leading and section/figure spacing, as
  tokens in `Base.astro`'s `:root`.

**The media system is now frozen too**, on the same terms. #113 froze the
non-media slice; #124 closes the media effort — the Figure's three axes, the six
Kinds, the two-tier contract, Mermaid theming and the legibility floor. Together
they complete #11.

Where the media half is decided:

- **The framing contract** — three axes, six Kinds, the two-tier limit and the
  two refusals: ADR 0013. The Kinds live as data in `src/lib/figure.ts`; a test
  enforces that the stylesheet and the list agree in both directions.
- **Breakout and the lightbox** — ADR 0006, §1 superseded in part by ADR 0012.
- **The legibility floor** — 9px, ADR 0012.
- **What the system can render** — the two kitchen-sink Fixtures, which carry a
  copyable snippet beside every example and are guarded against drifting from
  it (ADR 0011).

Frozen means the same thing here as everywhere: a change to any of it is its own
decision, with its own reason — not something a future ticket adjusts in passing.
