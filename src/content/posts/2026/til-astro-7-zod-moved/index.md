---
title: "TIL: Astro 7 moved zod to astro/zod"
description: "Content collection schemas import zod from astro/zod now, not the zod package directly — and mixing them breaks type inference."
pubDate: 2026-04-02
category: til
draft: false
tags: ["astro", "zod", "typescript", "content-collections"]
---

> **WIP/TEST** — placeholder content while the site's design is under construction.

Upgraded this site to Astro 7 and `astro check` started complaining about `z.ZodType` mismatches
in `content.config.ts`, even though nothing in that file had changed.

![Abstract composition of a single shape splitting into two aligned paths](./til-astro-zod-moved.svg)

## The change

Astro 7 re-exports zod from `astro/zod` instead of expecting you to depend on the `zod` package
yourself. It's still zod — same API — but it's a specific version pinned by Astro, bundled so
content collection schemas always match whatever validator Astro's loader runs internally.

```ts
// before (Astro <= 6, or a stray leftover import)
import { z } from 'zod';

// after (Astro 7)
import { z } from 'astro/zod';
```

## Why it mattered here

I had one schema file importing from `astro/zod` and a leftover helper importing from `zod`
directly (still in `node_modules` as a transitive dependency of something else). Two different
`ZodType` classes, structurally identical, nominally incompatible. TypeScript treated a schema
built with one as unassignable to a type expecting the other.

Deleted the direct `zod` import, dropped the now-unused dependency, `astro check` went green.

**Takeaway:** in Astro 7, `astro/zod` is the only zod import content collections should ever see.
If a package other than `astro` pulls in `zod` transitively, keep it out of schema files.
