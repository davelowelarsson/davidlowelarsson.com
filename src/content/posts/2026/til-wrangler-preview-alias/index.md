---
title: "Stable preview URLs with wrangler --preview-alias"
description: "Every wrangler versions upload mints a new immutable preview URL ... an alias gives each PR one URL that always serves the latest push."
pubDate: 2026-07-07
category: til
draft: true
tags: ["cloudflare", "workers", "ci"]
---

This site deploys previews with `wrangler versions upload`, and for a while I didn't really
understand that every single push mints a brand new immutable URL of its own, at
`https://<hash>-<worker>.<subdomain>.workers.dev`. Great for pinpointing one commit, and tiring
fast when I'm pushing a lot of small changes, because I couldn't tell which preview was the
correct latest one, and opening an old one didn't help me see how the copy or the layout actually
turned out 😅

So I asked Claude Code, which is incredible for exactly this... understanding a new tool like
wrangler, what options even exist, and which one is likely to be the most helpful. I also ask for
the doc links so I can read the source myself and get a feel for how good the suggestion really
is.

The flag was already there:

```sh
wrangler versions upload --preview-alias pr-${PR_NUMBER}
```

That still publishes the same immutable version, and points a stable alias at it, at
`pr-42-<worker>.<subdomain>.workers.dev`. Our CI takes the alias straight from the PR number,
which is all the separation I was after, one URL per PR that always serves the newest push, and
the sticky PR comment leads with it.

Aliases have to be lowercase letters, numbers and dashes, and start with a letter. The alias and
the worker name together must stay under 63 characters, because the whole thing ends up as a DNS
label. Only the 1000 most recent aliases are kept, which I don't think I'll ever manage to hit
(the Cloudflare limit that did bite me was a different one, the [100 characters a DNS record
comment gets](/posts/til-dnsendpoint-cloudflare-comments/)).

**Takeaway:** `--preview-alias` gives each PR one stable URL that always serves the latest push,
so the tab I keep open through a review never quietly goes stale.

## Links

- [Preview URLs and aliases for Workers](https://developers.cloudflare.com/workers/configuration/previews/)
