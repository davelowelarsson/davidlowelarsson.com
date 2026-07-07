---
title: "TIL: Astro eats the space at inline tag boundaries"
description: A newline between prose and an inline <a> renders as no space at all — "I writeessays". Unlike HTML, which collapses it to one space.
pubDate: 2026-07-07
category: til
draft: true
tags: ["astro", "gotcha"]
---

> Draft notes from the day it happened — edit before publishing.

While polishing the landing page copy, the rendered page said "I writeessays" and "quick
notescaptured". The source looked fine:

```astro
I write
<a href="/category/essay/">essays</a>
```

In plain HTML that newline collapses to a single space. Astro's compiler instead **removes it
entirely** when it sits at the boundary between text and an inline element — in either
direction (`text\n<a>` and `</a>\ntext` both lose the space).

The fix is structural, not cosmetic: keep every inline link fully mid-line, with its
neighboring words on the same line, and only break lines between plain words. We also added an
e2e test that asserts the *rendered* text has its spaces, so a future copy edit can't quietly
reintroduce the bug.

Credit where due: an external review of the copy caught it before I did.
