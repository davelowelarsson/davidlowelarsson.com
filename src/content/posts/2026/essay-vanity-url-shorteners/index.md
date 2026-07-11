---
title: "The hard part of vanity URLs is not the redirect"
description: "A URL shortener looks like a tiny routing problem until the people using it need autonomy, and the engineers have to protect the shared production namespace."
pubDate: 2026-07-14
liveFrom: 2026-07-14
category: essay
draft: false
tags: ["platform-engineering", "routing", "url-shorteners", "product"]
---

A URL shortener is one of those projects that feels almost too small to be interesting.

Take a long URL, store it somewhere, map a shorter string to it, redirect the request. Done. A good lab Friday project. Maybe a weekend project if you also want a UI and some basic stats.

And in isolation that is mostly true.

The hard part starts when the short link is not really a short link anymore. It becomes a promise that someone outside engineering can create a public route on the main domain, without waiting for a developer, and without accidentally stepping on something production already needs.

That is a very different problem.

I have tried to build this a couple of times at work, in the gaps of time between larger platform migrations and the normal flow of meetings, planning, syncs etc 😅. This ask was completely reasonable, and the systems around it made it harder than it looked.

Someone in editorial or marketing wants a clean link like:

```txt
<domain>.se/summer
```

or:

```txt
<domain>.se/podcast
```

That is not vanity in the silly sense. It is communication. A link has to be read out loud, printed, put in a graphic, shared in a campaign, remembered by a human. `utm_campaign=summer_2026_launch_phase_2` might be useful for analytics, but nobody wants to say it on stage.

So the human need is simple: "Can I make a short, memorable URL myself?"

The engineering need is also simple: "Can we let you do that without breaking anything else?"

Those two needs are not enemies. They just live in the same namespace, the same domain.

## The first version: automation without autonomy

The first version I built was the classic version. Node, Express, MongoDB, a generated ID, and a redirect endpoint. It did exactly what a URL shortener does in the tutorial version of the problem.

```ts
app.get('/:alias', async (req, res) => {
  const { alias } = req.params;

  const url = await db.collection('urls').findOneAndUpdate(
    { alias },
    { $inc: { visits: 1 } },
    { returnDocument: 'after' },
  );

  if (!url.value) {
    return res.status(404).send('Not found');
  }

  return res.redirect(301, url.value.targetUrl);
});
```

It was small, fast, and honestly quite nice in the way small Express apps can be nice. There was very little ceremony. A request came in, a lookup happened, a counter moved, and the user went somewhere else.

But it missed the actual product requirement.

It generated links for people. It did not give people control over links.

That distinction matters. A generated ID like `qK9_2x` is fine when the only goal is to make a URL shorter. It is useless when the goal is to make a URL memorable.

I had solved the data mapping problem and left the human workflow almost untouched. Someone still needed to decide where the link should point, ask for it, get something back, maybe ask for a better one, and then keep track of it somewhere else.

That is automation, but not autonomy.

## The second version: autonomy with too much machine around it

The next attempt corrected that mistake with the confidence of a person, me, who had learned exactly one lesson and then over-applied it.

If the problem was that people needed control, then I would give them a control plane. A dashboard. A backend. Authentication. Custom slugs. Stats. A real content model. The whole thing.

I ended up with a decoupled frontend and a headless CMS backend, which is a lot of machinery for storing a source URL, a destination URL, a status, and a visit count.

It worked. That is the annoying part. It gave people the shape of what they needed: log in, create a slug, choose the destination, see whether anyone used it.

But the cost was completely out of proportion to the value.

The frontend needed to know where the API lived. Some of that happened at build time, some at runtime, and suddenly a tiny redirect service had opinions about internal and external network paths. The backend had to be reachable from the browser, which meant it was not only an internal service anymore. The two halves had to be deployed, configured, upgraded, and debugged together.

Nothing about that is a scandal. Those are normal trade-offs for a normal web application. They were just too much trade-off for this one.

I had moved from "too little product" to "too much platform".

## The part that is easy to underestimate

The standalone shortener is not the scary part. Put it on a subdomain like `s.<domain>.se`, and the problem becomes pretty manageable. The service owns that namespace. If `/summer` exists there, it exists because the shortener created it. If it does not, return 404. Clean enough.

The real request is almost always the nicer one:

```txt
<domain>.se/summer
```

Not:

```txt
s.<domain>.se/summer
```

And that is where the root domain starts pushing back.

The main production domain already has routes. Some are obvious. Some are old. Some belong to a CMS, some to APIs, some to authentication, some to campaigns from last year that are still linked from a PDF nobody remembers owning.

When you let a self-service tool create paths at the root, you are no longer only creating redirects. You are allowing colleagues outside engineering to reserve part of the production route space.

That can be perfectly fine. It can even be the right thing to do. But it needs guardrails, because the failure mode is not "someone created an ugly link." The failure mode is "someone created a perfectly reasonable link that happened to be a route the platform already needed."

| Path | Why it might be protected | What a collision could do |
| --- | --- | --- |
| `/api/*` | Application traffic | Intercept requests meant for backend services |
| `/login` | Authentication | Send users away from the login flow |
| `/checkout` | Revenue path | Break or confuse a business-critical journey |
| `/campaign` | Existing campaign | Replace a live route that still has traffic |
| `/old-but-still-used` | Forgotten dependency | Break links nobody remembered until they failed |

The last row is the one that keeps this interesting. The risky paths are not only the obvious ones. They are also the old ones. The semi-owned ones. The ones that are "probably dead" but still appear in a newsletter archive, a school resource, a printed poster, or a partner site.

## The index nobody wants until they need it

This is where the problem stops looking like a URL shortener and starts looking like an inventory problem.

Before a person can safely claim `/summer`, the system needs to know whether `/summer` is free. Not just whether it is absent from the shortener database. Whether it is free in the whole production system.

That means some kind of route index.

SEO data and sitemaps can look like a shortcut here, but they are a little deceptive. A sitemap tells search engines what you want them to find. It is not a complete map of everything the system owns.

There are routes that should never be in a sitemap. There are redirects created during migrations. There are old campaign URLs that still matter because someone bookmarked them, printed them, or linked them from a partner site. There are application routes that only exist for logged-in users. There are also routes that return 404 today, but are still part of a service's namespace.

That last one is especially annoying.

A 404 usually feels like a free signal. Nothing is there, so surely the path is available? But if `/program/123456` returns 404, that does not necessarily mean the vanity tool should be allowed to claim it. It might mean there is no program with that ID right now. The `/program/*` space can still belong to the program service, and a future program might live there later.

The same thing happens with "fast" matching rules. It is tempting to make the redirect layer very simple: check a few prefixes, decide quickly, move on. But then someone creates a perfectly reasonable vanity URL like `/pro-wrestling-night`, and suddenly the system has to know that `pro` is not the same thing as `/program/*`.

You can work around that. Reserve exact paths. Reserve full prefixes. Prefer exact matches over fuzzy ones. Make the admin UI reject ambiguous slugs. Add manual review for risky words. There are many reasonable guardrails.

The difficult part is not that any one of those rules is impossible. The difficult part is seeing enough of the possible variations before they become production conflicts.

Not necessarily a giant, perfect graph of every URL that has ever existed. That sounds like a research project disguised as a prerequisite. But at least a practical index of:

- protected patterns, like `/api/*`, `/login`, and framework internals
- routes currently owned by the main platform
- routes that were redirected on purpose in the big migration 3 years ago
- redirects already created by the shortener
- manually reserved paths that need a human explanation
- old campaign paths that are soft-deleted, expired, or waiting for review
- ownership metadata, so someone knows who can say "yes, remove this"

The core check then becomes boring on purpose:

```ts
type RouteClaim = {
  path: string;
  owner: string;
  state: 'active' | 'reserved' | 'expired' | 'soft-deleted';
};

function canCreateVanityPath(path: string, claims: RouteClaim[]): boolean {
  if (!path.startsWith('/')) return false;
  if (path.split('/').length > 2) return false;

  return !claims.some((claim) => {
    if (claim.state === 'soft-deleted') return false;
    const isProtectedPattern = claim.path.endsWith('/*') && path.startsWith(claim.path.slice(0, -1));
    return claim.path === path || isProtectedPattern;
  });
}
```

That snippet is not the architecture. It is the shape of the anxiety.

The shortener itself wants to ask a yes/no question. The organization has to provide the facts that make the answer trustworthy.

## The second-order problem: what happens after it works

The first 20 vanity URLs are easy. Everyone remembers why they exist.

The next 100 are still manageable. There is probably a spreadsheet. It is probably wrong in small ways, but not yet dangerously wrong.

The next 1000 are where the service has to grow up.

At that point the difficult questions are not about redirects anymore:

- Who owns this link?
- Is the campaign still live?
- Can this path be reused?
- Does the destination still work?
- When was it last clicked?
- Is it safe to delete, or only safe to hide?
- If it breaks, who gets paged, emailed, or gently nudged?

Engineers usually feel this pain late, because the first version works too well. A redirect is cheap. Storage is cheap. Leaving things alone is cheap. Then one day someone asks whether `/summer` can point to the new campaign, and nobody knows whether the old `/summer` is dead, important, or load-bearing in some forgotten corner of the internet.

That is when "just make a shortener" becomes lifecycle management.

## The middle ground I still want

I still think the right answer is small.

Not the first version, because people need autonomy.

Not the second version, because a vanity URL system should not need a heavy control plane just to redirect traffic.

The version I keep circling back to is closer to this:

- an edge redirect layer that can answer very quickly
- a small admin UI for creating, pausing, and reviewing links
- explicit protected-route rules owned by engineering
- a route index fed by the platform, the shortener, and a small manual reserve list
- soft deletes and expiry dates instead of permanent mystery data
- health checks for destinations, so broken links are visible before someone complains
- ownership fields that make cleanup a normal workflow instead of an archaeology project

That is still more than the tutorial version of a URL shortener. But it is less than building a whole separate application platform around it.

Most importantly, it respects both sides of the problem.

Marketing and editorial should not need to file a ticket every time they need a clean campaign URL. That is slow, and honestly a little absurd when the operation is "reserve this string and point it there."

Engineering should not have to pretend the root domain is an empty playground. It is shared production infrastructure. It has history, contracts, old links, new launches, hidden dependencies, and users who do not care which internal team owns the route they clicked.

The tension is the product.

Not in a dramatic way. More in the ordinary platform-engineering way where the job is to turn a reasonable human request into a system that is boring enough to trust.

That is why I still like this problem. The redirect is tiny. The human workflow is real. The route space is shared in the least glamorous, most practical sense of the word.

And somewhere in the middle there is probably a very small tool that lets someone create `<domain>.se/summer` without making an engineer nervous.