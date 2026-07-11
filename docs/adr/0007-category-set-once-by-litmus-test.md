# 0007 — Category is set once at writing time, by the litmus test

Date: 2026-07-11
Status: accepted

## Context

Adding `project` (finished-work write-ups) exposed a fuzzy boundary with
`experiment`. Real posts straddle it: spotify-slack-sync started as a lab
thing, evolved into a cronjob that has run quietly for years, and reads like
the story of a finished tool. Two models were considered:

- **Status-based**: `experiment` = still running/being observed (matching the
  live saltast.com tally on the experiment listing page), `project` =
  concluded. Simple, but categories rot — nobody remembers to flip them when
  things conclude, and it re-couples category to age, which ADR 0003 and the
  `project` category deliberately avoid.
- **Kind-based**: classify the write-up by the question it answers, once, when
  it is written.

## Decision

Kind-based, decided by a litmus test at writing time:

> **If the thing had failed, would the post still exist?**
> Yes → `experiment` — there is a hypothesis, and the honest notes and
> measurements are the content; a negative result is still a result.
> No → `project` — the post exists because the thing works; the artifact is
> the content.

Origin and done-ness are explicitly irrelevant: most projects start as lab
work, and a project may keep running indefinitely. The category is set once
and changed only for genuine misfiles (which ADR 0003 keeps link-safe) — never
to track the work's status over time.

When work evolves, that is handled by writing, not re-filing: an experiment
that ships something real keeps its experiment post (lab notes do not stop
being lab notes) and the shipped thing earns a new `project` post, linked via
tags.

## Consequences

- Categorizing is a one-time decision with a mechanical test, made when the
  frontmatter is written; no maintenance burden afterwards.
- The saltast callout stays meaningful without defining the category: things
  still being observed are exactly the things that can still surprise you.
- Existing posts are not swept retroactively; any that read wrongly against
  the litmus test are judged individually, as misfiles, by the author.
- A long-running thing described after the fact (like spotify-slack-sync) can
  sit in `experiment` even though the litmus test would file it as `project`
  today — accepted, because set-once beats churn.
