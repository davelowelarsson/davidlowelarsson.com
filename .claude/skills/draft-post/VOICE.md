# David's writing voice

Derived 2026-07-11 from the Tier 1 canon (below) — the posts David wrote
entirely by hand. When anything here conflicts with a newer post on the site,
this file wins.

## The canon

**Tier 1 — bedrock.** Voice rules come from these seven files only. This list
changes only when David explicitly says "promote `<slug>` to the canon."

- `src/content/posts/2020/building-with-children/index.mdx`
- `src/content/posts/2020/raspberry-pi-cluster/index.md`
- `src/content/posts/2013/cgfx-and-glsl/index.md`
- `src/content/posts/2013/git-the-new-svn/index.md`
- `src/content/posts/2013/maya-scene-python-to-xml/index.md`
- `src/content/posts/2020/dev-sec-and-ops/index.md`
- `src/content/posts/2020/segling-del-1/index.md`

**Tier 2 — living corpus.** Every published, non-draft post under
`src/content/posts/` (glob it fresh each session; it grows on its own). Use
Tier 2 for subject matter, terminology, and continuity with what's already on
the site — never for voice. Where Tier 2 prose contradicts a rule below, the
rule stands: some Tier 2 posts are AI-assisted and carry the house style this
file exists to escape.

## Voice DNA

- **Rhythm.** Long, comma-chained, conversational sentences are the default;
  clauses joined with "and", "but", "so" and trailing "...". Sentence
  fragments happen and are fine ("He had started a home project, doing almost
  the same thing."). Short declaratives are punchlines, used once or twice per
  post ("I tinkered."), never a running device.
- **Paragraphs.** 2–4 sentences, loose. A one-sentence paragraph is allowed
  for a rhetorical question or flat declarative ("Deliver? Deliver to
  whom?!") — rarely, organically, never as recurring structure.
- **Person.** First person throughout; "we" for family and teams. No
  instructional "you" — narrate David's own experience, don't advise the
  reader. (The one exception in the canon is the 2013 tutorial register;
  don't revive it.)
- **The "..." tic.** Three literal dots as a pause/hedge, mid-sentence, often
  with a surrounding space: "So I needed to change my approach...". This is
  the most identifiable mark on the page. Never replace with an em-dash;
  em-dashes do not exist in the canon.
- **"So" openers.** Paragraphs regularly begin with "So" as connective glue
  ("So it was time to downsize."). Load-bearing tic — keep it.
- **Hedging.** Specific soft phrases, not academic qualifiers: "I'm not sure
  how to...", "my thought is to...", "might not always be an option", "we'll
  see", "time will tell", "maybe a better word is efficient 🤔". Never
  "arguably" / "it could be said".
- **Enthusiasm.** Plain exclamation or clause-end emoji, immediately
  qualified or undercut in the next clause. Optimism is always hedged.
- **Emoji.** English posts, 2020-register onward: roughly one per 100–150
  words, always at clause end, never opening a sentence, never stacked beyond
  two (😁👍). None in Swedish posts.
- **Humor.** Dry, self-aware, carried by parenthetical asides — "(don't ask
  me why that design choice was made, it's a real pain)" — not standalone
  jokes.
- **Self-description.** Honest and plain: "I'm no programmer even though I do
  have some experience in writing code." No false-modesty flourishes.
- **People.** Named individuals credited generously, with a link and a direct
  thank-you: "Thanks Sheldon! 😁👍". Family through lineage and craft
  (morfar → mamma → me), not staged anecdotes.
- **Links.** Inline, natural anchor text mid-sentence ("check out
  [Beanstalk](...)"); "[Watch the video](...)" as a bare caption-link after a
  demo paragraph. Never a bare URL, never "click here".

## Openings and closings

Open on a concrete personal trigger — "When corona spread to Sweden (where I
live) I went to the office and brought home the Arduino stat kit" — never a
topic statement, category claim ("X is one of those things that...") or
"In this post I will...".

Close on forward-looking uncertainty ("we'll see how this will work ... time
will tell 😁", "I look forward to the next iteration"), on a bare artifact
(a link, a caption), or just stop after the last fact. Never a thesis
restatement, never a recap list, never a moral.

## Structure

- Headings: 0–4 `##` per post, short noun phrases or questions ("Why not use
  the cloud?", "The kids were skeptical (and still are)"). **Never**
  colon-subtitle constructions ("The first version: automation without
  autonomy").
- Tables and numbered lists only where the 2026 conventions permit them
  (genuine comparison, genuinely sequential procedure — see below). At most
  one inventory-style bullet list when literally listing things (services to
  run). Everything else is narrated in prose.
- At most one code block per post, only when the post is about the code.
- Blockquotes only as framing (a personal disclaimer, a quoted book) — never
  pull-quotes of the post's own thesis.
- Images with an italic one-line caption or none at all.

## Swedish register (segling-del-1)

Shorter sentences, no headings, no emoji in the body, no captions. Plainer
and starker than the English posts. Family lineage stated matter-of-factly.
Don't import English-post structure or emoji density into Swedish drafts.

## Texture — never fabricate, never sand away

The canon carries fingerprint texture: dropped apostrophes ("Im", "arent"),
lowercase mid-sentence "i", "way to simple", "etc. etc.", the stray Swedish
word ("...or there's some kind och blocker"). Rules:

- **Drafting:** write clean. Manufacturing David's typos is forgery, not voice.
- **Editing/checking:** never "correct" texture in prose David wrote unless he
  asks. It is his fingerprint, not an error backlog.

## David-confirmed current register

First-party rewrites from current drafts can sharpen how the canon is applied
without automatically joining Tier 1. Keep these observations evidence-based;
they guide new drafts immediately, while promotion to the canon still requires
David's explicit instruction.

- **Evidence accumulates in the sentence.** When several checks all mattered,
  David may name them one after another and repeat the conclusion ("All tests
  passed, linting looked good, everything was typed, everything looked good")
  instead of compressing them into "the pipeline was green." The repetition
  carries the feeling of why saying no was difficult.
- **Decisions include the room.** Preserve who discussed and decided something:
  "we discussed it in the team" and "we decided not to merge it" are more
  truthful than turning a shared decision into one engineer's abstract rule.
- **Risk lands in ordinary consequences.** Name the service, the users, or the
  hassle a mistake creates. Prefer plain stakes such as a streaming service not
  working or creating bad will over polished phrases like "operational impact."
- **Parentheses can question the thought in real time.** They are not only for
  jokes; "(I think)" and "if it works, it works, right 🤷" let confidence and
  doubt sit in the same paragraph.
- **Technical confidence uses everyday framing.** Keep phrases such as "jumped
  into Astro head first," "from 0 to a deployed working site in a day," and
  "my super simple abstraction" when they are David's words. Do not translate
  them into portfolio language.

## Deliberate 2026 conventions (David's explicit choices)

Interviewed 2026-07-11. These are conscious additions the canon doesn't
show — where they conflict with a canon-derived rule, THESE win, and check
mode must not flag them:

- **TL;DR** — case-by-case, decided in the drafting interview. When wanted:
  3–5 bullets at the top. A TL;DR does not license a closing recap too —
  the ending stays canon (hedged, no summary).
- **Links footer** — an optional `## Links` section at the end collecting
  the docs, repos, and tools the post touched. David's public bookmark
  trail — encourage it whenever a post leans on external docs. Inline links
  in prose stay canon style.
- **Small comparison tables** — allowed when genuinely comparing 2–3 things
  side by side. Flag only decorative tables (restating what prose already
  said).
- **Numbered steps** — allowed for genuinely sequential procedures (setup,
  pipelines). Prose narration stays the default for everything else.
- **Mermaid/diagrams** — welcome in experiments for architecture and flow.
- **Images** — encourage one or two per post; they make the read. Drafts
  include placeholder slots with a suggested concept and alt text
  ("photo: the pi cluster in the closet") for David to fill.
- **Emoji** — lighter than the 2020 canon: a few per post where they land
  naturally, clause-end as always. Not one-per-paragraph confetti.
- **Word vetoes** (growing list, David's explicit calls) — "terse" (2026-07-13:
  "I would lean into concise more"); prefer the plain word he'd actually say
  ("concise", "short").
- **No "TIL:" prefix in titles** (decided 2026-07-13) — the category badge
  and the /category/til/ page carry the genre; the title names the one thing
  learned so it stands alone in RSS and search.
- **TILs are domain-free and may carry blocks** (decided 2026-07-13) — one
  thing learned, from any part of life, optionally wrapped around a copyable
  block (a manifest, a one-liner, a recipe). No snippet/regular subtypes —
  tags and the text say what was learned. The point is saving it publicly,
  attached to David.

## Genre shapes and budgets

| Genre | Budget (words) | Shape |
|---|---|---|
| essay / personal story | 350–900 | concrete trigger → 2–4 plain-phrase sections → hedged, forward-looking close |
| experiment | 600–1000 | what I wanted (boring goal) → what I did, narrated → what it cost / doesn't solve → "next iteration" close |
| til | 200–300 prose (blocks don't count) | one thing learned, any domain (code, kids, cooking, wood); hook on the moment of surprise → what I learned → bold **Takeaway:** one-liner; optionally carries a copyable block (config, command, recipe); tags carry the subject |
| Swedish personal | 120–400 | no headings, images, plain close |

The **Takeaway:** closer and the honest-limitations section are site
conventions from the 2026 era that David keeps — render them, but in canon
voice. `dev-sec-and-ops` (1562 words) shows the budget stretches when David
is genuinely worked up about something; a draft should not grant itself that
license.

## Anti-patterns (the LLM tells — check mode flags these)

Measured against the canon, these are absent or near-absent; their presence
marks prose that isn't David:

1. Antithesis set-pieces — "That is not X. It is Y." / "not X, but Y" — max
   once per post, ideally zero.
2. Colon-subtitle headings.
3. One-sentence punch paragraphs as recurring rhythm (>2 per post).
4. Instructional "you".
5. Thesis restated in the close; closing recap bullet lists; "In summary".
   (A top-of-post TL;DR is a deliberate convention, not a recap — see above.)
6. Rhetorical tricolons ("the X, the Y, the Z" triads).
7. Decorative tables and numbered lists — ones restating what prose already
   says. Genuine comparisons and genuinely sequential procedures are
   deliberate conventions (see above).
8. Generic placeholders ("someone in marketing", `<domain>.se`) where David
   would name the person, repo, number, or date.
9. Em-dashes as rhythm; semicolons.
10. Word count beyond the genre budget.
11. Openers that state a category instead of a moment.
12. Uniform polish — every hedge removed, every "So" opener trimmed, every
    "..." replaced. If it reads like documentation, it isn't him.
