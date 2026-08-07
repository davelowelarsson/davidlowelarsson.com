# 0011 — e2e targets a Fixture, never published content

Date: 2026-08-07
Status: accepted

## Context

Most of the e2e suite was about rendering — does a diagram draw, does a summary
band appear, does an image get a `srcset`, does the page scroll sideways at
320px — and almost all of it pointed at published Posts to find out. `mermaid`
loaded the home-lab topology post. `tldr` loaded whichever two Posts happened to
carry a TL;DR. `image-pipeline` loaded a 2020 Raspberry Pi photograph.
`media-aside` loaded an essay for the shape of its aside.

None of those tests cared about the writing. All of them broke when it moved.

That is not hypothetical. Renaming a Post on `main` (`til-astro-7-zod-moved` →
`til-astro-ships-its-own-zod`) failed a spec in the middle of an unrelated
stack, purely because the spec named the old slug. The failure said nothing
about the change that triggered it, and the fix was to edit a test that was
never about that Post.

The coupling also ran the other way. `media-aside` asserted that its two columns
were within 100 rendered pixels of each other, which measured the *runner's font
stack* as much as the layout: `system-ui` is SF on macOS and something wider on
CI's Linux, and the same commit produced 76px locally and 145px on CI. It was
then relaxed to a min/max height *ratio* — scale-free, but still comparing a
text-determined height against an image-determined one, so it still moved
whenever the prose did.

Two problems, one root: **the tests were reading content they did not control.**

## Decision

**An e2e spec that is about rendering targets a Fixture, never a published
Post.**

There are two Fixtures, and there are two because the site has two markdown
processors. `.md` and `.mdx` do not render the same way, and a fixture that
exercised one of them would be measuring half the site.

| Fixture | Slug | What it is |
|---|---|---|
| Component tier | `kitchen-sink` | `.mdx`. Every media component, a diagram, a breakout figure, an embed, self-hosted video with and without a poster. |
| Markdown tier | `kitchen-sink-markdown` | `.md`. Plain images that receive framing through CSS and never become a `<figure>`. |

Between them they hold one of every block the site can render: every heading
level, a TL;DR, ordered and unordered lists nested three deep, a blockquote,
inline and fenced code, a wide table, a horizontal rule, a raster image, an
Excalidraw sketch, a plain vector, a Mermaid diagram, an embed and a video.

They own their assets outright. The raster test cards are synthetic — a flat
ground, a 100px grid, corner markers, a centre cross — generated for these
bundles rather than copied from a Post, so no editorial change can reach them
and a crop or squash regression is visible at a glance on a Preview Deployment.

### Why a permanent draft is safe

Both Fixtures are `draft: true` forever. `src/lib/production-build.test.ts`
already owned the guarantee that a draft reaches no production surface — not the
page, the feed, the sitemap or `llms.txt` — and that guard is itself tested. The
e2e suite builds with `SHOW_DRAFTS=true`, which is what a Preview Deployment
does, so a Fixture is present exactly where it is needed and absent exactly
where it must be.

That test now *names* the two Fixtures as well as looping over whatever drafts
it finds. The loop alone is vacuous for this purpose: a Fixture that silently
stopped being a draft would simply stop being checked.

### What stays pinned, and how it says so

Some tests are genuinely about published content, and pinning is the only honest
thing they can do: RSS completeness, sitemap coverage, JSON-LD, a Post's
Category, whether a *scheduled* Post is marked as one — a permanent draft can
never demonstrate that state. Two components, `ProcessStepCard` and
`WrappedSnapshot`, are ruled outside the figure contract by #114; they render one
Post's own data, and moving them to a Fixture would mean copying that data
across, which is more coupling rather than less.

Those sites opt out **per line**, with a `content-pinned:` marker carrying a
reason — on the line itself, or anywhere in the unbroken comment block directly
above it. Per line, not per file, so a file with one legitimate pin does not
become a place where new pins can hide.

The rule is enforced, not merely written down. `src/lib/e2e-fixtures.ts` is a
pure function; `src/lib/e2e-fixtures.test.ts` runs it over every spec in `e2e/`
and fails on any unexplained slug. It also fails on a slug that no longer
exists, because a stale pin is the exact failure this ADR is about.

### Assert structure, not pixel budgets, for anything sized by text

This is the second half of the decision, and it is the half that was paid for.
Three defects shipped past a green suite in the #11 design pass because
assertions measured rendered text: a height budget on a text column, and twice a
hand-picked viewport breakpoint. All three passed on macOS and failed — or
worse, silently did not fail — on CI's Linux.

A Fixture removes the excuse. When the test owns the content, it can assert the
thing it actually means:

- **Did the image render?** Its rendered ratio equals its intrinsic ratio. A
  collapsed figure fails; the font stack is not involved.
- **Is the layout right?** Box order, DOM order, containment, `aria-current`.
- **Does the page fit?** Sweep the width range; never sample a breakpoint.

A number in an assertion should trace to a *declared* constant — a component's
`34rem` cap, a card's `900x1200` — never to what a paragraph happened to wrap to
on the machine that ran the test.

### Adding a kind of content

A new kind of media, block or component is added to the Fixture in the same
commit that adds it to the site. The Fixture gets better the more it holds; that
only stays true if it is not allowed to fall behind.

## Consequences

**Good.** Editing, retitling or renaming a Post cannot break a test about CSS. A
CSS change has one page to prove itself on, in both processors and both themes.
The Preview Deployment gains a single URL that shows the whole rendering surface
at once, which is a better manual review than reading four real Posts.

**Good, unexpectedly.** The Fixture found a real bug on its first run: a table
with more columns than the viewport can hold pushed the whole *page* sideways at
320px and 390px. `pre` has scrolled inside its own box since it was written;
`table` never got the equivalent, and no published Post happened to carry a table
wide enough to show it. Fixed in the same commit with
`overflow-wrap: anywhere` on cells — only `anywhere` reduces a cell's
min-content width, which is what an auto-layout table uses to decide it cannot
fit, so `break-word` would have wrapped the text and left the page just as wide.

**Cost.** The Fixtures are two more Posts to keep current, and their labels are
load-bearing: renaming a Mermaid node means editing `e2e/mermaid.spec.ts` in the
same commit. That is the trade being made — a fixture's labels are code, and
should be changed like code. A published Post's words are writing, and should
never have been.

**Cost.** Two absorbed fixtures were deleted (`embed-test-fixture`,
`self-hosted-media-fixture`). Single-purpose fixtures are how this problem grows
back; there are two Fixtures, one per processor, and adding a third needs a
reason at least as good as "the processors differ".

**Limit.** This ADR governs the e2e suite. Unit and Container API tests are
already independent of content and are unaffected.
