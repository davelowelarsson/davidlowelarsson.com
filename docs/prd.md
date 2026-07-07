# PRD — davidlowelarsson.com v1

## Purpose

Revive davidlowelarsson.com (dormant WordPress) as a stable, fast, text-first
personal site: professional narrative (3D-art roots → technical leadership,
DORA metrics advocacy, purpose-driven values) plus a low-friction writing
outlet. Vibe anchors: Lee Robinson's scannability, Tanya Reilly's
culture/values focus. Experiments belong to saltast.com (separate, later).

## Non-goals (v1)

- No interactivity, comments, search, or analytics.
- No saltast.com work in this repo.
- No visual ambition beyond clean typography — content first.

## Definition of Done (v1)

1. Landing page: positioning, links to LinkedIn/GitHub, path to posts.
2. `posts` collection with zod schema (title, pubDate, category, draft, tags)
   and at least one draft post.
3. Draft workflow proven end-to-end: draft visible on a PR preview URL,
   absent from production.
4. CI green on every PR: Biome lint, `astro check`, Vitest unit + component
   tests, Playwright e2e smoke — full pyramid, TDD throughout.
5. Deployed to Cloudflare Workers, reachable at davidlowelarsson.com.

## Working agreement

- GitHub issues carry acceptance criteria; each issue is worked test-first on
  a branch, reviewed via its preview URL (mobile-friendly), merged when CI is
  green. `/goal` conditions come from issue acceptance criteria.
- Every PR appends a short entry to `docs/astro-field-guide.md`: which Astro
  concept it introduced, why this shape, doc link. Speed now, learning ledger
  for David to read on his own schedule.
- Glossary in `CONTEXT.md`; decisions in `docs/adr/`.
