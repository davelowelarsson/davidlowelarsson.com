---
title: "A Worker route sits on top of the DNS record"
description: "The day I set up saltast.com I put Worker routes on top of proxied A records, and then the Worker couldn't fetch its own site."
pubDate: 2026-10-13
category: til
draft: false
liveFrom: 2026-10-13
tags: ["cloudflare", "dns", "workers", "networking"]
---

The same day I set up [saltast.com](https://saltast.com), my dashboard for all the
experiments I run, I wanted it on the apex. The zone already had proxied
A records for `saltast.com` and `www`, so I added two Worker routes in `wrangler.toml`,
`saltast.com/*` and `www.saltast.com/*`, and left the records alone.

![Diagram: a visitor's request to saltast.com hits the Worker route and goes into the dashboard Worker, while the proxied A records underneath are never reached. The Worker's own fetch to saltast.com/assets goes back into the route and fails with error 1042, and env.ASSETS.fetch() reads the static files directly](./worker-route-over-dns.svg)

What I hadn't really thought about is that the route takes every matching request
before it ever reaches an origin, so everything on `saltast.com/*` goes straight into
the Worker. Cloudflare still needs the proxied record for the route to trigger at all,
so the records stayed, but for this site they're mostly an anchor.

It shows in the zone list too, the one the dashboard reads as its registry. The
experiments carry a `dash` comment with a title and an icon, but `saltast.com` and `www`
have no comment at all... they're only there so the routes have something to trigger on.

| Record | Comment |
| --- | --- |
| `saltast.com` | none |
| `www.saltast.com` | none |
| `shortener.saltast.com` | `{"dash":1,"t":"URL Shortener v2 (Next)","i":"⚡",...}` |

A couple of hours later I was fixing the image lookup. The Worker checked for an image
override with a `fetch()` to `https://saltast.com/assets/<host>.png`. Now that hostname
belonged to the Worker itself, and a Worker can't fetch a route on its own zone, so
Cloudflare answered with error 1042. I mentioned it briefly in
[the dashboard experiment](/posts/experiment-dashboard-up-when-lab-is-down/).

So I changed it to read the file through the static assets binding instead of over the
network:

```js
const head = await env.ASSETS.fetch(
  new Request(`https://assets.local/assets/${host}.png`, { method: "GET" }),
);
```

**What I learned:** putting the Worker on the apex is what turned a normal `fetch()` into
a self-fetch, so anything the Worker needs from its own site now goes through a binding.
And I picked routes only because the records were already there. Cloudflare recommends a
Custom Domain when the Worker is the origin, so next time I'd check that first 🤔.

## Links

- [Workers routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [Workers errors, including 1042](https://developers.cloudflare.com/workers/observability/errors/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [A dashboard that's up when the lab is down](/posts/experiment-dashboard-up-when-lab-is-down/)
