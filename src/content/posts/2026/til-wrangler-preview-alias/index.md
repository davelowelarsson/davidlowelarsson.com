---
title: "TIL: Stable preview URLs with wrangler --preview-alias"
description: Every `wrangler versions upload` mints a new immutable URL — open tabs go stale. An alias gives each branch one URL that always serves the latest push.
pubDate: 2026-07-07
category: til
draft: true
tags: ["cloudflare", "workers", "ci"]
---

> Draft notes from the day it happened — edit before publishing.

This site deploys previews with `wrangler versions upload`: every push gets an immutable
version at `https://<hash>-<worker>.<subdomain>.workers.dev`. Great for pinpointing a commit —
terrible for iterating on copy, because the tab you have open silently stays on the old
version forever. It genuinely looks like "the preview isn't updating".

The fix ships with wrangler:

```sh
wrangler versions upload --preview-alias pr-31
```

That publishes the same immutable version *and* points a stable alias URL —
`pr-31-<worker>.<subdomain>.workers.dev` — at it. Our CI derives the alias from the PR number,
so each PR has one keep-it-open URL that always serves the newest push, and the sticky PR
comment leads with it.

Constraints worth knowing: lowercase letters, numbers, dashes; must start with a letter; alias
plus worker name ≤ 63 characters (DNS); the 1000 most recent aliases are kept.
