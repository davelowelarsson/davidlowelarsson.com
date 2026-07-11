---
name: draft-post
description: Writing sessions for posts on davidlowelarsson.com in David's own voice — new drafts (interview-first), voice-checking existing drafts, and iterating on prose or structure. Use whenever drafting, editing, reviewing, or discussing post content, or when David invokes /draft-post with an idea, a path, or an editing instruction.
---

# Writing sessions in David's voice

Read [VOICE.md](./VOICE.md) first — always, before touching any prose. It
defines the voice (Tier 1 canon), the living corpus (Tier 2), genre budgets,
and the anti-pattern list. Where anything conflicts, VOICE.md wins.

**Authorship rule.** David is the author. This skill produces drafts,
flag lists, and revisions for him to shape — it never publishes, never flips
`draft: false`, never sets or changes `liveFrom`, and never decides what gets
written. Ideas for new posts go to the content roadmap issue as a title, not
as drafted content.

## Mode: new draft — interview first

A draft can only sound like David if it's built from material only he has.
Before writing a word, interview him (one round, 4–6 questions, skip any he's
already answered):

1. **The moment.** What concrete thing happened that starts this post? (A
   date, a person, a broken thing, a conversation — the canon never opens on
   a topic.)
2. **The one thought.** What's the single thing you want a reader to get?
   (One — the canon posts carry exactly one.)
3. **The real details.** Which names, repos, numbers, links, dates belong in
   it? (No placeholders — if there's no real detail, ask again.)
4. **The cost.** What didn't work, what does it not solve, what are you
   unsure about? (Canon closes hedged; experiments admit limitations.)
5. **Category & language.** essay / til / experiment? English or Swedish?
6. **Anything to fit around?** An image, a video, an existing series?

Then draft **once**, at the genre budget from VOICE.md, into a new bundle:
`src/content/posts/<year>/<slug>/index.md` with frontmatter
(`title`, `description`, `pubDate`, `category`, `draft: true`, `tags`).
Always `draft: true`. Before handing it over, self-run check mode (below) on
your own draft and fix what it flags — do not deliver prose that fails the
canon.

## Mode: check — voice-lint, never rewrite

`/draft-post check <path>` (or any ask to review a draft's voice). Read the
file, measure it against VOICE.md, and return a **flag list** — do not edit
the file:

```
## Voice check: <path> (<words> words, budget <budget>)

| # | Line(s) | Flag | Rule | Suggestion |
|---|---------|------|------|------------|
| 1 | 12      | "It is not vanity. It is communication." | anti-pattern 1 (antithesis) | state it flat: "For me this is communication ..." |
```

Order flags most-damaging first (length and structure before phrasing). End
with the 2–3 cuts that buy the most. Count densities where the rule is a
density (antithesis, punch paragraphs, emoji). Never flag David's own texture
(typos, "So" openers, "...", hedges) — that IS the voice; see VOICE.md.

## Mode: iterate

Any other instruction — "third paragraph, lean into X", "make it fit this
image", "shorter close" — is an edit session inside the loaded voice. Make
the requested change, keep everything else untouched (especially David's own
texture), and mention if the change pushes the post against a VOICE.md rule
rather than silently complying or silently refusing.

## Canon maintenance

- Tier 1 changes only on David's explicit "promote `<slug>` to the canon" —
  then add the file path to VOICE.md's list in the same session.
- Tier 2 is automatic (all published non-draft posts); nothing to maintain.
- If a Tier 1 path no longer exists (post renamed/moved), warn David and fix
  the list before drafting anything.
