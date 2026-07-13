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
- **til** — Today I Learned: one thing learned, written close to the moment,
  short and unpolished. Domain-free — code, parenting, cooking, woodwork; the
  tags carry the subject. May wrap a copyable block (a manifest, a command, a
  recipe). The name is a genre term from dev culture (Willison's TILs), kept
  even though the subjects range wider.
- **experiment** — a write-up from the lab, with measurements and honest notes.
- **project** — a write-up of a finished piece of work (client job, art piece,
  side-build): what it was, the tools, and the author's part in it. Kind, not
  age — an old project is still a project; `pubDate` alone says "archive".

The experiment/project boundary is decided once, at writing time, by the
litmus test: **if the thing had failed, would the post still exist?** Yes →
experiment; no → project. Origin and done-ness are irrelevant, and the
category is changed only for genuine misfiles — never to track the work's
status over time (ADR 0007).

## Draft

A Post with `draft: true` in frontmatter. Drafts are visible on Preview
Deployments and invisible in Production. Draft status is orthogonal to Category.

## Scheduled Post

A non-draft Post with a future `liveFrom`. Merged and committed — it publishes
itself when its time arrives. Shown in full on Preview Deployments (with a
scheduled badge); in Production its URL serves a Teaser until it goes live.

## Teaser

The page served in Production at a Scheduled Post's URL before its `liveFrom`
arrives: the Post's title and its **expected** date, but no content. It exists
so a deliberate inbound link never dead-ends on a 404. Reachable only by direct
link — never listed, fed, or shown to search engines. Replaced by the real
Post once it is live.

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
