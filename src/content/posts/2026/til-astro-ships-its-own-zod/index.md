---
title: "Astro ships its own zod"
description: "Content collection schemas import z from astro/zod, and zod was never in my package.json at all."
pubDate: 2026-06-15
category: til
draft: true
tags: ["astro", "zod", "typescript", "content-collections"]
---

This site is a rebuild of an old WordPress blog, scraped back out of the Wayback Machine and a
couple of old database dumps I still had lying around. I was never happy with that WordPress
site... every time you upgrade a plugin something breaks. So when I started over I jumped
straight on the latest Astro, mostly because they had added the markdown support I wanted to
work with.

![Abstract composition of a single shape splitting into two aligned paths](./til-astro-zod-moved.svg)

I started the project asking for zod and proper typing, because I like zod and wanted the
content collections typed from day one. And that's where we started slightly wrong. I don't
remember exactly what broke, it was fixed almost instantly and nothing about it felt like a big
deal, but the fix came down to one import line:

```ts
// what a content collection schema should import
import { z } from 'astro/zod';
```

Astro bundles its own copy of zod and re-exports it at `astro/zod`, pinned to whatever version
its content loader validates with. What actually surprised me is that `zod` is not in my
`package.json` at all. `npm ls zod` shows 4.4.3 turning up three times, through `astro`,
`@astrojs/rss` and `@astrojs/sitemap`, never as something I asked for.

I hadn't seen a framework do that before... maybe it's common practice and I've just missed it,
but my thought is that following the public zod would be more best practice than pinning your
own copy. It works though, and if it works, it works 🤷

**Takeaway:** in Astro, content collection schemas import `z` from `astro/zod`, the zod you
never installed.
