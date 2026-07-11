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
- No tables. No numbered step lists. At most one inventory-style bullet list
  when literally listing things (services to run). Procedure is narrated in
  prose.
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

## Genre shapes and budgets

| Genre | Budget (words) | Shape |
|---|---|---|
| essay / personal story | 350–900 | concrete trigger → 2–4 plain-phrase sections → hedged, forward-looking close |
| experiment | 600–1000 | what I wanted (boring goal) → what I did, narrated → what it cost / doesn't solve → "next iteration" close |
| til | 200–300 | 1–2 sentence hook (the bug/surprise) → what happened → fix → bold **Takeaway:** one-liner |
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
5. Thesis restated in the close; recap bullet lists; "In summary".
6. Rhetorical tricolons ("the X, the Y, the Z" triads).
7. Tables and numbered step lists.
8. Generic placeholders ("someone in marketing", `<domain>.se`) where David
   would name the person, repo, number, or date.
9. Em-dashes as rhythm; semicolons.
10. Word count beyond the genre budget.
11. Openers that state a category instead of a moment.
12. Uniform polish — every hedge removed, every "So" opener trimmed, every
    "..." replaced. If it reads like documentation, it isn't him.
