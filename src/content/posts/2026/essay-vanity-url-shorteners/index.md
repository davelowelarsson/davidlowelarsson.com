---
title: "The hard part of vanity URLs is not the redirect"
description: "A URL shortener looks like a tiny redirect until it shares a production domain with real services, old routes, and people who need memorable links."
pubDate: 2026-07-14
liveFrom: 2026-07-14
category: essay
draft: false
tags: ["platform-engineering", "routing", "url-shorteners", "product"]
---

On a Lab Friday in 2020 I built what I thought was a URL shortener. A few years later, one much more complicated version, and another experiment not really worthy of this article ... I still haven't solved it 😅

The ask was not strange. A colleague on the communication/campaign/marketing side wanted clean links that could be printed, spoken, and remembered by actual humans:

```txt
<domain>.se/summer
```

or:

```txt
<domain>.se/podcast
```

That is not vanity in the silly sense. It is communication. `utm_campaign=summer_2026_launch_phase_2` is useful for analytics, but nobody wants to say it on stage, or print it on a poster 😅

## I built it twice

The first version was the classic tutorial-shaped shortener. Node, Express, MongoDB, a generated ID, and a redirect endpoint. The resurrected lab version is here: [shortener-classic.saltast.com](https://shortener-classic.saltast.com/).

```ts
app.get('/:alias', async (req, res) => {
	const url = await urls.findOneAndUpdate(
		{ alias: req.params.alias },
		{ $inc: { visits: 1 } },
	);

	if (!url.value) return res.status(404).send('Not found');
	return res.redirect(301, url.value.targetUrl);
});
```

It was small, fast, and quite nice in the way small Express apps can be nice. A request came in, a lookup happened, a counter moved, and the user went somewhere else.

A big problem was that the machine picked the link. A generated ID like `qK9_2x` is fine if the only goal is to make a URL shorter, but not if the goal is to make a URL memorable. I had solved the "shortening", but not the problem. It was just automation.

The second version over-corrected. If people needed control, I would give them a dashboard with login, authentication, custom slugs, analytics and a real content model. The resurrected version is here: [shortener.saltast.com/login](https://shortener.saltast.com/login). It kind of became our "Bitly" ... but not as good ...

So it worked. People could log in, create a slug, choose the destination, and see whether anyone used it. But I had also built a decoupled frontend and a headless CMS backend for something that mostly stored a URL, a status, and a visit count. It was frankly "too much" for this problem.

The frontend needed to know where the API lived, some of that happened at build time, some at runtime, and suddenly a tiny redirect service had opinions about internal and external network paths. The two halves had to be deployed, configured, upgraded, and debugged together.

## Why not use a sitemap?

The standalone shortener is not the scary part. If we were to use a subdomain, like `s.<domain>.se`, then the shortener owns that namespace. If `/summer` exists there, it exists because the shortener created it.

But the communication team wants to use the main domain, `<domain>.se/summer`, and that is when the existing systems start pushing back.

The main domain already has routes. Some are obvious, like APIs, login, checkout, or CMS pages. Some are not so obvious, like old redirects from migrations or campaign links from last year.

SEO data and sitemaps can look like a shortcut, but a sitemap is not a map of everything the system owns. There are logged-in routes, old redirects, hidden callbacks, partner links, and dynamic spaces that return 404 today without being free (but would be a 200 if there was data published).

That 404 part is the one that keeps catching my attention. If `/program/123456` returns 404, that might only mean there is no program with that ID right now. It does not mean `/program/*` is free for a shortener to claim.

Even "fast" matching rules get weird. A prefix check for `pro` sounds harmless until someone creates `/pro-wrestling-night`, and now the system has to know that `pro` is not `/program/*`.

So I can reserve exact paths, reserve prefixes, reject ambiguous slugs and add manual review for risky words, and still not see every possible conflict before it happens. The difficult part is trusting the whole shared route space.

## What I would build now

If I did it again, and I probably will 😉, I would treat it less like a shortener and more like a tiny route ownership tool.

The redirect can be boring and fast, probably at the edge. The UI can be small, but it still needs analytics because that is one of the useful parts for campaigns. Around that I would keep ownership, review dates and the routes that other services already own.

I would also assume cleanup is part of the product from day one. The first 20 links are easy because everyone remembers why they exist. At 200, or 1000, the question is not only "does this redirect work?" It is "is this still alive, who can answer that, and can we safely remove it?"

Somewhere in the middle there is probably a very small tool that lets someone create `<domain>.se/summer` without making an engineer nervous. Taking down production should probably stay reserved for us engineers forgetting something silly like a semicolon ... not the communication team creating a campaign 💥

I will probably try a third time, we'll see if that version lands somewhere in the middle 😉