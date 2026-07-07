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

Start from the template — it is CI-tested against the frontmatter schema, so
it is always a valid post:

```sh
cp -r templates/new-post src/content/posts/2026/my-post-slug
```

A post is a **bundle**: a folder named after its slug, holding `index.md` plus
everything that belongs to it (images, diagrams). Parent folders organize by
year and never appear in URLs — the folder name IS the slug, and moving a
bundle never breaks a link.

```
src/content/posts/
  2026/
    my-post-slug/
      index.md          → /posts/my-post-slug/
      diagram.svg       → referenced as ![alt](./diagram.svg)
```

Shared images used across posts live in `src/assets/`. Downloadable files
(PDFs etc.) go in `public/files/<slug>/` and are linked absolutely
(`/files/<slug>/paper.pdf`).

Frontmatter in `index.md`:

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
