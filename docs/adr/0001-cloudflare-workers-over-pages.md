# 0001 — Deploy to Cloudflare Workers (static assets), not Cloudflare Pages

Date: 2026-07-07
Status: accepted

## Context

The original project blueprint assumed Cloudflare Pages with its automatic
`<branch>.pages.dev` preview URLs. Since then, Cloudflare has made Workers with
static assets the recommended target for new projects; Pages is in maintenance
mode feature-wise. Astro's own Cloudflare deploy guide now leads with Workers.

## Decision

Deploy `./dist` as Workers static assets, configured in `wrangler.jsonc`.
GitHub Actions owns the pipeline: `wrangler versions upload` on pull requests
(preview URL with drafts visible), `wrangler deploy` on main (production).

## Consequences

- Preview URLs come from Workers versions, not `*.pages.dev`.
- Deploy credentials (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) live as
  GitHub repo secrets; a red CI blocks deploys by construction.
- SSR later requires no infra change — Workers already runs it (see ADR 0002).
- All Cloudflare coupling is contained in `wrangler.jsonc` + the deploy jobs in
  `ci.yml`; moving host means replacing those two pieces only.
