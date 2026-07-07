---
title: "TIL: Cloudflare zone routes overlay proxied DNS records"
description: "A Worker route and a proxied DNS record can both claim the same hostname — and Cloudflare picks the route, silently."
pubDate: 2026-03-04
category: til
draft: false
tags: ["cloudflare", "dns", "workers", "networking"]
---

> **WIP/TEST** — placeholder content while the site's design is under construction.

I spent an evening chasing a "why is my Worker not seeing this request" bug that turned out to
be the opposite problem: the Worker *was* seeing it, and the origin never got a chance.

![Abstract composition of overlapping translucent layers suggesting routing precedence](./til-cloudflare-zone-routes.svg)

## The setup

A proxied (orange-cloud) `A` record for `app.example.com` pointing at an origin, plus a Worker
route for `app.example.com/*` attached to a completely different Worker, added months earlier for
a one-off redirect.

I assumed DNS resolution and Worker routes lived in separate layers that composed politely.
They don't, not in the way I expected.

## What actually happens

Cloudflare evaluates **routes before DNS**, at the edge, for any proxied hostname. A route match
short-circuits the request straight into a Worker. The DNS record still resolves and still serves
traffic for anything the route pattern *doesn't* match, which is exactly why the bug was so
confusing — most paths worked fine.

- `app.example.com/*` — swallowed entirely by the stale route
- `app.example.com/health` — same route, same swallowing, health checks quietly redirected

## The fix

`wrangler routes list` (or the dashboard's Workers Routes tab) to enumerate every route on the
zone, not just the ones in the current project's `wrangler.toml`. Routes are zone-level, not
project-level — a route from an unrelated repo can still be live on a shared zone.

Deleted the stale route, traffic hit the origin again immediately, no propagation delay.

**Takeaway:** on a zone with multiple Workers, treat routes as a shared, append-only surface.
Audit them independently of any single project's config.
