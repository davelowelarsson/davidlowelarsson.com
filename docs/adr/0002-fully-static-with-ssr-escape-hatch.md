# 0002 — Fully static output, with a deliberate SSR escape hatch

Date: 2026-07-07
Status: accepted

## Context

v1 is a landing page plus a posts collection — nothing needs runtime rendering.
But the owner explicitly does not want to be locked out of SSR or dynamic
rendering later, and wants the site portable: Cloudflare today, possibly GitHub
Pages or self-hosted tomorrow.

## Decision

`output: 'static'` (Astro's default), no adapter installed. Draft visibility
(`SHOW_DRAFTS` via `astro:env`) is resolved at build time. Portability comes
from the output being plain HTML in `./dist`, deployable to any static host.

## Consequences

- The build output runs anywhere: Workers, GitHub Pages, nginx on a home lab.
- Upgrading to SSR = `npx astro add cloudflare` + marking pages server-rendered.
  Same deploy target, no migration — this is why Workers (ADR 0001) keeps the
  hatch open.
- Logic that might one day run at request time (e.g. draft filtering) is kept
  in pure functions under `src/lib/`, indifferent to when they execute.
