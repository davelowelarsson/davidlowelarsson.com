---
title: "Workers static assets cap files at 25 MiB"
description: Cloudflare's static-assets hosting refuses any single file over 25 MiB — which quietly decides your whole video strategy for you.
pubDate: 2026-07-07
category: til
draft: true
tags: ["cloudflare", "workers", "video"]
---

> Draft notes from the day it happened — edit before publishing.

Planning how to self-host video on this site (no YouTube, thanks), I assumed the answer was
"put the mp4 in the repo and let the build ship it". Cloudflare says no: Workers static assets
have a hard **25 MiB per-file limit** (20,000 files on the free plan, 100,000 on paid — but the
per-file cap is the same on both).

So the architecture decides itself:

- **Posters, thumbnails, images** — in the repo, through the asset pipeline, served as static
  assets.
- **Video and audio** — encoded locally (ffmpeg), uploaded to an R2 bucket on a dedicated
  subdomain, embedded with a native `<video>` tag. R2 has zero egress fees, which is the whole
  reason self-hosting media on it is economically sane.

The plan for keeping it honest: a committed manifest of what's been uploaded, and a CI check
that diffs post references against the bucket — so removing a video from a post at least
*tells* you the object is now an orphan instead of letting the bucket silently grow.
