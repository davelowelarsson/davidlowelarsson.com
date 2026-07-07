# davidlowelarsson.com

Personal site of David Lowe Larsson. Astro 7, fully static, deployed to
Cloudflare Workers via GitHub Actions.

## Develop

```sh
npm install
cp .env.example .env   # SHOW_DRAFTS=true → drafts render locally
npm run dev
```

## Quality gates

```sh
npm run verify   # lint + typecheck + unit/component tests + e2e
```

Individually: `npm run lint`, `npm run typecheck`, `npm test`, `npm run e2e`.

## Write a post

Add a markdown file to `src/content/posts/`:

```md
---
title: Something I learned
pubDate: 2026-07-07
category: til   # essay | til | experiment (default: til)
draft: true     # visible in previews, hidden in production
---
```

Open a PR — the preview deployment shows drafts; merging to `main` deploys
production with drafts hidden.

## The publish loop

1. Write a post with `draft: true`, push a branch, open a PR
2. CI runs quality gates, then `deploy-preview` uploads a version built with
   `SHOW_DRAFTS=true`
3. Find the preview URL in the PR's **deploy-preview job output** (the
   `Version Preview URL: https://<hash>-davidlowelarsson-com...workers.dev`
   line) — every push gets a fresh URL
4. Review on any device; iterate by pushing to the branch
5. Ready? Flip `draft: false` (or keep drafting), merge — `main` deploys
   production with drafts hidden

## Where things are decided

- `CONTEXT.md` — glossary (Post, Category, Draft, …)
- `docs/prd.md` — v1 scope and working agreement
- `docs/adr/` — architecture decisions (Workers over Pages, static-with-SSR-hatch, category-as-data)
- `docs/astro-field-guide.md` — running ledger of Astro concepts, PR by PR
