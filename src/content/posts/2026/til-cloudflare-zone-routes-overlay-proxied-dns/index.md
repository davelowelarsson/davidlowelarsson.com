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
experiments I run, I wanted it on `saltast.com` itself. The zone already
had proxied A records for `saltast.com` and `www`, so I added two Worker routes in
`wrangler.toml`, `saltast.com/*` and `www.saltast.com/*`, and left the records alone.

![Diagram: a visitor's request to saltast.com hits the Worker route and goes into the dashboard Worker, while the proxied A records underneath are never reached. The Worker's own fetch to saltast.com/assets is rejected with error 1042, and env.ASSETS.fetch() reads the static files directly](./worker-route-over-dns.svg)

What I hadn't really thought about is that matching requests go straight into the
Worker, before they ever reach the server the A records point to. Cloudflare still needs
the proxied records for the routes to work, so I left them there... and in the zone list
the dashboard reads, they have no `dash` comment like the experiments do, they're just
sitting there so the routes have something to trigger on.

A couple of hours later I was fixing the image lookup. The Worker checked for an image
override with a `fetch()` to `https://saltast.com/assets/<host>.png`, which matched the
route I'd just added... so the Worker was trying to fetch its own route, and Cloudflare
answered with error 1042. I mentioned it briefly in
[the dashboard experiment](/posts/experiment-dashboard-up-when-lab-is-down/).

So I changed it to read the file through the static assets binding instead of over the
network:

```js
const head = await env.ASSETS.fetch(
  new Request(`https://assets.local/assets/${host}.png`, { method: "GET" }),
);
```

**What I learned:** I picked routes only because the records were already there, and I
didn't think about the Worker fetching its own site. Cloudflare recommends a Custom
Domain when the Worker is the whole site, so next time I'd check that first, and keep
the Worker's own files on the `ASSETS` binding from the start 🤔.

## Links

- [Workers routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [Workers errors, including 1042](https://developers.cloudflare.com/workers/observability/errors/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [A dashboard that's up when the lab is down](/posts/experiment-dashboard-up-when-lab-is-down/)
