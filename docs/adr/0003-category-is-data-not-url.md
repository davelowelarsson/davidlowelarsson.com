# 0003 — Category is frontmatter data, never part of the URL

Date: 2026-07-07
Status: accepted

## Context

The site hosts different kinds of writing: essays, TILs, experiment write-ups.
Sites like simonwillison.net separate TILs into a distinct section with its own
URLs. The owner explicitly does not want to remember which stream a piece was
written in, and wants the freedom to restructure presentation later "as long as
we stay true to the markdown and frontmatter."

## Decision

One `posts` collection. `category: 'essay' | 'til' | 'experiment'` is a zod
enum in frontmatter (default `til`). URLs are `/posts/<slug>/` for every Post
regardless of category. Filtered views (e.g. a TIL listing) are queries over
the same collection.

## Consequences

- Recategorizing a Post never breaks a link.
- New categories are a one-line enum change plus content.
- Presentation (badges, filtered pages, ordering) can be redesigned freely;
  the markdown files are the stable substrate.
- We give up category-scoped URL namespaces (e.g. `/til/slug`); if ever wanted,
  they can be added as redirects or alias routes without moving content.
