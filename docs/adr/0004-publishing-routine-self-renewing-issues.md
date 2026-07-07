# 0004 — Publishing cadence as a self-renewing GitHub issue loop

Date: 2026-07-07
Status: accepted

## Context

Launch left the site with many drafts (new 2026 posts) and two PRs of recovered
archive material (2020 Ghost blog, 2009–2013 3D portfolio), plus a large mental
backlog of current work worth writing up. The risk is not a lack of material —
it is drift: drafts pile up and nothing ships. Traffic is negligible (≈35 views
day one, mostly the owner), so audience pressure will not drive a cadence; the
routine has to be self-sustaining. It also has to survive tool changes — the
owner works with Claude, Codex, Copilot, and sometimes no agent at all — and
must not leak employer-internal work into a public repo.

## Decision

Publishing runs as fixed ~2-week **cycles**, each backed by exactly two GitHub
artifacts: a dated **milestone** `Content cycle N` and one `content`-labelled
**tracker issue** `Content roadmap — cycle N` (an ordered, dated checklist plus
backlog). Flagship posts get their own linked `content` issues; quick "flip a
drafted post live" steps stay as checklist lines.

The routine renews itself: the **final checkbox of every tracker issue** opens
the next cycle's issue and mandates that the new issue carry the same final
checkbox verbatim. The loop has no terminal state.

The operational detail lives in `docs/publishing-routine.md`, pointed to from the
README and CLAUDE.md so any agent or the owner solo can find it.

## Consequences

- Cadence does not depend on traffic, memory, or a specific agent — the next
  action is always written in the open tracker issue.
- Deliberately **no GitHub Project / board** and no local roadmap file: fewer
  moving parts, one discoverable source of truth, no worktree-sync tax. If a
  calendar/board view is ever wanted, a Project can be layered on later without
  changing the loop.
- Archive material publishes as **cousin posts** (an old piece released as a
  companion to a current one), giving the resurrected content a reason to exist
  rather than reading as a dump.
- Two standing gates guard the public repo: no secrets/internal specifics, and
  employer work stays method-only until cleared.
- The loop can silently die if someone drops the self-copying final checkbox;
  the routine doc calls this out as the one thing to never omit.
