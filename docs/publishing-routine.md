# Publishing routine

The standing ritual that keeps posts shipping instead of piling up as drafts.
This is the **editorial cadence** layer; the mechanical per-post flow (draft →
PR → preview → merge) lives in the README's "The publish loop" section.

Agent-neutral by design: this must run whether the help is Claude, Codex,
Copilot, or nobody — you working alone one evening. Nothing here depends on a
particular tool. If you are an agent reading this, the human is in the driver's
seat for all writing; do not draft post content into issues unasked.

## The shape

- Work in **cycles** of ~2 weeks, aiming for **1–2 posts/week**.
- Each cycle is exactly two GitHub things — nothing more (**no GitHub Project**,
  see `adr/0004`):
  1. A **milestone** `Content cycle N` with a due date (the deadline container +
     progress bar).
  2. One **`content`-labelled tracker issue** `Content roadmap — cycle N`: an
     ordered, dated checklist of what to publish, plus a backlog.
- Real writing work (a flagship post) gets its **own `content` issue** with a
  brief, linked from the tracker. Quick "flip a drafted post live" steps stay as
  checklist lines.

## The self-renewing loop (do not break this)

The **last checkbox of every tracker issue** is always, verbatim:

> **Open the next content-cycle issue and close this one.** Pick the next 4–6
> items (backlog + fresh ideas from the last two weeks); give each a target date
> and enough detail to pick up cold; split real writing into its own `content`
> issue; create milestone `Content cycle N+1` with a due date. **The new issue's
> final checkbox MUST be this exact step, worded the same.**

That single self-copying step is the whole routine. If a tracker issue is ever
missing that final box, the ritual has quietly ended — restore it. This is
deliberately a loop with no terminal state: publishing is a habit, not a project
that completes.

## Current cycle

Locator that survives renumbering: **the open issue labelled `content` whose
title starts `Content roadmap — cycle`.** As of 2026-07-07 that is:

- Tracker: **#40** — Content roadmap, cycle 1
- Flagship writes: **#38** (Gateway API migration), **#39** (alt-text @ 20k)
- Milestone: **Content cycle 1**, due 2026-07-31

## Editorial principles

- **Notebook, not résumé.** Working-in-the-open beats a polished wall. At low
  traffic there is no "when's X coming?" pressure — that is exactly when to build
  the habit.
- **Old posts are roots — never ship one alone.** Pair a resurrected post with a
  current companion that references it. That turns "old stuff" into "a thread I'm
  still pulling."
- **Cousin posts.** A specific tactic for the archive: lightly polish an old
  publication and release it *as a companion* to a current post on the same
  thread (e.g. the 2020 rpi-cluster next to today's home-lab topology). The old
  and the new cross-link; readers feel the arc from *then* to *now*. Prefer
  publishing archive material this way rather than in a lump.
- **One thread at a time.** Let each post breathe; ~1–2/week.
- **Merge ≠ publish.** Drafts are invisible in production, so merging is safe
  cleanup. Publishing is a small PR that flips `draft: false` (+ a field-guide
  line if it introduces an Astro concept).
- **Redaction (public repo).** Two gates, both must pass before anything ships:
  (1) no secrets / internal hostnames / cluster names / configs; (2) work that
  belongs to the employer is not yours to publish until cleared — keep it about
  the *method*, abstract the specifics, or use invented stand-ins.

## Running a cycle (any agent, or solo)

1. Open the current tracker issue. Work its checklist top-down; tick boxes as you
   ship. Respect the target dates as nudges, not law.
2. For a "flip drafted post live" line: read the draft, `npm run verify`, flip
   `draft: false`, PR, merge.
3. For a flagship line: work its linked `content` issue's brief. Draft on a
   branch, review on the preview URL, redact, verify, flip, merge.
4. When the checklist is done (or the milestone's due date arrives), run the
   **final checkbox**: spin up cycle N+1 per the rule above, carrying the
   self-renewing checkbox forward. Close the old tracker.

## Mining the vault for material

The backlog is fed by your Obsidian vault and old publications — but the vault is
**not** the publish surface (see README: never point automation at the whole
vault). Mining produces *redacted one-line backlog seeds*, never raw content.

- **What a good seed looks like:** a problem you actually solved; a gotcha that
  cost you an afternoon; a decision with real trade-offs; a "how do I…" you have
  re-looked-up more than once; a question colleagues keep asking you; a snippet
  you keep re-copying (→ a `til` with the *why*, not a paste bin).
- **Where they hide:** journal entries with relief markers ("finally", "turns
  out"); notes you revisit often; `#idea`/`#til`/TODO tags; presentations and
  decks; command snippets you reach for repeatedly.
- **The funnel:** vault note → candidate one-liner → **redaction check** →
  backlog line in the tracker issue → a future cycle promotes it to a draft.
- **On automated mining:** if/when you want machine help finding candidates, use
  a **local model (Ollama)** pointed at an explicit export folder, emitting only
  topic one-liners — never a hosted agent, never the whole vault. Until you have
  decided otherwise, this stays a manual pass. (You have said you are not ready
  to let a cloud agent into the vault; this doc honours that.)
