---
title: "Astro ships its own zod"
description: "Content collection schemas import z from astro/zod, and zod was never in my package.json at all."
pubDate: 2026-06-15
category: til
draft: false
liveFrom: 2026-08-20
tags: ["astro", "zod", "typescript", "content-collections"]
---

This site (if we are still using Astro when you are reading this 😅) is a rebuild of an old WordPress blog, scraped back out of the Wayback Machine and a
couple of old database dumps I still had lying around. I was never happy with that WordPress
site... every time you upgrade a plugin something breaks. So when I started over I jumped
straight on the latest Astro, mostly because they had added the markdown support I wanted to
work with.

![Astro logo alongside a Markdown symbol, connected by a red heart](./til-astro-markdown.svg)

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

## Links

- [The astro/zod reference](https://docs.astro.build/en/reference/modules/astro-zod/), where Astro documents the re-export so you never install zod yourself
- [Markdown content in Astro](https://docs.astro.build/en/guides/markdown-content/), the full guide where `.md` and `.mdx` both work out of the box
