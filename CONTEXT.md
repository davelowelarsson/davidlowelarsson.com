# Domain Glossary

## Post

A single piece of writing on the site. Every Post lives in the `posts` content
collection as one markdown file with frontmatter. A Post's identity (its URL,
`/posts/<slug>/`) never encodes its Category — recategorizing never breaks links.

## Category

A frontmatter attribute of a Post describing its kind. Categories drive
presentation and filtering, never identity. Default is `til` — the
lowest-friction kind. Each Category has a listing page (`/category/<name>/`)
whose one-line description **teaches the term** — jargon is allowed in
category names because the page that collects them explains them.

- **essay** — longer, opinionated long-form (the personal-essay tradition:
  Graham, Reilly), not "articles" (journalism) or "blog posts" (says nothing).
- **til** — Today I Learned: a same-day, unpolished note. A genre term from
  dev culture (Willison's TILs); kept because the audience is engineers.
- **experiment** — a write-up from the lab, with measurements and honest notes.

## Draft

A Post with `draft: true` in frontmatter. Drafts are visible on Preview
Deployments and invisible in Production. Draft status is orthogonal to Category.

## Preview Deployment

A build of the site from a non-main branch, published at an obscure URL with
drafts visible. Used to review content and code from any device before merging.

## Production

The build of the `main` branch served at davidlowelarsson.com, with drafts
hidden.

## Core Site

This repository: davidlowelarsson.com. Stable, fast, text-first. The
professional narrative and the writing. Experiments do not live here.

## Sandbox

saltast.com (separate, future). The landing zone for home-lab experiments and
interactive playgrounds. Absorbs all risk so the Core Site stays boring.
